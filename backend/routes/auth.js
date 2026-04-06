import crypto from "crypto";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import express from "express";
import { Op } from "sequelize";
import validate from "../middleware/validate.js";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  googleLoginSchema,
} from "../schemas/authSchema.js";

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

const ensureProfileCompleteness = async (user) => {
  // Check if all required fields are present
  const isComplete = Boolean(
    user.firstName?.trim() &&
    user.lastName?.trim() &&
    user.bio?.trim() &&
    user.avatar_url?.trim() &&
    (user.googleId ? user.password?.trim() : true)
  );

  if (user.isProfileComplete !== isComplete) {
    user.isProfileComplete = isComplete;
    await user.save();
  }
};

// ================= REGISTER =================
router.post("/register", validate(registerSchema), async (req, res) => {
  const { name, email, password } = req.body;

  try {

    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    res.status(201).json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      name: user.name,
      email: user.email,
      role: user.role,
      bio: user.bio,
      avatar_url: user.avatar_url,
      isProfileComplete: user.isProfileComplete,
      isGoogleUser: !!user.googleId,
      hasPassword: !!user.password,
      purchasedCourses: user.purchasedCourses,
      token: generateToken(user.id),
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// ================= LOGIN =================
router.post("/login", validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;

  try {

    console.log("Login attempt for email:", email);
    const user = await User.findOne({ where: { email } });

    if (!user) {
      console.log("User not found in DB.");
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await user.matchPassword(password);
    console.log("Password match result:", isMatch);

    if (user && user.password && isMatch) {
      console.log("Login successful!");
      
      // ✅ Run completeness check on every login
      await ensureProfileCompleteness(user);

      res.json({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        avatar_url: user.avatar_url,
        isProfileComplete: user.isProfileComplete,
        isGoogleUser: !!user.googleId,
        googleId: user.googleId,
        hasPassword: !!user.password,
        purchasedCourses: user.purchasedCourses,
        token: generateToken(user.id),
      });

      // ✅ Notification Trigger (Security Alert)
      import("../controllers/notificationController.js")
        .then(({ createNotification }) => {
          createNotification(user.id, {
            title: "New Login Detected",
            message: `A new login was detected for your account at ${new Date().toLocaleString()}.`,
            type: "security",
          });
        })
        .catch((error) => {
          console.error("Failed to load notificationController or send login notification:", error);
        });
    } else {
      console.log("Login failed: password mismatch.");
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// ================= GOOGLE LOGIN =================
router.post("/google-login", validate(googleLoginSchema), async (req, res) => {
  try {
    const { idToken } = req.body;

    // Decode Firebase ID token (client verified)
    const payload = JSON.parse(
      Buffer.from(idToken.split(".")[1], "base64").toString()
    );

    const uid = payload.sub;
    const email = payload.email;
    const googleFirstName = payload.given_name || payload.givenName || "";
    const googleLastName = payload.family_name || payload.familyName || "";

    // Fallback: If both are missing but full name exists, split it
    let finalFirstName = googleFirstName;
    let finalLastName = googleLastName;
    
    if (!finalFirstName && !finalLastName && payload.name) {
      const parts = payload.name.trim().split(/\s+/);
      if (parts.length > 0) {
        finalFirstName = parts[0];
        if (parts.length > 1) {
          finalLastName = parts.slice(1).join(" ");
        }
      }
    }

    const googleAvatar = payload.picture || null;
    const name = payload.name || `${finalFirstName} ${finalLastName}`.trim() || email.split("@")[0];

    let user = await User.findOne({ where: { email } });
    let isNewUser = false;

    if (!user) {
      // First-time Google login: Fetch and store all available details
      isNewUser = true;
      user = await User.create({
        name,
        firstName: finalFirstName,
        lastName: finalLastName,
        email,
        googleId: uid,
        avatar_url: googleAvatar, // Store Google photo as initial avatar
        role: "user",
      });
    } else {
      let updatedChanges = false;

      // Link Google ID if missing
      if (!user.googleId) {
        user.googleId = uid;
        updatedChanges = true;
      }

      // Requirement: If First Name, Last Name, or Avatar is missing -> fetch directly from Google.
      if (!user.firstName && finalFirstName) {
        user.firstName = finalFirstName;
        updatedChanges = true;
      }
      if (!user.lastName && finalLastName) {
        user.lastName = finalLastName;
        updatedChanges = true;
      }
      if (!user.avatar_url && googleAvatar) {
        user.avatar_url = googleAvatar;
        updatedChanges = true;
      }

      if (updatedChanges) {
        // Update name if we updated first/last names
        user.name = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.name;
        await user.save();
      }
    }

    const token = generateToken(user.id);

    // ✅ Run completeness check on every login
    await ensureProfileCompleteness(user);

    res.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      name: user.name,
      email: user.email,
      role: user.role,
      bio: user.bio,
      avatar_url: user.avatar_url,
      isProfileComplete: user.isProfileComplete,
      isGoogleUser: !!user.googleId,
      googleId: user.googleId,
      hasPassword: !!user.password,
      isNewUser, // Dynamic flag for first-time login
      purchasedCourses: user.purchasedCourses,
      token,
    });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({ message: "Google login failed" });
  }
});

import sendEmail from "../utils/sendEmail.js";

// ================= FORGOT PASSWORD =================
router.post("/forgot-password", validate(forgotPasswordSchema), async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Set expiry (1 hour)
    user.resetPasswordExpires = Date.now() + 3600000;

    await user.save();

    // Create reset URL (Frontend URL)
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a POST request to: \n\n ${resetUrl}`;

    const html = `
      <h1>Password Reset Request</h1>
      <p>You are receiving this email because you (or someone else) has requested the reset of a password for your account.</p>
      <p>Please click on the link below to reset your password:</p>
      <a href="${resetUrl}" clicktracking=off>${resetUrl}</a>
      <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: "Password Reset Token",
        message,
        html,
      });

      res.status(200).json({ message: "Email sent" });
    } catch (err) {
      console.error("Email could not be sent", err);
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();
      return res.status(500).json({ message: "Email could not be sent" });
    }
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// ================= RESET PASSWORD =================
router.post("/reset-password/:token", validate(resetPasswordSchema), async (req, res) => {
  const { password } = req.body;

  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { [Op.gt]: Date.now() },
      },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Set new password (use set for reliable change detection)
    user.set("password", password);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    // ✅ Notification Trigger (Password Change)
    import("../controllers/notificationController.js")
      .then(({ createNotification }) => {
        createNotification(user.id, {
          title: "Password Changed",
          message: "Your password has been successfully reset. If this wasn't you, please secure your account.",
          type: "security",
        });
      })
      .catch((error) => {
        console.error("Password reset notification error:", error);
      });

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;

import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import Admin from "../models/Admin.js";

dotenv.config();

const seedAdmins = async () => {
  try {
    console.log("\n🌱 Starting admin seeding...\n");

    await connectDB();
    console.log("✅ Database connected\n");

    // 1. Super Admin Logic
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
    const superAdminName = process.env.SUPER_ADMIN_NAME;
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;

    if (superAdminEmail && superAdminName && superAdminPassword) {
      const existingSuperAdmin = await Admin.findOne({ where: { email: superAdminEmail } });
      
      if (!existingSuperAdmin) {
        await Admin.create({
          name: superAdminName,
          email: superAdminEmail,
          password: superAdminPassword,
          role: "superAdmin",
        });
        console.log(`✅ Super Admin created successfully!`);
        console.log(`   Email: ${superAdminEmail}`);
        console.log(`   Name:  ${superAdminName}\n`);
      } else {
        let updated = false;
        
        if (existingSuperAdmin.name !== superAdminName) {
          existingSuperAdmin.name = superAdminName;
          updated = true;
        }
        
        const isMatch = await existingSuperAdmin.matchPassword(superAdminPassword);
        if (!isMatch) {
          existingSuperAdmin.password = superAdminPassword;
          updated = true;
        }
        
        if (updated) {
          await existingSuperAdmin.save();
          console.log(`✅ Super Admin updated to match .env credentials: ${superAdminEmail}\n`);
        } else {
          console.log(`ℹ️  Super Admin already up to date: ${superAdminEmail}\n`);
        }
      }
    } else {
      console.log("⚠️  Super Admin credentials missing from .env. Skipping.\n");
    }

    // 2. Regular Admin Logic
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminName = process.env.ADMIN_NAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (adminEmail && adminName && adminPassword) {
      const existingAdmin = await Admin.findOne({ where: { email: adminEmail } });
      
      if (!existingAdmin) {
        await Admin.create({
          name: adminName,
          email: adminEmail,
          password: adminPassword,
          role: "admin",
        });
        console.log(`✅ Regular Admin created successfully!`);
        console.log(`   Email: ${adminEmail}`);
        console.log(`   Name:  ${adminName}\n`);
      } else {
        let updated = false;
        
        if (existingAdmin.name !== adminName) {
          existingAdmin.name = adminName;
          updated = true;
        }
        
        const isMatch = await existingAdmin.matchPassword(adminPassword);
        if (!isMatch) {
          existingAdmin.password = adminPassword;
          updated = true;
        }
        
        if (updated) {
          await existingAdmin.save();
          console.log(`✅ Regular Admin updated to match .env credentials: ${adminEmail}\n`);
        } else {
          console.log(`ℹ️  Regular Admin already up to date: ${adminEmail}\n`);
        }
      }
    } else {
      console.log("⚠️  Regular Admin credentials missing from .env. Skipping.\n");
    }

    console.log("🎉 Admin seeding completed!\n");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error seeding admins:", error.message);
    process.exit(1);
  }
};

seedAdmins();

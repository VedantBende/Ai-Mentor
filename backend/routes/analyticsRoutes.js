import express from "express";
import {
  getUserAnalytics,
  recordStudySession,
  getDashboardAnalytics,
  updateUserTasks,
} from "../controllers/analyticsController.js";
import { protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import { recordStudySessionSchema } from "../schemas/analyticsSchema.js";

const router = express.Router();

router.route("/dashboard").get(protect, getDashboardAnalytics);
router.route("/tasks").put(protect, updateUserTasks);
router.route("/").get(protect, getUserAnalytics);
router.route("/study-session").post(protect, validate(recordStudySessionSchema), recordStudySession);

export default router;

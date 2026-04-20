import { User, Course, Lesson } from "../models/modelAssociations.js";
import { Op } from "sequelize";
import { recordLogin } from "../utils/userUtils.js";

const parseLessonsCount = (lessons) => {
  if (typeof lessons !== "string") return 0;
  try {
    if (lessons.includes(" of ")) {
      const value = parseInt(lessons.split(" of ")[1], 10);
      return Number.isNaN(value) ? 0 : value;
    }
    const value = parseInt(lessons.split(" ")[0], 10);
    return Number.isNaN(value) ? 0 : value;
  } catch {
    return 0;
  }
};

const parseDurationToMinutes = (duration) => {
  if (typeof duration !== "string" && typeof duration !== "number") return 0;
  if (typeof duration === "number") return duration;

  // Clean string (e.g. "12 min" -> "12")
  const cleanStr = duration
    .toLowerCase()
    .replace(/min|m|mins|minutes/g, "")
    .trim();

  // Handle "MM:SS"
  if (cleanStr.includes(":")) {
    const [mins, secs] = cleanStr.split(":").map((val) => parseInt(val, 10) || 0);
    return mins + secs / 60;
  }

  return parseFloat(cleanStr) || 0;
};

// @desc    Get user analytics
const getUserAnalytics = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ Ensure analytics exists
    const analytics = user.analytics || {};
    res.json({
      attendance: analytics.attendance || 0,
      avgMarks: analytics.avgMarks || 0,
      dailyHours: analytics.dailyHours || 0,
      totalCourses: analytics.totalCourses || 0,
      completedCourses: analytics.completedCourses || 0,
      totalHours: analytics.totalHours || 0,
      daysStudied: analytics.daysStudied || 0,
      studySessions: analytics.studySessions || [],
      learningHoursChart: analytics.learningHoursChart || [],
      certificates: analytics.certificates || [],
    });
  } catch (error) {
    console.error("ANALYTICS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Record study session
const recordStudySession = async (req, res) => {
  try {
    const { hours, date } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ Ensure analytics object exists
    const analytics = user.analytics || {
      totalHours: 0,
      daysStudied: 0,
      studySessions: [],
      lastStudyDate: null,
      dailyHours: 0,
    };

    const sessionDate = date ? new Date(date) : new Date();
    const isNewDay = !analytics.lastStudyDate || new Date(analytics.lastStudyDate).toDateString() !== sessionDate.toDateString();

    if (isNewDay) {
      analytics.daysStudied += 1;
      analytics.lastStudyDate = sessionDate;
      analytics.dailyHours = 0;
    }

    analytics.totalHours = parseFloat((analytics.totalHours + hours).toFixed(4));
    analytics.dailyHours = parseFloat(((analytics.dailyHours || 0) + hours).toFixed(4));
    analytics.studySessions.push({ date: sessionDate, hours: hours });

    user.analytics = analytics;
    // For JSONB, we need to tell Sequelize that the object has changed
    user.changed("analytics", true);
    await user.save();

    res.json({ message: "Study session recorded successfully", analytics: user.analytics });
  } catch (error) {
    console.error("STUDY SESSION ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get dashboard analytics
const getDashboardAnalytics = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await recordLogin(user);

    const purchasedCourses = user.purchasedCourses || [];
    const courseIds = purchasedCourses.map(c => Number(c.courseId));
    
    let dbCourses = [];
    if (courseIds.length > 0) {
      dbCourses = await Course.findAll({ where: { id: { [Op.in]: courseIds } } });
    }

    let enrolledCourses = [];
    let totalCompletedLessons = 0;
    let certificatesEarned = 0;
    let sumProgress = 0;
    let totalStudyTimeSeconds = 0;

    for (const purchase of purchasedCourses) {
      const course = dbCourses.find(c => c.id === Number(purchase.courseId));
      if (!course) continue;
      
      let totalLessons = course.lessonsCount || parseLessonsCount(course.lessons) || 0;
      if (totalLessons <= 0) {
        totalLessons = (await Lesson.count({ where: { courseId: course.id } })) || 0;
      }

      const progressObj = purchase.progress || {};
      const completedArray = progressObj.completedLessons || [];
      const lessonData = progressObj.lessonData || {};
      
      // Use a Set to track unique completed lesson IDs for this course
      const uniqueCompletedIds = new Set();
      
      // 1. Add manually completed lessons
      completedArray.forEach(lesson => {
        if (lesson) {
          // Could be an object { lessonId: ... } or a direct ID string/number
          const id = String(lesson.lessonId || (typeof lesson !== 'object' ? lesson : ''));
          if (id) uniqueCompletedIds.add(id);
        }
      });
      
      // 2. Add lessons completed via watch history
      Object.entries(lessonData).forEach(([lessonId, data]) => {
        const wh = data?.watchHistory;
        if (wh) {
          // Threshold set to 85% to be more forgiving for "completed" state
          if (wh.status === "completed" || (typeof wh.progressPercent === 'number' && wh.progressPercent >= 85)) {
            uniqueCompletedIds.add(String(lessonId));
          }
        }
      });
      
      const actualCompletedLessons = Math.min(totalLessons, uniqueCompletedIds.size);
      totalCompletedLessons += actualCompletedLessons;

      if (totalLessons > 0 && actualCompletedLessons >= totalLessons) {
        certificatesEarned++;
      }

      const progressPercent = totalLessons > 0 
        ? Math.round((actualCompletedLessons / totalLessons) * 100) 
        : 0;
      sumProgress += progressPercent;

      enrolledCourses.push({
        id: course.id,
        title: course.title || "Course",
        image: course.image || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
        category: course.category || "Education",
        level: course.level || "Beginner",
        completedLessons: actualCompletedLessons,
        totalLessons,
        progress: progressPercent,
        remaining: totalLessons > actualCompletedLessons ? totalLessons - actualCompletedLessons : 0,
        completedLessonIds: Array.from(uniqueCompletedIds)
      });
    }

    // --- ACCURATE COMPLETION-BASED STUDY TIME CALCULATION ---
    // Collect all unique completed lesson IDs across all enrolled courses
    const allFinishedIds = new Set();
    enrolledCourses.forEach(c => {
      if (c.completedLessonIds) {
        c.completedLessonIds.forEach(id => allFinishedIds.add(id));
      }
    });

    if (allFinishedIds.size > 0) {
      const lessonsData = await Lesson.findAll({
        where: { id: { [Op.in]: Array.from(allFinishedIds) } },
        attributes: ['id', 'duration']
      });

      let totalMinutes = 0;
      lessonsData.forEach(l => {
        totalMinutes += parseDurationToMinutes(l.duration);
      });
      totalStudyTimeSeconds = Math.round(totalMinutes * 60);
    }

    const totalEnrolled = enrolledCourses.length;
    const ongoingCourses = totalEnrolled > 0 
      ? enrolledCourses.filter(c => c.progress < 100 && c.progress > 0).length 
      : 0;
    const averageProgress = totalEnrolled > 0 
      ? Math.round(sumProgress / totalEnrolled) 
      : 0;

    const loginHistory = user.loginHistory || [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const startOfCurrentMonth = new Date(currentYear, currentMonth, 1);
    
    // Denominator = Total days in the current month (dynamic: 28, 29, 30, or 31)
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate(); 

    const monthlyLogins = loginHistory.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= startOfCurrentMonth;
    });
    
    const uniqueDates = new Set(monthlyLogins.map(entry => entry.date.split("T")[0]));
    const attendanceRate = Math.round((uniqueDates.size / daysInMonth) * 100);

    let currentStreak = 0;
    const nowUTC = new Date();
    const todayUTC = new Date(Date.UTC(nowUTC.getUTCFullYear(), nowUTC.getUTCMonth(), nowUTC.getUTCDate()));
    const todayTime = todayUTC.getTime();

    const sortedLogins = [...loginHistory].map(e => {
      const d = new Date(e.date);
      // Normalize to UTC midnight
      const utcD = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
      return utcD.getTime();
    }).sort((a, b) => b - a);
    const uniqueSortedLogins = [...new Set(sortedLogins)];

    if (uniqueSortedLogins.length > 0) {
      let expectedDate = todayTime;
      // If the latest login is not today, check if it was yesterday
      if (uniqueSortedLogins[0] !== expectedDate) {
        expectedDate -= 86400000;
      }
      
      for (const loginTime of uniqueSortedLogins) {
        if (loginTime === expectedDate) {
          currentStreak++;
          expectedDate -= 86400000;
        } else {
          break;
        }
      }
    }


    res.json({
      enrolledCourses,
      totalEnrolled,
      ongoingCourses,
      attendanceRate,
      currentStreak,
      certificatesEarned,
      averageProgress,
      totalCompletedLessons,
      totalStudyTimeSeconds,
      calendarTasks: user.analytics?.calendarTasks || {}
    });
  } catch (error) {
    console.error("DASHBOARD ANALYTICS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update user calendar tasks
const updateUserTasks = async (req, res) => {
  try {
    const { tasks } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const analytics = user.analytics || {};
    analytics.calendarTasks = tasks || {};

    user.set("analytics", analytics);
    user.changed("analytics", true);
    await user.save();

    res.json({ message: "Tasks updated successfully", calendarTasks: user.analytics.calendarTasks });
  } catch (error) {
    console.error("UPDATE TASKS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export { getUserAnalytics, recordStudySession, getDashboardAnalytics, updateUserTasks };

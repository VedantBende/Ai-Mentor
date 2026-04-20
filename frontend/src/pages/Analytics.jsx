import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  BookOpen, 
  Calendar, 
  TrendingUp, 
  Award,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  Target,
  Zap,
  BarChart3,
  User,
  Settings,
  LogOut,
  Bell,
  Search,
  Menu
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

const Analytics = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const [courses, setCourses] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [tasks, setTasks] = useState({});
  const [newTask, setNewTask] = useState("");
  const [activeTab, setActiveTab] = useState("courses");
  const searchQuery = "";


  const statusEmojis = {
    Completed: "✅",
    Ongoing: "🔄",
    Upcoming: "📅",
  };

  const statusIcons = {
    Completed: <CheckCircle className="w-4 h-4 text-[#28A745]" />,
    Ongoing: <Clock className="w-4 h-4 text-[#FFC107]" />,
    Upcoming: <AlertCircle className="w-4 h-4 text-[#CCCCCC]" />,
  };

  const formatDateKey = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  // Fetch courses and analytics
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const coursesRes = await fetch("/api/courses", { headers });
        const analyticsRes = await fetch("/api/analytics/dashboard", { headers });

        const coursesData = await coursesRes.json();
        const analyticsData = await analyticsRes.json();

        setCourses(coursesData);
        setAnalyticsData(analyticsData);
      } catch (err) {
        console.error(err);
      } finally {
        setAnalyticsLoading(false);
      }
    };

    if (user) fetchData();
  }, [user]);


  // Streak logic is handled by the backend analyticsData.currentStreak

  // Load tasks from analytics response
  useEffect(() => {
    if (analyticsData?.calendarTasks) {
      setTasks(analyticsData.calendarTasks);
    }
    setSelectedDate(formatDateKey(new Date()));
  }, [analyticsData]);

  // Save tasks to database on change
  useEffect(() => {
    const saveTasks = async () => {
      if (!analyticsData) return; // Wait for initial load
      try {
        const token = localStorage.getItem("token");
        await fetch("/api/analytics/tasks", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ tasks }),
        });
      } catch (err) {
        console.error("Error saving tasks:", err);
      }
    };

    saveTasks();
  }, [tasks]);


  const totalCourses = analyticsData?.totalEnrolled || 0;
  const certificates = analyticsData?.certificatesEarned || 0;
  const attendance = analyticsData?.attendanceRate || 0;
  const displayStreak = analyticsData?.currentStreak || 0;

  const addTask = () => {
    if (!newTask.trim()) return;
    const dateKey = selectedDate || formatDateKey(new Date());
    setTasks((prev) => ({
      ...prev,
      [dateKey]: [
        ...(prev[dateKey] || []),
        { text: newTask.trim(), status: "Upcoming" },
      ],
    }));
    setNewTask("");
  };

  if (analyticsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="w-12 h-12 border-4 border-[#ff6d34] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const updateTaskStatus = (index, status) => {
    if (!tasks[selectedDate]) return;
    setTasks((prev) => {
      const updated = [...prev[selectedDate]];
      updated[index].status = status;
      return { ...prev, [selectedDate]: updated };
    });
  };

  const deleteTask = (index) => {
    if (!tasks[selectedDate]) return;
    const updated = [...tasks[selectedDate]];
    updated.splice(index, 1);
    setTasks({ ...tasks, [selectedDate]: updated });
  };

  const handlePrevMonth = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  // const getDateKey = (day) =>
  //   formatDateKey(
  //     new Date(currentDate.getFullYear(), currentDate.getMonth(), day),
  //   );

  const myCourses = analyticsData?.enrolledCourses || [];

  // Filter courses based on search
  const filteredCourses = myCourses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate total study time (convert seconds to hours)
  const totalStudyTimeSeconds = analyticsData?.totalStudyTimeSeconds || 0;
  const averageProgress = analyticsData?.averageProgress || 0;
  const ongoingCourses = analyticsData?.ongoingCourses || 0;

  return (
    <>
        <main className="p-4 md:p-6 lg:p-8">

          {/* Welcome Section */}
          <div className="mb-6 lg:mb-8 mt-2 lg:mt-0">
            <h1 className="text-xl lg:text-3xl font-bold text-[#2D3436] dark:text-white uppercase tracking-tight lg:normal-case lg:tracking-normal">
              {t('analytics.welcome_back_user', { name: user?.name || 'Learner' })}
            </h1>
            <p className="text-[#2D3436]/70 dark:text-gray-400 mt-1 lg:mt-2 text-sm lg:text-lg">
              {t('analytics.analytics_subtitle')}
            </p>
          </div>

          {/* METRICS & QUICK STATS GRID */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-4 lg:mb-6">
            {[
              {
                label: t('analytics.enrolled_courses'),
                value: totalCourses,
                icon: <BookOpen className="w-6 h-6 text-[#00bea3]" />,
                bgColor: "bg-[#00bea3]/10 dark:bg-[#00bea3]/20",
                textColor: "text-[#00bea3]",
                trend: t('dashboard.ongoing_courses_progress', { count: ongoingCourses, defaultValue: `${ongoingCourses} in progress` })
              },
              {
                label: t('analytics.attendance_rate'),
                value: `${attendance}%`,
                icon: <BarChart3 className="w-6 h-6 text-[#28A745]" />,
                bgColor: "bg-[#28A745]/10 dark:bg-[#28A745]/20",
                textColor: "text-[#28A745]",
                trend: attendance > 70 ? t('analytics.great_consistency', { defaultValue: '👍 Great consistency' }) : t('analytics.needs_improvement', { defaultValue: '👀 Needs improvement' })
              },
              {
                label: t('analytics.current_streak_label'),
                value: displayStreak,
                icon: <Zap className="w-6 h-6 text-[#FFC107]" />,
                bgColor: "bg-[#FFC107]/10 dark:bg-[#FFC107]/20",
                textColor: "text-[#FFC107]",
                trend: t('analytics.streak_days', { count: displayStreak })
              },
              {
                label: t('analytics.certificates'),
                value: certificates,
                icon: <Award className="w-6 h-6 text-[#ff6d34]" />,
                bgColor: "bg-[#ff6d34]/10 dark:bg-[#ff6d34]/20",
                textColor: "text-[#ff6d34]",
                trend: certificates > 0 ? t('analytics.achievements_unlocked') : t('analytics.complete_to_earn')
              },
            ].map((metric, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-[#27272A] rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-md lg:shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-full"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm lg:text-base text-[#2D3436]/60 dark:text-gray-400 truncate">{metric.label}</div>
                    <div className={`text-xl lg:text-3xl font-bold ${metric.textColor} mt-0.5 truncate`}>
                      {metric.value}
                    </div>
                  </div>
                  {metric.icon && (
                    <div className={`hidden lg:flex ${metric.bgColor} p-3 rounded-xl flex-shrink-0`}>
                      {metric.icon}
                    </div>
                  )}
                </div>
                <div className="mt-2 lg:mt-4 flex items-center gap-1 text-[10px] lg:text-xs text-[#2D3436]/60 dark:text-gray-400">
                  <TrendingUp className="w-2.5 lg:w-3 h-2.5 lg:h-3" />
                  <span className="truncate">{metric.trend}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8 lg:mb-12">
            <div className="bg-white dark:bg-[#27272A] rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-sm lg:shadow-md flex flex-col justify-between h-full hover:shadow-lg transition-all">
              <div>
                <div className="text-sm lg:text-base text-[#2D3436]/60 dark:text-gray-400">{t('analytics.average_progress')}</div>
                <div className="text-xl lg:text-3xl font-bold text-[#00bea3] mt-0.5">{averageProgress}%</div>
              </div>
              <div className="w-full bg-[#F5F5F5] dark:bg-gray-700 rounded-full h-1.5 mt-4">
                <div 
                  className="bg-gradient-to-r from-[#00bea3] to-[#ff6d34] h-1.5 rounded-full transition-all duration-500" 
                  style={{ width: `${averageProgress}%` }}
                ></div>
              </div>
            </div>
            <div className="bg-white dark:bg-[#27272A] rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-sm lg:shadow-md flex flex-col justify-between h-full hover:shadow-lg transition-all">
              <div>
                <div className="text-sm lg:text-base text-[#2D3436]/60 dark:text-gray-400">{t('analytics.completed_lessons_count')}</div>
                <div className="text-xl lg:text-3xl font-bold text-[#28A745] mt-0.5">
                  {analyticsData?.totalCompletedLessons || 0}
                </div>
              </div>
              <div className="text-xs lg:text-sm text-[#2D3436]/50 dark:text-gray-500 mt-4">{t('analytics.across_all_courses')}</div>
            </div>
            <div className="bg-white dark:bg-[#27272A] rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-sm lg:shadow-md flex flex-col justify-between h-full hover:shadow-lg transition-all">
              <div>
                <div className="text-sm lg:text-base text-[#2D3436]/60 dark:text-gray-400">{t('analytics.total_study_time_label')}</div>
                <div className="text-xl lg:text-3xl font-bold text-[#ff6d34] mt-0.5">
                  {totalStudyTimeSeconds >= 3600 
                    ? `${(totalStudyTimeSeconds / 3600).toFixed(1)} ${t('analytics.hours_unit', { defaultValue: 'hrs' })}`
                    : `${Math.round(totalStudyTimeSeconds / 60)} ${t('analytics.minutes_unit', { defaultValue: 'mins' })}`}
                </div>
              </div>
              <div className="text-xs lg:text-sm text-[#2D3436]/50 dark:text-gray-500 mt-4">{t('analytics.this_month')}</div>
            </div>
            <div className="bg-white dark:bg-[#27272A] rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-sm lg:shadow-md flex flex-col justify-between h-full hover:shadow-lg transition-all">
              <div>
                <div className="text-sm lg:text-base text-[#2D3436]/60 dark:text-gray-400">{t('analytics.upcoming_tasks_count')}</div>
                <div className="text-xl lg:text-3xl font-bold text-[#FFC107] mt-0.5">
                  {Object.values(tasks).flat().filter(t => t.status === "Upcoming").length}
                </div>
              </div>
              <div className="text-xs lg:text-sm text-[#2D3436]/50 dark:text-gray-500 mt-4">{t('analytics.need_attention')}</div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex w-full lg:w-auto gap-0 lg:gap-2 mb-6 border-b border-[#CCCCCC] dark:border-gray-700">
            <button
              onClick={() => setActiveTab("courses")}
              className={`flex-1 lg:flex-none text-center lg:text-left px-4 py-3 font-medium transition-colors relative ${
                activeTab === "courses"
                  ? "text-[#ff6d34]"
                  : "text-[#2D3436]/60 hover:text-[#2D3436] dark:text-gray-400"
              }`}
            >
              {t('analytics.my_courses_tab')}
              {activeTab === "courses" && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#ff6d34] shadow-[0_0_8px_rgba(255,109,52,0.5)]"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("calendar")}
              className={`flex-1 lg:flex-none text-center lg:text-left px-4 py-3 font-medium transition-colors relative ${
                activeTab === "calendar"
                  ? "text-[#ff6d34]"
                  : "text-[#2D3436]/60 hover:text-[#2D3436] dark:text-gray-400"
              }`}
            >
              {t('analytics.calendar_tasks_tab')}
              {activeTab === "calendar" && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#ff6d34] shadow-[0_0_8px_rgba(255,109,52,0.5)]"></span>
              )}
            </button>
          </div>

          {activeTab === "courses" && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6 gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-[#2D3436] dark:text-white flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-[#00bea3] flex-shrink-0" />
                  <span className="truncate">{t('analytics.my_courses_tab')}</span>
                  <span className="text-xs sm:text-sm font-normal text-[#2D3436]/60 dark:text-gray-400 bg-[#F5F5F5] dark:bg-gray-700 px-1.5 py-0.5 rounded-full flex-shrink-0">
                    {filteredCourses.length}
                  </span>
                </h2>
                <Link
                  to="/courses"
                  className="text-[#ff6d34] hover:text-[#ff6d34]/80 text-xs sm:text-sm font-medium flex items-center gap-0.5 sm:gap-1 whitespace-nowrap flex-shrink-0"
                >
                  {t('analytics.browse_all_courses')}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              
              <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-lg overflow-hidden border border-[#CCCCCC]/30 dark:border-gray-700">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-[#F5F5F5] dark:bg-gray-700/50">
                      <tr>
                        <th className="px-6 py-4 text-xs font-semibold text-[#2D3436]/70 dark:text-gray-300 uppercase tracking-wider min-w-[300px]">{t('analytics.table_course')}</th>
                        <th className="px-6 py-4 text-xs font-semibold text-[#2D3436]/70 dark:text-gray-300 uppercase tracking-wider min-w-[160px]">{t('analytics.table_progress')}</th>
                        <th className="px-6 py-4 text-xs font-semibold text-[#2D3436]/70 dark:text-gray-300 uppercase tracking-wider min-w-[120px]">{t('analytics.table_lessons')}</th>
                        <th className="px-6 py-4 text-xs font-semibold text-[#2D3436]/70 dark:text-gray-300 uppercase tracking-wider min-w-[100px]">{t('analytics.table_level')}</th>
                        <th className="px-6 py-4 text-xs font-semibold text-[#2D3436]/70 dark:text-gray-300 uppercase tracking-wider text-right sm:text-left min-w-[120px]">{t('analytics.table_action')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#CCCCCC]/50 dark:divide-gray-700">
                      {filteredCourses.length > 0 ? (
                        filteredCourses.map((course) => (
                          <tr 
                            key={course.id} 
                            className="hover:bg-[#F5F5F5] dark:hover:bg-gray-700/30 transition-colors group"
                          >
                            <td className="px-4 sm:px-6 py-4">
                              <Link to={`/learning/${course.id}`} className="flex items-center gap-3 sm:gap-4 overflow-visible">
                                <div className="relative flex-shrink-0">
                                  <img 
                                    src={course.image} 
                                    alt="" 
                                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover group-hover:scale-105 transition-transform duration-300" 
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold text-[#2D3436] dark:text-white text-sm sm:text-base leading-snug break-words">
                                    {course.title}
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] px-1.5 py-0.5 bg-[#F5F5F5] dark:bg-gray-700 rounded-full text-[#2D3436]/70 dark:text-gray-300 whitespace-nowrap">
                                      {course.category}
                                    </span>
                                  </div>
                                </div>
                              </Link>
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              <div className="w-40">
                                <div className="flex justify-between mb-1">
                                  <span className="text-[10px] sm:text-xs font-medium text-[#2D3436] dark:text-gray-300">
                                    {course.progress}%
                                  </span>
                                </div>
                                <div className="w-full bg-[#F5F5F5] dark:bg-gray-700 rounded-full h-1.5 sm:h-2 overflow-hidden">
                                  <div 
                                    className="bg-gradient-to-r from-[#00bea3] to-[#ff6d34] h-full rounded-full relative"
                                    style={{ width: `${course.progress}%` }}
                                  >
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1">
                                <CheckCircle className="w-4 h-4 text-[#28A745]" />
                                <span className="text-sm text-[#2D3436]/70 dark:text-gray-300">
                                  <span className="font-semibold text-[#00bea3]">{course.completedLessons}</span>
                                  <span className="mx-1 text-gray-300">/</span>
                                  <span>{course.totalLessons}</span>
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 text-xs rounded-full font-medium whitespace-nowrap ${
                                course.level === 'Beginner' 
                                  ? 'bg-green-100 text-[#28A745] dark:bg-green-900/30 dark:text-[#28A745]' 
                                  : course.level === 'Intermediate' 
                                  ? 'bg-blue-100 text-[#00bea3] dark:bg-blue-900/30 dark:text-[#00bea3]' 
                                  : 'bg-orange-100 text-[#ff6d34] dark:bg-orange-900/30 dark:text-[#ff6d34]'
                              }`}>
                                {course.level}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-4 text-right sm:text-left">
                              <Link
                                to={course.progress === 100 ? "/certificates" : `/learning/${course.id}`}
                                className={`inline-flex items-center gap-0.5 sm:gap-1 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                                  course.progress === 100 
                                    ? 'text-[#28A745] hover:text-[#28A745]/80' 
                                    : 'text-[#ff6d34] hover:text-[#ff6d34]/80'
                                }`}
                              >
                                {course.progress === 100 ? t('analytics.certificate_btn') : t('analytics.continue_btn')}
                                <ChevronRight className="w-4 h-4" />
                              </Link>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="px-6 py-16 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                              <p className="text-[#2D3436]/60 dark:text-gray-400">
                                {searchQuery ? t('analytics.no_courses_match') : t('analytics.no_courses_enrolled')}
                              </p>
                              {!searchQuery && (
                                <Link 
                                  to="/courses" 
                                  className="px-4 py-2 bg-[#ff6d34] text-white rounded-lg hover:bg-[#ff6d34]/90 transition"
                                >
                                  {t('analytics.browse_courses_btn')}
                                </Link>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "calendar" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* CALENDAR */}
              <div className="lg:col-span-2 bg-white dark:bg-[#1A1A1A] rounded-2xl p-6 shadow-lg">
                {/* Month Navigation */}
                <div className="flex justify-between items-center mb-6">
                  <button
                    onClick={handlePrevMonth}
                    className="p-2 rounded-lg hover:bg-[#F5F5F5] dark:hover:bg-gray-700 transition group"
                  >
                    <ChevronLeft className="w-5 h-5 text-[#2D3436]/60 dark:text-gray-400 group-hover:text-[#ff6d34]" />
                  </button>
                  <span className="text-xl font-bold text-[#2D3436] dark:text-white">
                    {currentDate.toLocaleString(i18n.language, {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <button
                    onClick={handleNextMonth}
                    className="p-2 rounded-lg hover:bg-[#F5F5F5] dark:hover:bg-gray-700 transition group"
                  >
                    <ChevronRight className="w-5 h-5 text-[#2D3436]/60 dark:text-gray-400 group-hover:text-[#ff6d34]" />
                  </button>
                </div>

                {/* Weekdays */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                  {[0, 1, 2, 3, 4, 5, 6].map((d) => {
                    const date = new Date(2021, 0, 3 + d); // 2021-01-03 was a Sunday
                    return (
                      <div key={d} className="text-center text-[10px] sm:text-xs md:text-sm font-medium text-[#2D3436]/60 dark:text-gray-400">
                        <span className="hidden sm:inline">{date.toLocaleString(i18n.language, { weekday: 'short' })}</span>
                        <span className="inline sm:hidden">{date.toLocaleString(i18n.language, { weekday: 'narrow' })}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {(() => {
                    const year = currentDate.getFullYear();
                    const month = currentDate.getMonth();
                    const firstDay = new Date(year, month, 1).getDay();
                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                    
                    const prevMonthDays = new Date(year, month, 0).getDate();
                    const prevMonth = new Date(year, month - 1);
                    const nextMonth = new Date(year, month + 1);
                    
                    const allDays = [];
                    
                    // Track if we've already shown the month name for previous month
                    let hasShownPrevMonthName = false;
                    let hasShownNextMonthName = false;
                    
                    // Add previous month's days
                    for (let i = firstDay - 1; i >= 0; i--) {
                      const dayNum = prevMonthDays - i;
                      allDays.push({
                        day: dayNum,
                        month: prevMonth.getMonth(),
                        year: prevMonth.getFullYear(),
                        isCurrentMonth: false,
                        isClickable: false,
                        showMonthName: !hasShownPrevMonthName && i === 0
                      });
                      if (i === 0) hasShownPrevMonthName = true;
                    }
                    
                    // Add current month's days
                    for (let i = 1; i <= daysInMonth; i++) {
                      allDays.push({
                        day: i,
                        month: month,
                        year: year,
                        isCurrentMonth: true,
                        isClickable: true,
                        showMonthName: false
                      });
                    }
                    
                    // Add next month's days
                    const remainingCells = 42 - allDays.length;
                    for (let i = 1; i <= remainingCells; i++) {
                      allDays.push({
                        day: i,
                        month: nextMonth.getMonth(),
                        year: nextMonth.getFullYear(),
                        isCurrentMonth: false,
                        isClickable: false,
                        showMonthName: !hasShownNextMonthName && i === 1
                      });
                      if (i === 1) hasShownNextMonthName = true;
                    }
                    
                    return allDays.map((dayInfo, index) => {
                      const key = formatDateKey(new Date(dayInfo.year, dayInfo.month, dayInfo.day));
                      const isToday = key === formatDateKey(new Date());
                      const taskList = tasks[key] || [];
                      const displayTasks = taskList.slice(0, 2);
                      const remainingCount = Math.max(taskList.length - displayTasks.length, 0);
                      
                      const allTasksCompleted = taskList.length > 0 && taskList.every(task => task.status === "Completed");
                      const hasAnyTask = taskList.length > 0;
                      const hasIncompleteTasks = hasAnyTask && !allTasksCompleted;
                      
                      const monthName = dayInfo.showMonthName 
                        ? new Date(dayInfo.year, dayInfo.month, 1).toLocaleString(i18n.language, { month: 'short' })
                        : '';
                      
                      return (
                        <div
                          key={index}
                          onClick={() => {
                            if (dayInfo.isClickable) {
                              setSelectedDate(key);
                            }
                          }}
                          className={`relative h-16 sm:h-20 md:h-24 rounded-xl p-1 sm:p-2 transition-all duration-300
                            ${dayInfo.isClickable && selectedDate === key 
                              ? 'ring-2 ring-[#ff6d34] shadow-lg scale-105 z-10' 
                              : dayInfo.isClickable 
                              ? 'hover:ring-1 hover:ring-[#CCCCCC] dark:hover:ring-gray-600 cursor-pointer'
                              : 'cursor-default opacity-70'
                            }
                            ${isToday && dayInfo.isCurrentMonth
                              ? 'bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-[#ff6d34]/30 dark:to-[#FFC107]/30 border-2 border-[#ff6d34]' 
                              : allTasksCompleted && dayInfo.isCurrentMonth
                              ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-[#28A745]/40 dark:to-[#28A745]/40 border border-[#28A745] dark:border-[#28A745]'
                              : hasIncompleteTasks && dayInfo.isCurrentMonth
                              ? 'bg-white dark:bg-[#0F0F0F] border-l-4 border-l-[#FFC107]'
                              : dayInfo.isCurrentMonth 
                              ? 'bg-white dark:bg-[#0F0F0F]'
                              : 'bg-[#F5F5F5] dark:bg-[#0F0F0F]/50'
                            }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                              <span className={`text-xs sm:text-sm font-semibold ${
                                isToday && dayInfo.isCurrentMonth 
                                  ? 'text-[#ff6d34] dark:text-[#ff6d34]' 
                                  : dayInfo.isCurrentMonth
                                  ? 'text-[#2D3436] dark:text-gray-300'
                                  : 'text-[#2D3436]/50 dark:text-gray-500'
                              }`}>
                                {dayInfo.day}
                              </span>
                              {monthName && (
                                <span className="text-[8px] sm:text-[10px] font-medium text-[#2D3436]/50 dark:text-gray-500 mt-0.5">
                                  {monthName}
                                </span>
                              )}
                            </div>
                            {hasAnyTask && dayInfo.isCurrentMonth && (
                              <div className="flex gap-1">
                                {allTasksCompleted ? (
                                  <CheckCircle className="w-3 h-3 sm:w-4 h-4 text-[#28A745]" />
                                ) : (
                                  <span className="text-[8px] sm:text-xs bg-[#ff6d34]/10 text-[#ff6d34] dark:bg-[#ff6d34]/30 dark:text-[#ff6d34] px-1 sm:px-1.5 rounded-full">
                                    {taskList.length}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {hasAnyTask && dayInfo.isCurrentMonth && (
                            <>
                              <div className="hidden sm:block mt-1 space-y-0.5">
                                {displayTasks.map((task, idx) => (
                                  <div key={idx} className="flex items-center gap-1 text-[10px]">
                                    <span>{statusEmojis[task.status]}</span>
                                    <span className="truncate text-[#2D3436]/70 dark:text-gray-400">{task.text}</span>
                                  </div>
                                ))}
                                {remainingCount > 0 && (
                                  <div className="text-[9px] text-[#2D3436]/50 dark:text-gray-500">
                                    +{remainingCount} {t('common.more', { defaultValue: 'more' })}
                                  </div>
                                )}
                              </div>
                              
                              <div className="sm:hidden flex justify-center mt-1">
                                <div className={`w-1.5 h-1.5 rounded-full ${allTasksCompleted ? 'bg-[#28A745]' : 'bg-[#ff6d34]'}`}></div>
                              </div>
                              
                              {hasIncompleteTasks && taskList.length > 1 && (
                                <div className="absolute bottom-1 left-1.5 right-1.5 h-0.5 sm:h-1 bg-[#F5F5F5] dark:bg-gray-700 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-[#28A745] rounded-full transition-all duration-300"
                                    style={{ width: `${(taskList.filter(t => t.status === "Completed").length / taskList.length) * 100}%` }}
                                  ></div>
                                </div>
                              )}
                            </>
                          )}
                          
                          {!dayInfo.isClickable && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="w-full h-full bg-white/50 dark:bg-black/30 rounded-xl"></div>
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Legend */}
                <div className="grid grid-cols-2 md:flex md:flex-wrap items-center gap-2 sm:gap-4 mt-6 pt-4 border-t border-[#CCCCCC] dark:border-gray-700">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-[#ff6d34]"></div>
                    <span className="text-[10px] sm:text-xs text-[#2D3436]/70 dark:text-gray-400">{t('analytics.legend_today')}</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-gradient-to-br from-green-50 to-emerald-50 border border-[#28A745]"></div>
                    <span className="text-[10px] sm:text-xs text-[#2D3436]/70 dark:text-gray-400">{t('analytics.legend_all_completed')}</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white dark:bg-[#0F0F0F] border-l-4 border-l-[#FFC107]"></div>
                    <span className="text-[10px] sm:text-xs text-[#2D3436]/70 dark:text-gray-400">{t('analytics.legend_tasks_pending')}</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#F5F5F5] dark:bg-[#0F0F0F]/50 border border-[#CCCCCC] dark:border-gray-600"></div>
                    <span className="text-[10px] sm:text-xs text-[#2D3436]/70 dark:text-gray-400">{t('analytics.legend_other_month')}</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-xs sm:text-sm">✅</span>
                    <span className="text-[10px] sm:text-xs text-[#2D3436]/70 dark:text-gray-400">{t('analytics.status_completed')}</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-xs sm:text-sm">🔄</span>
                    <span className="text-[10px] sm:text-xs text-[#2D3436]/70 dark:text-gray-400">{t('analytics.status_ongoing')}</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-xs sm:text-sm">📅</span>
                    <span className="text-[10px] sm:text-xs text-[#2D3436]/70 dark:text-gray-400">{t('analytics.status_upcoming')}</span>
                  </div>
                </div>
              </div>

              {/* TASK PANEL */}
              <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-[#2D3436] dark:text-white flex items-center gap-2">
                    <Target className="w-5 h-5 text-[#ff6d34]" />
                    {t('analytics.tasks_for_date', { date: selectedDate })}
                  </h3>
                </div>

                <div className="flex gap-2 mb-6">
                  <input
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addTask()}
                    className="flex-1 border border-[#CCCCCC] dark:border-gray-700 dark:bg-gray-900 dark:text-white p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff6d34] transition placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    placeholder={t('analytics.add_task_placeholder')}
                  />

                  <button
                    onClick={addTask}
                    className="bg-[#ff6d34] hover:bg-[#ff6d34]/90 text-white px-4 rounded-xl transition flex items-center justify-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    {t('analytics.add_btn')}
                  </button>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {(tasks[selectedDate] || []).length > 0 ? (
                    (tasks[selectedDate] || []).map((task, i) => (
                      <div
                        key={i}
                        className={`group relative flex items-center gap-3 p-3 rounded-xl transition-all
                          ${task.status === "Completed" 
                            ? 'bg-[#28A745]/10 dark:bg-[#28A745]/20' 
                            : 'bg-[#F5F5F5] dark:bg-gray-700/50 hover:bg-[#CCCCCC]/30 dark:hover:bg-gray-700'
                          }`}
                      >
                        <div className="flex-shrink-0">
                          {statusIcons[task.status]}
                        </div>
                        <span className={`flex-1 text-sm line-clamp-2 ${
                          task.status === "Completed" 
                            ? 'line-through text-gray-500 dark:text-gray-400' 
                            : 'text-[#2D3436] dark:text-gray-300'
                        }`}>
                          {task.text}
                        </span>
                        
                        <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <select
                            value={task.status}
                            onChange={(e) => updateTaskStatus(i, e.target.value)}
                            className="bg-white dark:bg-gray-800 border border-[#CCCCCC] dark:border-gray-600 rounded-lg p-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#ff6d34] text-[#2D3436] dark:text-gray-300"
                          >
                            <option value="Upcoming">📅 Upcoming</option>
                            <option value="Ongoing">🔄 Ongoing</option>
                            <option value="Completed">✅ Done</option>
                          </select>
                          <button
                            onClick={() => deleteTask(i)}
                            className="text-gray-400 hover:text-red-500 transition p-1 text-lg leading-none"
                            aria-label="Delete task"
                          >
                            ×
                          </button>
                        </div>

                        {task.status === "Completed" && (
                          <div className="absolute bottom-0 left-0 h-0.5 bg-[#28A745] rounded-full w-full"></div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-[#F5F5F5] dark:bg-gray-800 rounded-full mb-3">
                        <Target className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-[#2D3436]/60 dark:text-gray-400 text-sm">No tasks for this day</p>
                      <p className="text-xs text-[#2D3436]/50 dark:text-gray-500 mt-1">Add a task to get started</p>
                    </div>
                  )}
                </div>

                {tasks[selectedDate] && tasks[selectedDate].length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[#CCCCCC] dark:border-gray-700">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#2D3436]/60 dark:text-gray-400">Completed:</span>
                      <span className="font-medium text-[#28A745]">
                        {tasks[selectedDate].filter(t => t.status === "Completed").length}/{tasks[selectedDate].length}
                      </span>
                    </div>
                    <div className="w-full bg-[#F5F5F5] rounded-full h-1.5 mt-2">
                      <div 
                        className="bg-[#28A745] h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${(tasks[selectedDate].filter(t => t.status === "Completed").length / tasks[selectedDate].length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </>
  );
};

export default Analytics;
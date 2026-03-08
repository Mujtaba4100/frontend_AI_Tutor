"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import type { Enrollment, CourseProgress, StudyStreak } from "@/types";
import {
  BookOpen,
  Flame,
  Trophy,
  Clock,
  ChevronRight,
  Loader2,
  Play,
} from "lucide-react";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [progresses, setProgresses] = useState<Record<string, CourseProgress>>({});
  const [streak, setStreak] = useState<StudyStreak | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        // Only fetch enrollments for students
        // Instructors shouldn't see enrolled courses (they create courses)
        if (user.role === "student") {
          const [enrollmentData, streakData] = await Promise.all([
            api.getEnrollments(),
            api.getStreak().catch(() => null),
          ]);
          
          setEnrollments(enrollmentData);
          setStreak(streakData);

          // Fetch progress for each enrollment
          const progressPromises = enrollmentData.map((e) =>
            api.getCourseProgress(e.course_id).then((p) => ({ courseId: e.course_id, progress: p }))
          );
          const progressResults = await Promise.all(progressPromises);
          const progressMap: Record<string, CourseProgress> = {};
          progressResults.forEach(({ courseId, progress }) => {
            progressMap[courseId] = progress;
          });
          setProgresses(progressMap);
        } else {
          // For instructors, just fetch streak
          const streakData = await api.getStreak().catch(() => null);
          setStreak(streakData);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchData();
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please log in to view your dashboard</p>
          <Link
            href="/login"
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
          >
            Log in
          </Link>
        </div>
      </div>
    );
  }

  const totalLessonsCompleted = Object.values(progresses).reduce(
    (sum, p) => sum + p.lessons_completed,
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user.full_name.split(" ")[0]}! 👋
        </h1>
        <p className="text-gray-600 mt-2">
          Continue your learning journey where you left off.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={BookOpen}
          label={user.role === "student" ? "Enrolled Courses" : "Your Courses"}
          value={user.role === "student" ? enrollments.length : 0}
          color="indigo"
        />
        <StatCard
          icon={Trophy}
          label="Lessons Completed"
          value={user.role === "student" ? totalLessonsCompleted : 0}
          color="green"
        />
        <StatCard
          icon={Flame}
          label="Current Streak"
          value={`${streak?.current_streak || 0} days`}
          color="orange"
        />
        <StatCard
          icon={Clock}
          label="Longest Streak"
          value={`${streak?.longest_streak || 0} days`}
          color="purple"
        />
      </div>

      {/* Continue Learning Section - Only for Students */}
      {user.role === "student" && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Continue Learning</h2>
            <Link
              href="/courses"
              className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
            >
              Browse all courses
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {enrollments.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No courses yet
              </h3>
              <p className="text-gray-600 mb-4">
                Start your learning journey by enrolling in a course!
              </p>
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
              >
                <Play className="h-5 w-5" />
                Explore Courses
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {enrollments.map((enrollment) => {
                const progress = progresses[enrollment.course_id];
                return (
                  <CourseProgressCard
                    key={enrollment.id}
                    enrollment={enrollment}
                    progress={progress}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Instructor Section */}
      {(user.role === "instructor" || user.role === "admin") && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Your Courses</h2>
            <Link
              href="/courses"
              className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
            >
              View all courses
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Instructor Dashboard
            </h3>
            <p className="text-gray-600 mb-4">
              Create and manage your courses from the courses page
            </p>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
            >
              <Play className="h-5 w-5" />
              Go to Courses
            </Link>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <QuickActionCard
            href="/tutor"
            title="Ask AI Tutor"
            description="Get instant help with any topic"
            icon="🤖"
          />
          <QuickActionCard
            href="/quizzes/history"
            title="Quiz History"
            description="View your quiz attempts and scores"
            icon="📝"
          />
          <QuickActionCard
            href="/forum"
            title="Discussion Forum"
            description="Connect with peers and instructors"
            icon="💬"
          />
          <QuickActionCard
            href="/documents"
            title="Document Library"
            description="Access course resources and materials"
            icon="📚"
          />
          <QuickActionCard
            href="/courses"
            title="Find New Course"
            description="Discover new learning opportunities"
            icon="🔍"
          />
          <QuickActionCard
            href="/profile"
            title="View Profile"
            description="Check your achievements"
            icon="👤"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color: "indigo" | "green" | "orange" | "purple";
}) {
  const colors = {
    indigo: "bg-indigo-100 text-indigo-600",
    green: "bg-green-100 text-green-600",
    orange: "bg-orange-100 text-orange-600",
    purple: "bg-purple-100 text-purple-600",
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className={`w-12 h-12 rounded-xl ${colors[color]} flex items-center justify-center mb-4`}>
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-gray-600 text-sm">{label}</p>
    </div>
  );
}

function CourseProgressCard({
  enrollment,
  progress,
}: {
  enrollment: Enrollment;
  progress?: CourseProgress;
}) {
  const percentage = progress?.progress_percentage || 0;

  return (
    <Link
      href={`/courses/${enrollment.course_id}`}
      className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex items-center gap-6"
    >
      <div className="w-24 h-24 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
        <BookOpen className="h-10 w-10 text-indigo-600" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 text-lg truncate">
          {progress?.course_title || "Course"}
        </h3>
        <p className="text-gray-600 text-sm mt-1">
          {progress?.lessons_completed || 0} of {progress?.total_lessons || 0} lessons completed
        </p>
        <div className="mt-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium text-indigo-600">{Math.round(percentage)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
      <ChevronRight className="h-6 w-6 text-gray-400 flex-shrink-0" />
    </Link>
  );
}

function QuickActionCard({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
    >
      <span className="text-3xl">{icon}</span>
      <h3 className="font-semibold text-gray-900 mt-3">{title}</h3>
      <p className="text-gray-600 text-sm mt-1">{description}</p>
    </Link>
  );
}

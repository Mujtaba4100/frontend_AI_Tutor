"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import type { StudyStreak, Enrollment, CourseProgress } from "@/types";
import {
  User,
  Mail,
  Calendar,
  Flame,
  Trophy,
  BookOpen,
  Loader2,
  Award,
} from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [streak, setStreak] = useState<StudyStreak | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [progresses, setProgresses] = useState<Record<string, CourseProgress>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        const [streakData, enrollmentData] = await Promise.all([
          api.getStreak().catch(() => null),
          api.getEnrollments(),
        ]);

        setStreak(streakData);
        setEnrollments(enrollmentData);

        // Fetch progress for each enrollment
        const progressPromises = enrollmentData.map((e) =>
          api
            .getCourseProgress(e.course_id)
            .then((p) => ({ courseId: e.course_id, progress: p }))
        );
        const progressResults = await Promise.all(progressPromises);
        const progressMap: Record<string, CourseProgress> = {};
        progressResults.forEach(({ courseId, progress }) => {
          progressMap[courseId] = progress;
        });
        setProgresses(progressMap);
      } catch (error) {
        console.error("Failed to fetch profile data:", error);
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
          <p className="text-gray-600 mb-4">Please log in to view your profile</p>
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

  const completedCourses = Object.values(progresses).filter(
    (p) => p.progress_percentage === 100
  ).length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
            <User className="h-12 w-12 text-white" />
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-bold text-gray-900">{user.full_name}</h1>
            <div className="flex flex-col sm:flex-row items-center gap-2 mt-2 text-gray-600">
              <span className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {user.email}
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-1 capitalize">
                <Award className="h-4 w-4" />
                {user.role}
              </span>
            </div>
            <p className="text-gray-500 text-sm mt-2 flex items-center gap-1 justify-center sm:justify-start">
              <Calendar className="h-4 w-4" />
              Joined {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Flame}
          label="Current Streak"
          value={`${streak?.current_streak || 0} days`}
          color="orange"
        />
        <StatCard
          icon={Trophy}
          label="Longest Streak"
          value={`${streak?.longest_streak || 0} days`}
          color="yellow"
        />
        <StatCard
          icon={BookOpen}
          label="Lessons Done"
          value={totalLessonsCompleted}
          color="indigo"
        />
        <StatCard
          icon={Award}
          label="Completed"
          value={`${completedCourses} courses`}
          color="green"
        />
      </div>

      {/* Enrolled Courses */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">My Courses</h2>
        </div>
        {enrollments.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-600 mb-4">No courses enrolled yet</p>
            <Link
              href="/courses"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Browse courses
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {enrollments.map((enrollment) => {
              const progress = progresses[enrollment.course_id];
              return (
                <Link
                  key={enrollment.id}
                  href={`/courses/${enrollment.course_id}`}
                  className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">
                      {progress?.course_title || "Course"}
                    </h3>
                    <span className="text-sm text-indigo-600 font-medium">
                      {Math.round(progress?.progress_percentage || 0)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                      style={{ width: `${progress?.progress_percentage || 0}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {progress?.lessons_completed || 0} of {progress?.total_lessons || 0} lessons
                  </p>
                </Link>
              );
            })}
          </div>
        )}
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
  color: "orange" | "yellow" | "indigo" | "green";
}) {
  const colors = {
    orange: "bg-orange-100 text-orange-600",
    yellow: "bg-yellow-100 text-yellow-600",
    indigo: "bg-indigo-100 text-indigo-600",
    green: "bg-green-100 text-green-600",
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div
        className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center mb-3`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-gray-600 text-xs">{label}</p>
    </div>
  );
}

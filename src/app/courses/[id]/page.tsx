"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { Course, CourseProgress } from "@/types";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Edit2,
  Loader2,
  Play,
  Lock,
} from "lucide-react";
import Link from "next/link";

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const courseData = await api.getCourse(courseId);
        setCourse(courseData);

        if (isAuthenticated) {
          try {
            const progressData = await api.getCourseProgress(courseId);
            setProgress(progressData);
            setIsEnrolled(true);
          } catch {
            setIsEnrolled(false);
          }
        }
      } catch (error) {
        console.error("Failed to fetch course:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId, isAuthenticated]);

  // Refetch progress when page comes into focus
  useEffect(() => {
    const handleFocus = async () => {
      if (isAuthenticated && progress) {
        try {
          const updatedProgress = await api.getCourseProgress(courseId);
          setProgress(updatedProgress);
        } catch (error) {
          console.error("Failed to refetch progress:", error);
        }
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [courseId, isAuthenticated, progress]);

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    setEnrolling(true);
    try {
      await api.enrollCourse(courseId);
      setIsEnrolled(true);
      const progressData = await api.getCourseProgress(courseId);
      setProgress(progressData);
    } catch (error) {
      console.error("Failed to enroll:", error);
    } finally {
      setEnrolling(false);
    }
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Course not found
          </h2>
          <Link href="/courses" className="text-indigo-600 hover:text-indigo-700">
            Browse courses
          </Link>
        </div>
      </div>
    );
  }

  const levelColors = {
    beginner: "bg-green-100 text-green-700",
    intermediate: "bg-yellow-100 text-yellow-700",
    advanced: "bg-red-100 text-red-700",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button & Edit Button */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/courses"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to courses
        </Link>
        
        {/* Show Edit button if user is course creator or admin */}
        {user && (user.role === "admin" || course.created_by === user.id) && (
          <Link
            href={`/courses/${courseId}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Course
          </Link>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Course Header */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-8 text-white mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span
                className={`text-xs font-medium px-3 py-1 rounded-full bg-white/20`}
              >
                {course.difficulty_level}
              </span>
              <span className="text-sm flex items-center gap-1 text-white/80">
                <Clock className="h-4 w-4" />
                {course.estimated_hours} hours
              </span>
            </div>
            <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
            <p className="text-indigo-100">{course.description}</p>
          </div>

          {/* Curriculum */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Curriculum</h2>
              <p className="text-gray-600 text-sm mt-1">
                {course.modules?.length || 0} modules •{" "}
                {course.modules?.reduce((sum, m) => sum + (m.lessons?.length || 0), 0) || 0} lessons
              </p>
            </div>
            <div className="divide-y divide-gray-100">
              {course.modules?.map((module) => (
                <div key={module.id}>
                  <button
                    onClick={() => toggleModule(module.id)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-medium text-gray-900">
                          {module.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {module.lessons?.length || 0} lessons
                        </p>
                      </div>
                    </div>
                    {expandedModules.has(module.id) ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                  {expandedModules.has(module.id) && module.lessons && (
                    <div className="bg-gray-50 px-6 py-2">
                      {module.lessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className="flex items-center gap-3 py-3 pl-13"
                        >
                          {isEnrolled ? (
                            <Link
                              href={`/courses/${courseId}/lessons/${lesson.id}`}
                              className="flex items-center gap-3 flex-1 hover:text-indigo-600"
                            >
                              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                <Play className="h-4 w-4 text-indigo-600" />
                              </div>
                              <span className="text-sm text-gray-700">
                                {lesson.title}
                              </span>
                              {lesson.duration_minutes && (
                                <span className="text-xs text-gray-400 ml-auto">
                                  {lesson.duration_minutes} min
                                </span>
                              )}
                            </Link>
                          ) : (
                            <div className="flex items-center gap-3 flex-1 text-gray-400">
                              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                <Lock className="h-4 w-4" />
                              </div>
                              <span className="text-sm">{lesson.title}</span>
                              {lesson.duration_minutes && (
                                <span className="text-xs ml-auto">
                                  {lesson.duration_minutes} min
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
            {/* COURSE CREATOR VIEW: Show management options */}
            {user && (user.role === "admin" || course.created_by === user.id) ? (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Edit2 className="h-8 w-8 text-indigo-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Course Management</h3>
                  <p className="text-sm text-gray-600">You created this course</p>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Students Enrolled</span>
                    <span className="font-semibold text-indigo-600">{course.enrolled_count || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Modules</span>
                    <span className="font-semibold text-gray-900">{course.modules?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Lessons</span>
                    <span className="font-semibold text-gray-900">
                      {course.modules?.reduce((sum, m) => sum + (m.lessons?.length || 0), 0) || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className={`text-sm font-medium ${course.is_published ? 'text-green-600' : 'text-yellow-600'}`}>
                      {course.is_published ? "Published" : "Draft"}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/courses/${courseId}/edit`}
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Edit2 className="h-5 w-5" />
                  Edit Course Content
                </Link>
              </>
            ) : isEnrolled ? (
              /* ENROLLED STUDENT VIEW: Show progress */
              <>
                <div className="mb-6">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Your progress</span>
                    <span className="font-semibold text-indigo-600">
                      {Math.round(progress?.progress_percentage || 0)}%
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                      style={{ width: `${progress?.progress_percentage || 0}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {progress?.lessons_completed || 0} of {progress?.total_lessons || 0} lessons completed
                  </p>
                </div>
                {course.modules && course.modules.length > 0 && course.modules[0].lessons && course.modules[0].lessons.length > 0 ? (
                  <Link
                    href={`/courses/${courseId}/lessons/${course.modules[0].lessons[0].id}`}
                    className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Play className="h-5 w-5" />
                    Continue Learning
                  </Link>
                ) : (
                  <div className="text-center py-3 text-gray-500 text-sm">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="font-medium">No content yet</p>
                    <p className="text-xs mt-1">Lessons will appear here once added</p>
                  </div>
                )}
              </>
            ) : (
              /* NOT ENROLLED VIEW: Show enroll button */
              <>
                <div className="text-center mb-6">
                  <p className="text-3xl font-bold text-gray-900">Free</p>
                  <p className="text-gray-500 text-sm">Full access to all content</p>
                </div>
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                      {enrolling ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Enrolling...
                        </>
                      ) : (
                        <>
                          <BookOpen className="h-5 w-5" />
                          Enroll Now
                        </>
                      )}
                    </button>
              </>
            )}

            <div className="mt-6 pt-6 border-t border-gray-100">
              <h4 className="font-medium text-gray-900 mb-4">This course includes:</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  {course.estimated_hours} hours of content
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  {course.modules?.reduce((sum, m) => sum + (m.lessons?.length || 0), 0) || 0} lessons
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  AI tutor assistance
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Certificate of completion
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

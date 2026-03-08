"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { Lesson, Course } from "@/types";
import ReactMarkdown from "react-markdown";
import AITutorChat from "@/components/AITutorChat";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronLeft,
  Clock,
  Loader2,
  MessageSquare,
  FileText,
  Download,
  Sparkles,
  Lightbulb,
} from "lucide-react";

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const courseId = params.id as string;
  const lessonId = params.lessonId as string;

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [startTime] = useState(Date.now());
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState<{ summary: string; key_points: string[] } | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const courseData = await api.getCourse(courseId);
        setCourse(courseData);

        // Find lesson in modules
        let foundLesson: Lesson | null = null;
        for (const module of courseData.modules || []) {
          const found = module.lessons?.find((l) => l.id === lessonId);
          if (found) {
            foundLesson = found;
            break;
          }
        }
        setLesson(foundLesson);

        // Check if lesson is already completed
        try {
          const progressData = await api.getLessonProgress(lessonId);
          setCompleted(progressData.is_completed);
        } catch (error) {
          // 404 means not started yet, so not completed
          setCompleted(false);
        }

        // Fetch quizzes for this lesson
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/quizzes/lesson/${lessonId}`,
            {
              headers: {
                Authorization: `Bearer ${Cookies.get("access_token")}`,
              },
            }
          );
          if (response.ok) {
            const quizzesData = await response.json();
            setQuizzes(quizzesData);
          }
        } catch (error) {
          console.error("Failed to fetch quizzes:", error);
        }
      } catch (error) {
        console.error("Failed to fetch lesson:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, lessonId, isAuthenticated, router]);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      await api.markLessonComplete(lessonId, timeSpent);
      await api.recordStudy();
      setCompleted(true);
    } catch (error) {
      console.error("Failed to mark complete:", error);
    } finally {
      setCompleting(false);
    }
  };

  const handleGenerateSummary = async () => {
    // If we already have a summary, just toggle visibility
    if (summary) {
      setShowSummary(!showSummary);
      return;
    }

    // Otherwise, generate new summary
    setLoadingSummary(true);
    try {
      const response = await fetch("http://localhost:8001/api/tutor/summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${document.cookie
            .split("; ")
            .find((row) => row.startsWith("access_token="))
            ?.split("=")[1]}`,
        },
        body: JSON.stringify({ lesson_id: lessonId }),
      });

      if (!response.ok) throw new Error("Failed to generate summary");

      const data = await response.json();
      setSummary(data);
      setShowSummary(true);
    } catch (error) {
      console.error("Failed to generate summary:", error);
      alert("Failed to generate summary. Please try again.");
    } finally {
      setLoadingSummary(false);
    }
  };

  const getAdjacentLessons = () => {
    if (!course?.modules) return { prev: null, next: null };

    const allLessons: { lesson: Lesson; moduleTitle: string }[] = [];
    for (const module of course.modules) {
      for (const l of module.lessons || []) {
        allLessons.push({ lesson: l, moduleTitle: module.title });
      }
    }

    const currentIndex = allLessons.findIndex((l) => l.lesson.id === lessonId);
    return {
      prev: currentIndex > 0 ? allLessons[currentIndex - 1] : null,
      next: currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null,
    };
  };

  const { prev, next } = getAdjacentLessons();

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Lesson not found
          </h2>
          <Link
            href={`/courses/${courseId}`}
            className="text-indigo-600 hover:text-indigo-700"
          >
            Back to course
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href={`/courses/${courseId}`}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="hidden sm:inline">{course?.title}</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            {lesson.duration_minutes && (
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {lesson.duration_minutes} min
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            {lesson.title}
          </h1>

          {lesson.description && (
            <p className="text-gray-600 mb-6">{lesson.description}</p>
          )}

          {/* Render based on content type */}
          {lesson.content_type === "video" && lesson.content_url && (
            <div className="mb-8 rounded-xl overflow-hidden bg-black aspect-video">
              <video
                controls
                className="w-full h-full"
                src={`http://localhost:8001${lesson.content_url}`}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}

          {lesson.content_type === "pdf" && lesson.content_url && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-indigo-600" />
                  <div>
                    <p className="font-medium text-gray-900">PDF Document</p>
                    <p className="text-sm text-gray-600">Click to download or view</p>
                  </div>
                </div>
                <a
                  href={`http://localhost:8001${lesson.content_url}`}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Download className="h-4 w-4" />
                  Download
                </a>
              </div>
              <iframe
                src={`http://localhost:8001${lesson.content_url}`}
                className="w-full h-[600px] border rounded-lg"
                title="PDF Viewer"
              />
            </div>
          )}

          {lesson.content_type === "markdown" && (
            <div className="prose prose-indigo max-w-none">
              <ReactMarkdown>{lesson.content_text || lesson.content || ""}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex flex-col gap-4">
            {/* AI Features Row */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleGenerateSummary}
                disabled={loadingSummary}
                className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50 font-medium"
              >
                {loadingSummary ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : summary ? (
                  showSummary ? (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Hide Summary
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Show Summary
                    </>
                  )
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Get AI Summary
                  </>
                )}
              </button>
            </div>

            {/* Completion Row */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-end">
              {completed ? (
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="h-5 w-5" />
                  <span className="font-medium">Completed!</span>
                </div>
              ) : (
                <button
                  onClick={handleComplete}
                  disabled={completing}
                  className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {completing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-5 w-5" />
                      Mark as Complete
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* AI Summary */}
        {showSummary && summary && (
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl shadow-sm p-6 mb-6 border-2 border-purple-200">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <h3 className="font-bold text-lg text-gray-900">AI-Generated Summary</h3>
            </div>
            <div className="prose prose-sm max-w-none mb-6">
              <p className="text-gray-700">{summary.summary}</p>
            </div>
            {summary.key_points.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="h-5 w-5 text-amber-600" />
                  <h4 className="font-semibold text-gray-900">Key Points</h4>
                </div>
                <ul className="space-y-2">
                  {summary.key_points.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold mt-1">•</span>
                      <span className="text-gray-700">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Quizzes */}
        {quizzes.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-indigo-600" />
              <h3 className="font-bold text-lg text-gray-900">Available Quizzes</h3>
            </div>
            <div className="space-y-3">
              {quizzes.map((quiz) => (
                <Link
                  key={quiz.id}
                  href={`/quizzes/${quiz.id}/take`}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200">
                      <FileText className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 group-hover:text-indigo-600">
                        {quiz.title}
                      </h4>
                      {quiz.description && (
                        <p className="text-sm text-gray-600">{quiz.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                        <span>Passing: {quiz.passing_score}%</span>
                        {quiz.time_limit_minutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {quiz.time_limit_minutes} minutes
                          </span>
                        )}
                        <span>Max {quiz.max_attempts} attempts</span>
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-indigo-600" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          {prev ? (
            <Link
              href={`/courses/${courseId}/lessons/${prev.lesson.id}`}
              className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition-shadow"
            >
              <ArrowLeft className="h-5 w-5 text-gray-400" />
              <div className="text-left">
                <p className="text-xs text-gray-500">Previous</p>
                <p className="text-sm font-medium text-gray-900 line-clamp-1">
                  {prev.lesson.title}
                </p>
              </div>
            </Link>
          ) : (
            <div />
          )}
          {next ? (
            <Link
              href={`/courses/${courseId}/lessons/${next.lesson.id}`}
              className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-right">
                <p className="text-xs text-gray-500">Next</p>
                <p className="text-sm font-medium text-gray-900 line-clamp-1">
                  {next.lesson.title}
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </Link>
          ) : (
            <Link
              href={`/courses/${courseId}`}
              className="flex items-center gap-3 bg-indigo-600 text-white rounded-xl px-6 py-3 shadow-sm hover:bg-indigo-700 transition-colors"
            >
              <BookOpen className="h-5 w-5" />
              Back to Course
            </Link>
          )}
        </div>
      </div>

      {/* AI Tutor Chat Widget */}
      <AITutorChat
        lessonId={lessonId}
        moduleId={lesson.module_id}
        lessonTitle={lesson.title}
      />
    </div>
  );
}

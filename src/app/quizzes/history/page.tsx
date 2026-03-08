"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import {
  ArrowLeft,
  Check,
  X,
  Clock,
  FileText,
  Loader2,
  Trophy,
  AlertCircle,
} from "lucide-react";

interface QuizInfo {
  id: string;
  lesson_id: string;
  title: string;
  passing_score: number;
}

interface Attempt {
  id: string;
  quiz_id: string;
  student_id: string;
  score: number;
  passed: boolean;
  time_taken_seconds: number | null;
  started_at: string;
  completed_at: string;
  quiz: QuizInfo;
}

export default function QuizHistoryPage() {
  const router = useRouter();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttempts = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/quizzes/attempts/my`,
          {
            headers: {
              Authorization: `Bearer ${Cookies.get("access_token")}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to load attempts");
        }

        const data = await response.json();
        setAttempts(data);
      } catch (error) {
        console.error("Failed to fetch attempts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttempts();
  }, []);

  const formatTime = (seconds: number | null) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Group attempts by quiz
  const groupedAttempts = attempts.reduce((acc, attempt) => {
    if (!acc[attempt.quiz_id]) {
      acc[attempt.quiz_id] = {
        quiz: attempt.quiz,
        attempts: [],
      };
    }
    acc[attempt.quiz_id].attempts.push(attempt);
    return acc;
  }, {} as Record<string, { quiz: QuizInfo; attempts: Attempt[] }>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Quiz History</h1>
          <p className="text-gray-600 mt-2">
            View all your quiz attempts and scores
          </p>
        </div>

        {/* Summary Stats */}
        {attempts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-3xl font-bold text-indigo-600 mb-1">
                {attempts.length}
              </div>
              <div className="text-sm text-gray-600">Total Attempts</div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {attempts.filter((a) => a.passed).length}
              </div>
              <div className="text-sm text-gray-600">Passed</div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {Math.round(
                  attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length
                )}
                %
              </div>
              <div className="text-sm text-gray-600">Average Score</div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {Object.keys(groupedAttempts).length}
              </div>
              <div className="text-sm text-gray-600">Unique Quizzes</div>
            </div>
          </div>
        )}

        {/* Attempts List */}
        {Object.keys(groupedAttempts).length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Quiz Attempts Yet
            </h2>
            <p className="text-gray-600 mb-6">
              Start taking quizzes to see your history here
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedAttempts).map(([quizId, { quiz, attempts: quizAttempts }]) => (
              <div key={quizId} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">
                      {quiz.title}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {quizAttempts.length} attempt{quizAttempts.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">
                      Passing: {quiz.passing_score}%
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {quizAttempts
                    .sort(
                      (a, b) =>
                        new Date(b.completed_at).getTime() -
                        new Date(a.completed_at).getTime()
                    )
                    .map((attempt, index) => (
                      <div
                        key={attempt.id}
                        onClick={() =>
                          router.push(`/quizzes/attempts/${attempt.id}`)
                        }
                        className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer transition-all"
                      >
                        {/* Attempt Number */}
                        <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 font-bold">
                          #{quizAttempts.length - index}
                        </div>

                        {/* Status Badge */}
                        <div className="flex-shrink-0">
                          {attempt.passed ? (
                            <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                              <Check className="h-4 w-4" />
                              Passed
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                              <X className="h-4 w-4" />
                              Failed
                            </div>
                          )}
                        </div>

                        {/* Score */}
                        <div className="flex-1">
                          <div className="text-2xl font-bold text-gray-900">
                            {Math.round(attempt.score)}%
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatDate(attempt.completed_at)}
                          </div>
                        </div>

                        {/* Time Taken */}
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm">
                            {formatTime(attempt.time_taken_seconds)}
                          </span>
                        </div>

                        {/* Best Badge */}
                        {index === 0 &&
                          quizAttempts.length > 1 &&
                          attempt.score ===
                            Math.max(...quizAttempts.map((a) => a.score)) && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                              <Trophy className="h-3 w-3" />
                              Best
                            </div>
                          )}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

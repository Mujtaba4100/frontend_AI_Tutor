"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import {
  ArrowLeft,
  Check,
  X,
  Clock,
  Trophy,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface QuestionResult {
  question_id: string;
  question_text: string;
  student_answer: string;
  correct_answer: string;
  is_correct: boolean;
  points_earned: number;
  points_possible: number;
  explanation: string | null;
}

interface QuizInfo {
  id: string;
  title: string;
  passing_score: number;
}

interface AttemptDetails {
  id: string;
  quiz_id: string;
  student_id: string;
  score: number;
  passed: boolean;
  time_taken_seconds: number | null;
  started_at: string;
  completed_at: string;
  quiz: QuizInfo;
  question_results: QuestionResult[];
}

export default function QuizAttemptPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.id as string;

  const [attempt, setAttempt] = useState<AttemptDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttempt = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/quizzes/attempts/${attemptId}`,
          {
            headers: {
              Authorization: `Bearer ${Cookies.get("access_token")}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to load attempt");
        }

        const data = await response.json();
        setAttempt(data);
      } catch (error) {
        console.error("Failed to fetch attempt:", error);
        alert("Failed to load quiz results");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchAttempt();
  }, [attemptId, router]);

  const formatTime = (seconds: number | null) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Results not found</p>
        </div>
      </div>
    );
  }

  const correctCount = attempt.question_results.filter((q) => q.is_correct).length;
  const totalQuestions = attempt.question_results.length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </button>

        {/* Results Summary */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="text-center mb-6">
            <div
              className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 ${
                attempt.passed
                  ? "bg-green-100 text-green-600"
                  : "bg-red-100 text-red-600"
              }`}
            >
              {attempt.passed ? (
                <Trophy className="h-12 w-12" />
              ) : (
                <X className="h-12 w-12" />
              )}
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {attempt.passed ? "Congratulations!" : "Keep Trying!"}
            </h1>
            <p className="text-gray-600">
              {attempt.passed
                ? "You passed the quiz!"
                : "You didn't pass this time, but don't give up!"}
            </p>
          </div>

          {/* Score Display */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-indigo-600 mb-1">
                {Math.round(attempt.score)}%
              </div>
              <div className="text-sm text-gray-600">Your Score</div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {attempt.quiz.passing_score}%
              </div>
              <div className="text-sm text-gray-600">Passing Score</div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {correctCount}/{totalQuestions}
              </div>
              <div className="text-sm text-gray-600">Correct Answers</div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {formatTime(attempt.time_taken_seconds)}
              </div>
              <div className="text-sm text-gray-600">Time Taken</div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {attempt.quiz.title}
            </h2>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {new Date(attempt.completed_at).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Question Results */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Detailed Results
          </h2>

          <div className="space-y-6">
            {attempt.question_results.map((result, index) => (
              <div
                key={result.question_id}
                className={`border-l-4 pl-6 py-4 ${
                  result.is_correct
                    ? "border-green-500 bg-green-50"
                    : "border-red-500 bg-red-50"
                }`}
              >
                {/* Question Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        result.is_correct
                          ? "bg-green-600 text-white"
                          : "bg-red-600 text-white"
                      }`}
                    >
                      {result.is_correct ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <X className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Question {index + 1}
                      </h3>
                      <p className="text-gray-800">{result.question_text}</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {result.points_earned}/{result.points_possible} pts
                  </div>
                </div>

                {/* Answers */}
                <div className="space-y-3 ml-11">
                  {/* Your Answer */}
                  <div>
                    <div className="text-sm font-semibold text-gray-700 mb-1">
                      Your Answer:
                    </div>
                    <div
                      className={`p-3 rounded-lg ${
                        result.is_correct
                          ? "bg-white border border-green-300"
                          : "bg-white border border-red-300"
                      }`}
                    >
                      {result.student_answer || (
                        <span className="text-gray-400 italic">Not answered</span>
                      )}
                    </div>
                  </div>

                  {/* Correct Answer (if wrong) */}
                  {!result.is_correct && (
                    <div>
                      <div className="text-sm font-semibold text-gray-700 mb-1">
                        Correct Answer:
                      </div>
                      <div className="p-3 bg-white border border-green-300 rounded-lg font-semibold text-green-700">
                        {result.correct_answer}
                      </div>
                    </div>
                  )}

                  {/* Explanation */}
                  {result.explanation && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="text-sm font-semibold text-blue-900 mb-1">
                            Explanation
                          </div>
                          <p className="text-sm text-blue-800">
                            {result.explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex-1 py-3 px-6 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => router.push("/quizzes/history")}
            className="flex-1 py-3 px-6 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
          >
            View All Attempts
          </button>
        </div>
      </div>
    </div>
  );
}

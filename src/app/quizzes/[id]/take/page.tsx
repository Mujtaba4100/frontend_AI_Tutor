"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft,
  Check,
  Clock,
  FileText,
  Loader2,
  X,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

interface QuizQuestion {
  id: string;
  question_type: string;
  question_text: string;
  options: string[] | null;
  points: number;
  order_index: number;
}

interface Quiz {
  id: string;
  lesson_id: string;
  title: string;
  description: string | null;
  passing_score: number;
  time_limit_minutes: number | null;
  max_attempts: number;
  is_ai_generated: boolean;
  is_published: boolean;
  questions: QuizQuestion[];
  attempts_left: number;
}

export default function TakeQuizPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const quizId = params.id as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/quizzes/${quizId}/take`,
          {
            headers: {
              Authorization: `Bearer ${Cookies.get("access_token")}`,
            },
          }
        );

        if (!response.ok) {
          if (response.status === 403) {
            throw new Error("No attempts left or quiz not published");
          }
          throw new Error("Failed to load quiz");
        }

        const data = await response.json();
        setQuiz(data);

        // Initialize timer if time limit exists
        if (data.time_limit_minutes) {
          setTimeRemaining(data.time_limit_minutes * 60);
        }
      } catch (error: any) {
        console.error("Failed to fetch quiz:", error);
        alert(error.message || "Failed to load quiz");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId, router]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          handleSubmit(true); // Auto-submit when time runs out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!quiz) return;

    // Confirm submission
    if (!autoSubmit) {
      const unanswered = quiz.questions.length - Object.keys(answers).length;
      if (unanswered > 0) {
        const confirm = window.confirm(
          `You have ${unanswered} unanswered question(s). Submit anyway?`
        );
        if (!confirm) return;
      }
    }

    setSubmitting(true);

    try {
      const timeTaken = Math.floor((Date.now() - startTime) / 1000);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/quizzes/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Cookies.get("access_token")}`,
          },
          body: JSON.stringify({
            quiz_id: quizId,
            answers: Object.entries(answers).map(([question_id, answer]) => ({
              question_id,
              answer,
            })),
            time_taken_seconds: timeTaken,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to submit quiz");
      }

      const result = await response.json();

      // Redirect to results page
      router.push(`/quizzes/attempts/${result.id}`);
    } catch (error) {
      console.error("Failed to submit quiz:", error);
      alert("Failed to submit quiz. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Quiz not found</p>
        </div>
      </div>
    );
  }

  const progress = (Object.keys(answers).length / quiz.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <button
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back
              </button>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {quiz.title}
              </h1>
              {quiz.description && (
                <p className="text-gray-600">{quiz.description}</p>
              )}
            </div>

            {timeRemaining !== null && (
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  timeRemaining < 300
                    ? "bg-red-50 text-red-700"
                    : "bg-blue-50 text-blue-700"
                }`}
              >
                <Clock className="h-5 w-5" />
                <span className="font-mono text-lg font-bold">
                  {formatTime(timeRemaining)}
                </span>
              </div>
            )}
          </div>

          {/* Quiz Info */}
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>{quiz.questions.length} questions</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              <span>Passing score: {quiz.passing_score}%</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>Attempts left: {quiz.attempts_left}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">
                Progress: {Object.keys(answers).length} / {quiz.questions.length}
              </span>
              <span className="font-semibold text-indigo-600">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {quiz.questions
            .sort((a, b) => a.order_index - b.order_index)
            .map((question, index) => (
              <div key={question.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {question.question_text}
                    </h3>

                    {question.question_type === "multiple_choice" &&
                      question.options && (
                        <div className="space-y-3">
                          {question.options.map((option, optIdx) => {
                            const optionLetter = String.fromCharCode(65 + optIdx);
                            // Strip any existing "A. " prefix from option
                            const cleanOption = option.replace(/^[A-D]\.\s*/, '');
                            const fullAnswer = `${optionLetter}. ${cleanOption}`;
                            const isSelected = answers[question.id] === fullAnswer;

                            return (
                              <label
                                key={optIdx}
                                className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                  isSelected
                                    ? "border-indigo-500 bg-indigo-50"
                                    : "border-gray-200 hover:border-indigo-300"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={question.id}
                                  value={fullAnswer}
                                  checked={isSelected}
                                  onChange={(e) =>
                                    handleAnswerChange(
                                      question.id,
                                      e.target.value
                                    )
                                  }
                                  className="mr-4 h-5 w-5 text-indigo-600"
                                />
                                <span className="text-gray-900">
                                  <span className="font-semibold mr-2">
                                    {optionLetter}.
                                  </span>
                                  {option}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}

                    {question.question_type === "true_false" && (
                      <div className="space-y-3">
                        {["True", "False"].map((option) => {
                          const isSelected = answers[question.id] === option;
                          return (
                            <label
                              key={option}
                              className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                isSelected
                                  ? "border-indigo-500 bg-indigo-50"
                                  : "border-gray-200 hover:border-indigo-300"
                              }`}
                            >
                              <input
                                type="radio"
                                name={question.id}
                                value={option}
                                checked={isSelected}
                                onChange={(e) =>
                                  handleAnswerChange(question.id, e.target.value)
                                }
                                className="mr-4 h-5 w-5 text-indigo-600"
                              />
                              <span className="text-gray-900">{option}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {question.question_type === "short_answer" && (
                      <textarea
                        value={answers[question.id] || ""}
                        onChange={(e) =>
                          handleAnswerChange(question.id, e.target.value)
                        }
                        placeholder="Type your answer here..."
                        className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                        rows={4}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* Submit Button */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {Object.keys(answers).length === quiz.questions.length ? (
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="h-5 w-5" />
                  <span>All questions answered</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertCircle className="h-5 w-5" />
                  <span>
                    {quiz.questions.length - Object.keys(answers).length}{" "}
                    question(s) remaining
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => handleSubmit()}
              disabled={submitting || Object.keys(answers).length === 0}
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  Submit Quiz
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

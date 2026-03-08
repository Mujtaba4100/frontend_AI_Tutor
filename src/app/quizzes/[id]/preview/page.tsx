"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft,
  Check,
  FileText,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
} from "lucide-react";

interface QuizQuestion {
  id: string;
  question_type: string;
  question_text: string;
  options: string[] | null;
  correct_answer: string;
  explanation: string | null;
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
}

export default function QuizPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const quizId = params.id as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== "instructor") {
      alert("Only instructors can preview quizzes");
      router.back();
      return;
    }

    const fetchQuiz = async () => {
      try {
        const response = await fetch(
          `http://localhost:8001/api/quizzes/${quizId}`,
          {
            headers: {
              Authorization: `Bearer ${Cookies.get("access_token")}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to load quiz");
        }

        const data = await response.json();
        setQuiz(data);
      } catch (error: any) {
        console.error("Failed to fetch quiz:", error);
        alert(error.message || "Failed to load quiz");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId, router, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading quiz preview...</p>
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <button
                onClick={() => router.back()}
                className="flex items-center text-white/80 hover:text-white mb-4"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Course
              </button>
              <div className="flex items-center gap-3 mb-2">
                <Eye className="h-8 w-8" />
                <h1 className="text-3xl font-bold">Instructor Preview</h1>
              </div>
              <h2 className="text-2xl font-semibold mb-2">{quiz.title}</h2>
              {quiz.description && (
                <p className="text-white/90">{quiz.description}</p>
              )}
            </div>
          </div>

          {/* Quiz Info */}
          <div className="flex flex-wrap items-center gap-6 text-sm bg-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>{quiz.questions.length} questions</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              <span>Passing score: {quiz.passing_score}%</span>
            </div>
            {quiz.time_limit_minutes && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Time limit: {quiz.time_limit_minutes} minutes</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>Max attempts: {quiz.max_attempts}</span>
            </div>
            {quiz.is_published ? (
              <span className="bg-green-500/20 text-green-100 px-3 py-1 rounded-full text-xs font-semibold">
                ✓ Published
              </span>
            ) : (
              <span className="bg-yellow-500/20 text-yellow-100 px-3 py-1 rounded-full text-xs font-semibold">
                🔒 Draft
              </span>
            )}
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
          <div className="flex items-start">
            <Eye className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-blue-900">
                Instructor Preview Mode
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                You're viewing this quiz with all correct answers and explanations visible. 
                This preview mode is only available to instructors.
              </p>
            </div>
          </div>
        </div>

        {/* Questions with Answers */}
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
                        <div className="space-y-3 mb-4">
                          {question.options.map((option, optIdx) => {
                            const optionLetter = String.fromCharCode(65 + optIdx);
                            // Strip any existing "A. " prefix from option
                            const cleanOption = option.replace(/^[A-D]\.\s*/, '');
                            const fullOption = `${optionLetter}. ${cleanOption}`;
                            // Strip prefix from correct answer for comparison
                            const cleanCorrectAnswer = question.correct_answer.replace(/^[A-D]\.\s*/, '');
                            const isCorrect = cleanOption === cleanCorrectAnswer || 
                                            question.correct_answer === fullOption ||
                                            question.correct_answer.includes(cleanOption);

                            return (
                              <div
                                key={optIdx}
                                className={`p-4 rounded-lg border-2 ${
                                  isCorrect
                                    ? "border-green-500 bg-green-50"
                                    : "border-gray-200 bg-gray-50"
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  {isCorrect && (
                                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                                  )}
                                  <span
                                    className={`flex-1 ${
                                      isCorrect
                                        ? "text-green-900 font-semibold"
                                        : "text-gray-700"
                                    }`}
                                  >
                                    {fullOption}
                                  </span>
                                  {isCorrect && (
                                    <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                                      CORRECT
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                    {question.explanation && (
                      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-semibold text-blue-900 mb-1">
                              Explanation
                            </h4>
                            <p className="text-sm text-blue-800">
                              {question.explanation}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                      <span className="text-sm text-gray-600">
                        Points: {question.points}
                      </span>
                      <span className="text-xs text-gray-500">
                        Question {index + 1} of {quiz.questions.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
          >
            Back to Course
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { Course, Module, Lesson, EnrollmentWithStudent } from "@/types";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  GripVertical,
  BookOpen,
  FileText,
  Save,
  X,
  Check,
  Loader2,
  Eye,
  Users,
  Sparkles,
  Download,
} from "lucide-react";

export default function CourseEditPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Module form
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleDescription, setModuleDescription] = useState("");
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);

  // Lesson form
  const [showLessonForm, setShowLessonForm] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonDescription, setLessonDescription] = useState("");
  const [lessonContent, setLessonContent] = useState("");
  const [lessonDuration, setLessonDuration] = useState(10);
  const [lessonContentType, setLessonContentType] = useState<"markdown" | "pdf" | "video">("markdown");
  const [lessonFile, setLessonFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);

  // Course details editing
  const [editingCourse, setEditingCourse] = useState(false);
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [courseThumbnail, setCourseThumbnail] = useState("");
  const [courseHours, setCourseHours] = useState(0);
  const [courseDifficulty, setCourseDifficulty] = useState("beginner");

  // Tab management
  const [activeTab, setActiveTab] = useState<"content" | "students">("content");
  const [enrollments, setEnrollments] = useState<EnrollmentWithStudent[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);

  // Quiz generation
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizLessonId, setQuizLessonId] = useState<string | null>(null);
  const [quizNumQuestions, setQuizNumQuestions] = useState(5);
  const [quizDifficulty, setQuizDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [generatedQuiz, setGeneratedQuiz] = useState<any[]>([]);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [lessonQuizzes, setLessonQuizzes] = useState<Record<string, any[]>>({});

  useEffect(() => {
    if (!user || (user.role !== "instructor" && user.role !== "admin")) {
      router.push("/dashboard");
      return;
    }

    fetchCourse();
  }, [user, courseId, router]);

  const fetchCourse = async () => {
    try {
      const data = await api.getCourse(courseId);
      setCourse(data);
      setCourseTitle(data.title);
      setCourseDescription(data.description || "");
      setCourseThumbnail(data.thumbnail_url || "");
      setCourseHours(data.estimated_hours);
      setCourseDifficulty(data.difficulty_level);
    } catch (error) {
      console.error("Failed to fetch course:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    setLoadingEnrollments(true);
    try {
      const data = await api.getCourseEnrollments(courseId);
      setEnrollments(data);
    } catch (error) {
      console.error("Failed to fetch enrollments:", error);
    } finally {
      setLoadingEnrollments(false);
    }
  };

  const fetchLessonQuizzes = async () => {
    if (!course) return;
    
    const quizzesMap: Record<string, any[]> = {};
    
    for (const module of course.modules || []) {
      for (const lesson of module.lessons || []) {
        try {
          const response = await fetch(`http://localhost:8001/api/quizzes/lesson/${lesson.id}`, {
            headers: {
              Authorization: `Bearer ${Cookies.get("access_token")}`,
            },
          });
          if (response.ok) {
            const quizzes = await response.json();
            quizzesMap[lesson.id] = quizzes;
          }
        } catch (error) {
          console.error(`Failed to fetch quizzes for lesson ${lesson.id}:`, error);
        }
      }
    }
    
    setLessonQuizzes(quizzesMap);
  };

  // Fetch quizzes when course is loaded
  useEffect(() => {
    if (course) {
      fetchLessonQuizzes();
    }
  }, [course]);

  const handleUpdateCourse = async () => {
    setSaving(true);
    try {
      await api.updateCourse(courseId, {
        title: courseTitle,
        description: courseDescription,
        thumbnail_url: courseThumbnail,
        estimated_hours: courseHours,
        difficulty_level: courseDifficulty as "beginner" | "intermediate" | "advanced",
      });
      await fetchCourse();
      setEditingCourse(false);
    } catch (error: any) {
      alert(error.message || "Failed to update course");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm("Delete this module and all its lessons? This cannot be undone.")) return;

    setSaving(true);
    try {
      await api.deleteModule(moduleId);
      await fetchCourse();
    } catch (error: any) {
      alert(error.message || "Failed to delete module");
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async () => {
    setSaving(true);
    try {
      await api.updateCourse(courseId, {
        is_published: !course?.is_published,
      });
      await fetchCourse();
    } catch (error: any) {
      alert(error.message || "Failed to update course");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateModule = async () => {
    if (!moduleTitle.trim()) return;

    setSaving(true);
    try {
      await api.createModule(courseId, {
        title: moduleTitle,
        description: moduleDescription,
        order_index: course?.modules?.length || 0,
      });
      await fetchCourse();
      setModuleTitle("");
      setModuleDescription("");
      setShowModuleForm(false);
    } catch (error: any) {
      alert(error.message || "Failed to create module");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateLesson = async (moduleId: string) => {
    if (!lessonTitle.trim()) return;

    setSaving(true);
    try {
      const module = course?.modules?.find((m) => m.id === moduleId);
      let contentUrl = null;

      // Upload file if present
      if (lessonFile) {
        setUploadingFile(true);
        const formData = new FormData();
        formData.append("file", lessonFile);

        const response = await fetch("http://localhost:8001/api/courses/lessons/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${Cookies.get("access_token")}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error("File upload failed");
        }

        const uploadData = await response.json();
        contentUrl = uploadData.file_url;
        setUploadingFile(false);
      }

      await api.createLesson(moduleId, {
        title: lessonTitle,
        description: lessonDescription,
        content_type: lessonContentType,
        content_text: lessonContentType === "markdown" ? lessonContent : undefined,
        content_url: contentUrl,
        duration_minutes: lessonDuration,
        order_index: module?.lessons?.length || 0,
      });
      
      await fetchCourse();
      setLessonTitle("");
      setLessonDescription("");
      setLessonContent("");
      setLessonDuration(10);
      setLessonContentType("markdown");
      setLessonFile(null);
      setShowLessonForm(null);
    } catch (error: any) {
      alert(error.message || "Failed to create lesson");
    } finally {
      setSaving(false);
      setUploadingFile(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!quizLessonId) return;

    setGeneratingQuiz(true);
    try {
      const response = await fetch("http://localhost:8001/api/tutor/mcq", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Cookies.get("access_token")}`,
        },
        body: JSON.stringify({
          lesson_id: quizLessonId,
          num_questions: quizNumQuestions,
          difficulty: quizDifficulty,
        }),
      });

      if (!response.ok) throw new Error("Quiz generation failed");

      const data = await response.json();
      setGeneratedQuiz(data.questions);
      alert(`Successfully generated ${data.questions.length} quiz questions!`);
    } catch (error: any) {
      alert(error.message || "Failed to generate quiz");
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const downloadQuizAsPDF = async () => {
    try {
      // Dynamically import jsPDF to avoid SSR issues
      const { jsPDF } = await import('jspdf');
      
      // Find lesson title
      let lessonTitle = "Quiz";
      if (quizLessonId && course) {
        for (const module of course.modules || []) {
          const lesson = module.lessons?.find(l => l.id === quizLessonId);
          if (lesson) {
            lessonTitle = lesson.title;
            break;
          }
        }
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const maxWidth = pageWidth - 2 * margin;
      let y = 20;

      // Title
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text(`${course?.title || "Course"} - Quiz`, margin, y);
      y += 10;

      // Lesson name and difficulty
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Lesson: ${lessonTitle}`, margin, y);
      y += 7;
      doc.text(`Difficulty: ${quizDifficulty.charAt(0).toUpperCase() + quizDifficulty.slice(1)}`, margin, y);
      y += 7;
      doc.text(`Total Questions: ${generatedQuiz.length}`, margin, y);
      y += 10;

      // Questions
      generatedQuiz.forEach((q, idx) => {
        // Check if we need a new page
        if (y > 250) {
          doc.addPage();
          y = 20;
        }

        // Question number and text
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        const questionText = `${idx + 1}. ${q.question}`;
        const questionLines = doc.splitTextToSize(questionText, maxWidth);
        doc.text(questionLines, margin, y);
        y += questionLines.length * 7;

        // Options
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        q.options.forEach((opt: string, optIdx: number) => {
          const optionLetter = String.fromCharCode(65 + optIdx);
          const isCorrect = q.correct_answer.startsWith(optionLetter);
          
          if (isCorrect) {
            doc.setFont("helvetica", "bold");
          }
          
          const optionText = `${optionLetter}. ${opt}`;
          const optionLines = doc.splitTextToSize(optionText, maxWidth - 5);
          doc.text(optionLines, margin + 5, y);
          y += optionLines.length * 6;
          
          if (isCorrect) {
            doc.setFont("helvetica", "normal");
          }
        });

        // Explanation
        doc.setFontSize(10);
        doc.setTextColor(100);
        const explanationText = `Explanation: ${q.explanation}`;
        const explanationLines = doc.splitTextToSize(explanationText, maxWidth);
        doc.text(explanationLines, margin, y);
        y += explanationLines.length * 5 + 10;
        doc.setTextColor(0);
      });

      // Generate filename: CourseName_LessonName_Quiz_Date.pdf
      const date = new Date().toISOString().split('T')[0];
      const sanitize = (str: string) => str.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${sanitize(course?.title || 'Course')}_${sanitize(lessonTitle)}_Quiz_${date}.pdf`;

      doc.save(filename);
    } catch (error) {
      console.error("PDF generation error:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  const saveQuizToDatabase = async () => {
    if (!quizLessonId || generatedQuiz.length === 0) return;

    setSavingQuiz(true);
    try {
      // Find lesson title for quiz title
      let lessonTitle = "Quiz";
      if (course) {
        for (const module of course.modules || []) {
          const lesson = module.lessons?.find(l => l.id === quizLessonId);
          if (lesson) {
            lessonTitle = lesson.title;
            break;
          }
        }
      }

      const response = await fetch("http://localhost:8001/api/quizzes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Cookies.get("access_token")}`,
        },
        body: JSON.stringify({
          lesson_id: quizLessonId,
          title: `${lessonTitle} - Quiz`,
          description: `AI-generated quiz with ${generatedQuiz.length} questions (${quizDifficulty} difficulty)`,
          passing_score: 70.0,
          time_limit_minutes: generatedQuiz.length * 2, // 2 minutes per question
          max_attempts: 3,
          is_ai_generated: true,
          is_published: true,
          questions: generatedQuiz.map((q, idx) => ({
            question_type: "multiple_choice",
            question_text: q.question,
            options: q.options.map((opt: string) => opt.replace(/^[A-D]\.\s*/, '')), // Strip "A. " prefix
            correct_answer: q.correct_answer.replace(/^[A-D]\.\s*/, ''), // Strip "A. " prefix
            explanation: q.explanation,
            points: 1,
            order_index: idx,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save quiz");
      }

      const savedQuiz = await response.json();
      alert("Quiz saved successfully! Students can now take this quiz.");
      
      // Refetch quizzes to show the newly saved one
      await fetchLessonQuizzes();
      
      // Close modal and reset state
      setShowQuizModal(false);
      setGeneratedQuiz([]);
      setQuizLessonId(null);
    } catch (error: any) {
      console.error("Failed to save quiz:", error);
      alert(error.message || "Failed to save quiz to database");
    } finally {
      setSavingQuiz(false);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm("Are you sure you want to delete this quiz? This cannot be undone.")) return;

    try {
      const response = await fetch(`http://localhost:8001/api/quizzes/${quizId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${Cookies.get("access_token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete quiz");
      }

      alert("Quiz deleted successfully!");
      await fetchLessonQuizzes();
    } catch (error: any) {
      console.error("Failed to delete quiz:", error);
      alert(error.message || "Failed to delete quiz");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Course not found</h2>
          <Link href="/courses" className="text-indigo-600 hover:text-indigo-700">
            Back to courses
          </Link>
        </div>
      </div>
    );
  }

  // Check ownership
  if (user?.role !== "admin" && course.created_by !== user?.id) {
    router.push(`/courses/${courseId}`);
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href={`/courses/${courseId}`}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to course
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href={`/courses/${courseId}`}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white rounded-lg hover:bg-gray-50 border"
            >
              <Eye className="h-4 w-4" />
              Preview
            </Link>
            <button
              onClick={handleTogglePublish}
              disabled={saving}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                course.is_published
                  ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                  : "bg-green-100 text-green-700 hover:bg-green-200"
              }`}
            >
              {course.is_published ? "Unpublish" : "Publish"}
            </button>
          </div>
        </div>

        {/* Course Info Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          {editingCourse ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={courseDescription}
                  onChange={(e) => setCourseDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    value={courseHours}
                    onChange={(e) => setCourseHours(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                  <select
                    value={courseDifficulty}
                    onChange={(e) => setCourseDifficulty(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleUpdateCourse}
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingCourse(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{course.title}</h1>
                <p className="text-gray-600 mb-4">{course.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="capitalize">{course.difficulty_level}</span>
                  <span>•</span>
                  <span>{course.estimated_hours} hours</span>
                  <span>•</span>
                  <span className={course.is_published ? "text-green-600" : "text-yellow-600"}>
                    {course.is_published ? "Published" : "Draft"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setEditingCourse(true)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <Edit2 className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("content")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "content"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            Content
          </button>
          <button
            onClick={() => {
              setActiveTab("students");
              if (enrollments.length === 0) {
                fetchEnrollments();
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "students"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Users className="h-4 w-4" />
            Students ({course.enrolled_count || 0})
          </button>
        </div>

        {/* Content Tab */}
        {activeTab === "content" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Course Content</h2>
              <button
                onClick={() => setShowModuleForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                Add Module
              </button>
            </div>

          {/* New Module Form */}
          {showModuleForm && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">New Module</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Module Title *
                  </label>
                  <input
                    type="text"
                    value={moduleTitle}
                    onChange={(e) => setModuleTitle(e.target.value)}
                    placeholder="Introduction to Python"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={moduleDescription}
                    onChange={(e) => setModuleDescription(e.target.value)}
                    placeholder="What students will learn in this module..."
                    rows={2}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateModule}
                    disabled={saving || !moduleTitle.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    Create Module
                  </button>
                  <button
                    onClick={() => {
                      setShowModuleForm(false);
                      setModuleTitle("");
                      setModuleDescription("");
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modules List */}
          {course.modules && course.modules.length > 0 ? (
            <div className="space-y-4">
              {course.modules.map((module, idx) => (
                <div key={module.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  {/* Module Header */}
                  <div className="p-6 bg-gray-50 border-b">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <GripVertical className="h-5 w-5 text-gray-400 mt-1" />
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {idx + 1}. {module.title}
                          </h3>
                          {module.description && (
                            <p className="text-sm text-gray-600">{module.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowLessonForm(module.id)}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                          <Plus className="h-4 w-4" />
                          Add Lesson
                        </button>
                        <button
                          onClick={() => handleDeleteModule(module.id)}
                          disabled={saving}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50"
                          title="Delete module"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* New Lesson Form */}
                  {showLessonForm === module.id && (
                    <div className="p-6 bg-blue-50 border-b">
                      <h4 className="font-medium text-gray-900 mb-4">New Lesson</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Lesson Title *
                          </label>
                          <input
                            type="text"
                            value={lessonTitle}
                            onChange={(e) => setLessonTitle(e.target.value)}
                            placeholder="Variables and Data Types"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                          </label>
                          <input
                            type="text"
                            value={lessonDescription}
                            onChange={(e) => setLessonDescription(e.target.value)}
                            placeholder="Learn about variables..."
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Content Type *
                          </label>
                          <select
                            value={lessonContentType}
                            onChange={(e) => {
                              setLessonContentType(e.target.value as any);
                              setLessonFile(null);
                            }}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="markdown">Markdown Text</option>
                            <option value="pdf">PDF Document</option>
                            <option value="video">Video</option>
                          </select>
                        </div>
                        
                        {lessonContentType === "markdown" ? (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Content (Markdown)
                            </label>
                            <textarea
                              value={lessonContent}
                              onChange={(e) => setLessonContent(e.target.value)}
                              placeholder="# Lesson Content&#10;&#10;Write your lesson content here in markdown format..."
                              rows={6}
                              className="w-full px-4 py-2 border rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        ) : (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Upload File *
                            </label>
                            <input
                              type="file"
                              accept={lessonContentType === "pdf" ? ".pdf" : "video/*"}
                              onChange={(e) => setLessonFile(e.target.files?.[0] || null)}
                              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            {lessonFile && (
                              <p className="mt-2 text-sm text-gray-600">
                                Selected: {lessonFile.name} ({(lessonFile.size / 1024 / 1024).toFixed(2)} MB)
                              </p>
                            )}
                          </div>
                        )}
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Duration (minutes)
                          </label>
                          <input
                            type="number"
                            value={lessonDuration}
                            onChange={(e) => setLessonDuration(parseInt(e.target.value))}
                            className="w-32 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCreateLesson(module.id)}
                            disabled={saving || uploadingFile || !lessonTitle.trim() || (lessonContentType !== "markdown" && !lessonFile)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                          >
                            {uploadingFile ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Check className="h-4 w-4" />
                                Create Lesson
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setShowLessonForm(null);
                              setLessonTitle("");
                              setLessonDescription("");
                              setLessonContent("");
                              setLessonDuration(10);
                              setLessonContentType("markdown");
                              setLessonFile(null);
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Lessons List */}
                  <div className="p-6">
                    {module.lessons && module.lessons.length > 0 ? (
                      <div className="space-y-2">
                        {module.lessons.map((lesson, lessonIdx) => (
                          <div key={lesson.id}>
                            {/* Lesson Card */}
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                              <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-gray-400" />
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {lessonIdx + 1}. {lesson.title}
                                  </p>
                                  {lesson.description && (
                                    <p className="text-sm text-gray-600">{lesson.description}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">
                                  {lesson.duration_minutes} min
                                </span>
                                <button
                                  onClick={() => {
                                    setQuizLessonId(lesson.id);
                                    setShowQuizModal(true);
                                  }}
                                  className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg"
                                  title="Generate AI Quiz"
                                >
                                  <Sparkles className="h-4 w-4" />
                                </button>
                                <button className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg">
                                  <Edit2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            {/* Saved Quizzes for this Lesson */}
                            {lessonQuizzes[lesson.id] && lessonQuizzes[lesson.id].length > 0 && (
                              <div className="ml-8 mt-2 space-y-2">
                                {lessonQuizzes[lesson.id].map((quiz) => (
                                  <div
                                    key={quiz.id}
                                    className="p-3 bg-purple-50 border-l-4 border-purple-500 rounded"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-lg">📝</span>
                                          <span className="font-medium text-gray-900">{quiz.title}</span>
                                          {quiz.is_published ? (
                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                              ✓ Published
                                            </span>
                                          ) : (
                                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                                              🔒 Draft
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
                                          <span>{quiz.questions?.length || 0} questions</span>
                                          <span>•</span>
                                          <span>Pass: {quiz.passing_score}%</span>
                                          <span>•</span>
                                          <span>{quiz.time_limit_minutes} min</span>
                                          {quiz.max_attempts && (
                                            <>
                                              <span>•</span>
                                              <span>Max {quiz.max_attempts} attempts</span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => router.push(`/quizzes/${quiz.id}/preview`)}
                                          className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                                        >
                                          Preview
                                        </button>
                                        <button
                                          onClick={() => handleDeleteQuiz(quiz.id)}
                                          className="p-1.5 text-red-600 hover:bg-red-100 rounded"
                                          title="Delete quiz"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-4">
                        No lessons yet. Click "Add Lesson" to create one.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No modules yet</h3>
              <p className="text-gray-600 mb-4">
                Start building your course by adding modules and lessons
              </p>
              <button
                onClick={() => setShowModuleForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                Add Your First Module
              </button>
            </div>
          )}
          </div>
        )}

        {/* Students Tab */}
        {activeTab === "students" && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Enrolled Students</h2>
              <p className="text-sm text-gray-600 mt-1">
                View all students enrolled in this course and track their progress
              </p>
            </div>

            {loadingEnrollments ? (
              <div className="p-12 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
                <p className="mt-4 text-gray-600">Loading students...</p>
              </div>
            ) : enrollments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Enrolled Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {enrollments.map((enrollment) => (
                      <tr key={enrollment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                              <span className="text-indigo-600 font-medium text-sm">
                                {enrollment.student_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {enrollment.student_name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{enrollment.student_email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {new Date(enrollment.enrolled_at).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-full max-w-[120px] bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="bg-indigo-600 h-2 rounded-full"
                                style={{ width: `${enrollment.progress_percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                              {Math.round(enrollment.progress_percentage)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {enrollment.is_completed ? (
                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              <Check className="h-3 w-3 mr-1" />
                              Completed
                            </span>
                          ) : (
                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              In Progress
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No students yet</h3>
                <p className="text-gray-600">
                  Students will appear here once they enroll in your course
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quiz Generation Modal */}
      {showQuizModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-purple-600" />
                  <h2 className="text-xl font-bold text-gray-900">Generate AI Quiz</h2>
                </div>
                <button
                  onClick={() => {
                    setShowQuizModal(false);
                    setGeneratedQuiz([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {generatedQuiz.length === 0 ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Questions
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={quizNumQuestions}
                      onChange={(e) => setQuizNumQuestions(parseInt(e.target.value))}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Difficulty Level
                    </label>
                    <select
                      value={quizDifficulty}
                      onChange={(e) => setQuizDifficulty(e.target.value as any)}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="easy">Easy - Basic recall</option>
                      <option value="medium">Medium - Application</option>
                      <option value="hard">Hard - Analysis & synthesis</option>
                    </select>
                  </div>

                  <button
                    onClick={handleGenerateQuiz}
                    disabled={generatingQuiz}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {generatingQuiz ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        Generate Quiz
                      </>
                    )}
                  </button>
                </>
              ) : (
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 font-medium">
                      ✅ Successfully generated {generatedQuiz.length} questions!
                    </p>
                  </div>

                  {generatedQuiz.map((q, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                      <p className="font-semibold text-gray-900 mb-3">
                        {idx + 1}. {q.question}
                      </p>
                      <div className="space-y-2 mb-3">
                        {q.options.map((opt: string, optIdx: number) => (
                          <div
                            key={optIdx}
                            className={`p-2 rounded ${
                              q.correct_answer.startsWith(String.fromCharCode(65 + optIdx))
                                ? "bg-green-100 border border-green-300"
                                : "bg-gray-50"
                            }`}
                          >
                            <span className="font-medium">
                              {String.fromCharCode(65 + optIdx)}.
                            </span>{" "}
                            {opt}
                          </div>
                        ))}
                      </div>
                      <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                        <span className="font-semibold">Explanation:</span> {q.explanation}
                      </div>
                    </div>
                  ))}

                  <div className="flex gap-3">
                    <button
                      onClick={saveQuizToDatabase}
                      disabled={savingQuiz}
                      className="flex-1 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {savingQuiz ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="h-5 w-5" />
                          Save Quiz
                        </>
                      )}
                    </button>
                    <button
                      onClick={downloadQuizAsPDF}
                      className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 flex items-center justify-center gap-2"
                    >
                      <Download className="h-5 w-5" />
                      Download PDF
                    </button>
                    <button
                      onClick={() => {
                        setShowQuizModal(false);
                        setGeneratedQuiz([]);
                      }}
                      className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

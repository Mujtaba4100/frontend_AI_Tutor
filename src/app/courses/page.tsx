"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { Course } from "@/types";
import {
  BookOpen,
  Clock,
  Filter,
  Loader2,
  Search,
  ChevronRight,
  Plus,
} from "lucide-react";

export default function CoursesPage() {
  const { isAuthenticated, user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLevel, setFilterLevel] = useState<string>("all");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // Show all courses (including unpublished) for instructors/admins
        const publishedOnly = !(user && (user.role === "instructor" || user.role === "admin"));
        const data = await api.getCourses(1, 50, publishedOnly);
        setCourses(data);
      } catch (error) {
        console.error("Failed to fetch courses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user]);

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel =
      filterLevel === "all" || course.difficulty_level === filterLevel;
    return matchesSearch && matchesLevel;
  });

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Explore Courses</h1>
          <p className="text-gray-600 mt-2">
            Browse our collection of courses and start learning today.
          </p>
        </div>
        {user && (user.role === "instructor" || user.role === "admin") && (
          <Link
            href="/courses/create"
            className="px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Create Course
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-8 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search courses..."
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      {/* Course Grid */}
      {filteredCourses.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No courses found
          </h3>
          <p className="text-gray-600">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <CourseCard key={course.id} course={course} isAuthenticated={isAuthenticated} user={user} />
          ))}
        </div>
      )}
    </div>
  );
}

function CourseCard({
  course,
  isAuthenticated,
  user,
}: {
  course: Course;
  isAuthenticated: boolean;
  user: any;
}) {
  const levelColors = {
    beginner: "bg-green-100 text-green-700",
    intermediate: "bg-yellow-100 text-yellow-700",
    advanced: "bg-red-100 text-red-700",
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="h-40 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
        <BookOpen className="h-16 w-16 text-white/80" />
      </div>
      <div className="p-6">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {!course.is_published && (
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
              📝 Draft
            </span>
          )}
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full ${
              levelColors[course.difficulty_level]
            }`}
          >
            {course.difficulty_level}
          </span>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {course.estimated_hours}h
          </span>
        </div>
        <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2">
          {course.title}
        </h3>
        <p className="text-gray-600 text-sm line-clamp-2 mb-4">
          {course.description}
        </p>
        <div className="flex items-center justify-between">
          <Link
            href={isAuthenticated ? `/courses/${course.id}` : "/login"}
            className="inline-flex items-center gap-1 text-indigo-600 font-medium hover:text-indigo-700"
          >
            {isAuthenticated ? "View Course" : "Login to Enroll"}
            <ChevronRight className="h-4 w-4" />
          </Link>
          {user && (user.role === "admin" || course.created_by === user.id) && (
            <Link
              href={`/courses/${course.id}/edit`}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Edit course"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

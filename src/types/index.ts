// User Types
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: "student" | "instructor" | "admin";
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// Course Types
export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  difficulty_level: "beginner" | "intermediate" | "advanced";
  estimated_hours: number;
  is_published: boolean;
  created_by?: string;
  created_at: string;
  updated_at?: string;
  modules?: Module[];
  enrolled_count?: number;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  order_index: number;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  content?: string;
  content_type: "markdown" | "pdf" | "video" | "quiz" | "external_link";
  content_url?: string;
  content_text?: string;
  video_url?: string;
  order_index: number;
  duration_minutes?: number;
  is_published?: boolean;
}

// Progress Types
export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  completed_at?: string;
  course?: Course;
}

export interface EnrollmentWithStudent {
  id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  course_id: string;
  enrolled_at: string;
  completed_at?: string;
  is_completed: boolean;
  progress_percentage: number;
}

export interface Progress {
  id: string;
  user_id: string;
  lesson_id: string;
  completed: boolean;
  time_spent_seconds: number;
  completed_at?: string;
}

export interface StudyStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_study_date: string;
}

export interface CourseProgress {
  course_id: string;
  course_title: string;
  total_lessons: number;
  lessons_completed: number;
  progress_percentage: number;
  last_accessed?: string;
}

// Quiz Types
export interface Quiz {
  id: string;
  lesson_id: string;
  title: string;
  passing_score: number;
  questions?: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  passed: boolean;
  answers: Record<string, number>;
  attempted_at: string;
}

// AI Tutor Types
export interface TutorMessage {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

export interface TutorResponse {
  answer: string;
  sources: Source[];
  conversation_id: string;
}

export interface Source {
  title: string;
  content: string;
  score?: number;
}

export interface MCQQuestion {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

// Forum Types
export interface ForumPost {
  id: string;
  course_id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at?: string;
  comments?: ForumComment[];
  user?: User;
}

export interface ForumComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: User;
}

// Admin Types
export interface PlatformStats {
  total_users: number;
  total_courses: number;
  total_enrollments: number;
  active_users_today: number;
  new_users_this_week: number;
  completion_rate: number;
}

export interface UserManagement {
  users: User[];
  total: number;
  page: number;
  per_page: number;
}

// API Response Types
export interface ApiError {
  detail: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
}

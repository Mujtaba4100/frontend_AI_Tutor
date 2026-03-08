import Cookies from "js-cookie";
import type {
  User,
  AuthTokens,
  Course,
  Module,
  Lesson,
  Enrollment,
  CourseProgress,
  StudyStreak,
  TutorResponse,
  MCQQuestion,
  PlatformStats,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

class ApiClient {
  private getAuthHeader(): HeadersInit {
    const token = Cookies.get("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...this.getAuthHeader(),
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      if (response.status === 401) {
        // Try refresh token
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry request
          return this.request(endpoint, options);
        }
        // Clear tokens and redirect to login
        Cookies.remove("access_token");
        Cookies.remove("refresh_token");
        window.location.href = "/login";
      }
      const error = await response.json();
      throw new Error(error.detail || "Request failed");
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string): Promise<AuthTokens> {
    try {
      console.log("📤 Attempting login to:", `${API_BASE}/api/auth/login`);
      
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      console.log("📥 Response status:", response.status);

      if (!response.ok) {
        try {
          const error = await response.json();
          console.error("❌ Error response:", error);
          throw new Error(error.detail || `Login failed (${response.status})`);
        } catch (e) {
          console.error("❌ Could not parse error response:", e);
          throw new Error(`Login failed: ${response.statusText}`);
        }
      }

      const data: any = await response.json();
      console.log("✅ Login successful, tokens received");
      
      // Store tokens from response
      Cookies.set("access_token", data.access_token, { expires: 1 });
      Cookies.set("refresh_token", data.refresh_token, { expires: 7 });
      
      return data;
    } catch (error) {
      console.error("🔴 Login error:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Login failed: Network error");
    }
  }

  async register(
    email: string,
    password: string,
    fullName: string
  ): Promise<User> {
    try {
      console.log("📤 Attempting registration to:", `${API_BASE}/api/auth/register`);
      
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
        }),
      });

      console.log("📥 Response status:", response.status);

      if (!response.ok) {
        try {
          const error = await response.json();
          console.error("❌ Error response:", error);
          throw new Error(error.detail || `Registration failed (${response.status})`);
        } catch (e) {
          console.error("❌ Could not parse error response:", e);
          throw new Error(`Registration failed: ${response.statusText}`);
        }
      }

      const tokens: any = await response.json();
      console.log("✅ Registration successful, tokens received");
      
      // Store tokens from response
      Cookies.set("access_token", tokens.access_token, { expires: 1 });
      Cookies.set("refresh_token", tokens.refresh_token, { expires: 7 });
      
      return tokens.user;
    } catch (error) {
      console.error("🔴 Registration error:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Registration failed: Network error");
    }
  }

  async refreshToken(): Promise<boolean> {
    const refreshToken = Cookies.get("refresh_token");
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) return false;

      const tokens: AuthTokens = await response.json();
      Cookies.set("access_token", tokens.access_token, { expires: 1 });
      Cookies.set("refresh_token", tokens.refresh_token, { expires: 7 });
      return true;
    } catch {
      return false;
    }
  }

  async getCurrentUser(): Promise<User> {
    return this.request("/api/auth/me");
  }

  logout() {
    Cookies.remove("access_token");
    Cookies.remove("refresh_token");
    window.location.href = "/login";
  }

  // Courses
  async getCourses(page = 1, perPage = 10, publishedOnly = true): Promise<Course[]> {
    return this.request(`/api/courses?skip=${(page - 1) * perPage}&limit=${perPage}&published_only=${publishedOnly}`);
  }

  async getCourse(id: string): Promise<Course> {
    return this.request(`/api/courses/${id}`);
  }

  async createCourse(data: Partial<Course>): Promise<Course> {
    return this.request("/api/courses", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateCourse(id: string, data: Partial<Course>): Promise<Course> {
    return this.request(`/api/courses/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // Modules
  async createModule(courseId: string, data: Partial<Module>): Promise<Module> {
    return this.request(`/api/courses/${courseId}/modules`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async deleteModule(moduleId: string): Promise<void> {
    return this.request(`/api/courses/modules/${moduleId}`, {
      method: "DELETE",
    });
  }

  async getCourseEnrollments(courseId: string): Promise<any[]> {
    return this.request(`/api/courses/${courseId}/enrollments`);
  }

  // Lessons
  async getLesson(moduleId: string, lessonId: string): Promise<Lesson> {
    return this.request(`/api/courses/modules/${moduleId}/lessons/${lessonId}`);
  }

  async createLesson(moduleId: string, data: Partial<Lesson>): Promise<Lesson> {
    return this.request(`/api/courses/modules/${moduleId}/lessons`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Enrollments & Progress
  async enrollCourse(courseId: string): Promise<Enrollment> {
    return this.request(`/api/progress/enroll`, {
      method: "POST",
      body: JSON.stringify({ course_id: courseId }),
    });
  }

  async getEnrollments(): Promise<Enrollment[]> {
    return this.request("/api/progress/enrollments");
  }

  async getCourseProgress(courseId: string): Promise<CourseProgress> {
    const allProgress: CourseProgress[] = await this.request("/api/progress/enrollments");
    const courseProgress = allProgress.find(p => p.course_id === courseId);
    if (!courseProgress) {
      throw new Error("Not enrolled in this course");
    }
    return courseProgress;
  }

  async getLessonProgress(lessonId: string): Promise<any> {
    return this.request(`/api/progress/lessons/${lessonId}`);
  }

  async markLessonComplete(lessonId: string, timeSpent: number): Promise<void> {
    await this.request(`/api/progress/lesson/${lessonId}/complete`, {
      method: "POST",
      body: JSON.stringify({ time_spent_seconds: timeSpent }),
    });
  }

  async getStreak(): Promise<StudyStreak> {
    return this.request("/api/progress/streak");
  }

  async recordStudy(): Promise<StudyStreak> {
    return this.request("/api/progress/study", { method: "POST" });
  }

  // AI Tutor
  async askTutor(
    question: string,
    conversationId?: string,
    courseContext?: string
  ): Promise<TutorResponse> {
    return this.request("/api/tutor/ask", {
      method: "POST",
      body: JSON.stringify({
        question,
        conversation_id: conversationId,
        course_context: courseContext,
      }),
    });
  }

  async getSummary(content: string, maxLength = 200): Promise<{ summary: string }> {
    return this.request("/api/tutor/summary", {
      method: "POST",
      body: JSON.stringify({ content, max_length: maxLength }),
    });
  }

  async generateMCQ(
    content: string,
    numQuestions = 5
  ): Promise<{ questions: MCQQuestion[] }> {
    return this.request("/api/tutor/mcq", {
      method: "POST",
      body: JSON.stringify({ content, num_questions: numQuestions }),
    });
  }

  async getHint(
    question: string,
    userAnswer: string,
    correctAnswer: string
  ): Promise<{ hint: string }> {
    return this.request("/api/tutor/hint", {
      method: "POST",
      body: JSON.stringify({
        question,
        user_answer: userAnswer,
        correct_answer: correctAnswer,
      }),
    });
  }

  // Admin
  async getPlatformStats(): Promise<PlatformStats> {
    return this.request("/api/admin/stats");
  }

  async getUsers(
    page = 1,
    perPage = 20,
    role?: string
  ): Promise<User[]> {
    const params = new URLSearchParams({
      skip: String((page - 1) * perPage),
      limit: String(perPage),
    });
    if (role) params.append("role", role);
    return this.request(`/api/admin/users?${params}`);
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    return this.request(`/api/admin/users/${userId}/role`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    });
  }

  async getCourseAnalytics(
    courseId: string
  ): Promise<{
    total_enrollments: number;
    completed_count: number;
    average_progress: number;
    completion_rate: number;
  }> {
    return this.request(`/api/admin/courses/${courseId}/analytics`);
  }
}

export const api = new ApiClient();

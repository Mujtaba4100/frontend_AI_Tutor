"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import type { PlatformStats, User } from "@/types";
import {
  Users,
  BookOpen,
  TrendingUp,
  Award,
  Loader2,
  ChevronRight,
  UserCheck,
  Calendar,
} from "lucide-react";

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<"overview" | "users">("overview");

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/dashboard");
      return;
    }

    const fetchData = async () => {
      try {
        const [statsData, usersData] = await Promise.all([
          api.getPlatformStats(),
          api.getUsers(1, 10),
        ]);
        setStats(statsData);
        setUsers(Array.isArray(usersData) ? usersData : []);
      } catch (error) {
        console.error("Failed to fetch admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === "admin") {
      fetchData();
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Monitor platform performance and manage users.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => setSelectedTab("overview")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedTab === "overview"
              ? "bg-indigo-600 text-white"
              : "bg-white text-gray-600 hover:bg-gray-100"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setSelectedTab("users")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedTab === "users"
              ? "bg-indigo-600 text-white"
              : "bg-white text-gray-600 hover:bg-gray-100"
          }`}
        >
          Users
        </button>
      </div>

      {selectedTab === "overview" ? (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={Users}
              label="Total Users"
              value={stats?.total_users || 0}
              color="indigo"
            />
            <StatCard
              icon={BookOpen}
              label="Total Courses"
              value={stats?.total_courses || 0}
              color="green"
            />
            <StatCard
              icon={UserCheck}
              label="Total Enrollments"
              value={stats?.total_enrollments || 0}
              color="purple"
            />
            <StatCard
              icon={Award}
              label="Completion Rate"
              value={`${Math.round((stats?.completion_rate || 0) * 100)}%`}
              color="orange"
            />
          </div>

          {/* Activity Stats */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Activity</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <span className="text-gray-600">Active Users Today</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {stats?.active_users_today || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="text-gray-600">New Users This Week</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {stats?.new_users_this_week || 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => router.push("/courses")}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <span className="text-gray-700">Create New Course</span>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>
                <button 
                  onClick={() => setSelectedTab("users")}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <span className="text-gray-700">View All Reports</span>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>
                <button 
                  onClick={() => router.push("/courses")}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <span className="text-gray-700">Manage Content</span>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Recent Users */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Recent Users</h3>
              <button
                onClick={() => setSelectedTab("users")}
                className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
              >
                View all
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {users.slice(0, 5).map((u) => (
                <UserRow key={u.id} user={u} />
              ))}
            </div>
          </div>
        </>
      ) : (
        <UsersTab users={users} />
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color: "indigo" | "green" | "purple" | "orange";
}) {
  const colors = {
    indigo: "bg-indigo-100 text-indigo-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div
        className={`w-12 h-12 rounded-xl ${colors[color]} flex items-center justify-center mb-4`}
      >
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-gray-600 text-sm">{label}</p>
    </div>
  );
}

function UserRow({ user }: { user: User }) {
  const roleColors = {
    student: "bg-blue-100 text-blue-700",
    instructor: "bg-green-100 text-green-700",
    admin: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
          <Users className="h-5 w-5 text-gray-500" />
        </div>
        <div>
          <p className="font-medium text-gray-900">{user.full_name}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </div>
      <span
        className={`text-xs font-medium px-2 py-1 rounded-full ${
          roleColors[user.role]
        }`}
      >
        {user.role}
      </span>
    </div>
  );
}

function UsersTab({ users }: { users: User[] }) {
  const [filter, setFilter] = useState<string>("all");

  const filteredUsers = users.filter(
    (u) => filter === "all" || u.role === filter
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h3 className="font-semibold text-gray-900">All Users</h3>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
        >
          <option value="all">All Roles</option>
          <option value="student">Students</option>
          <option value="instructor">Instructors</option>
          <option value="admin">Admins</option>
        </select>
      </div>
      <div className="divide-y divide-gray-100">
        {filteredUsers.map((u) => (
          <UserRow key={u.id} user={u} />
        ))}
        {filteredUsers.length === 0 && (
          <div className="px-6 py-8 text-center text-gray-500">
            No users found
          </div>
        )}
      </div>
    </div>
  );
}

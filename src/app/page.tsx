import Link from "next/link";
import { BookOpen, Brain, Trophy, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-64px)]">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Learn Smarter with
              <span className="text-indigo-200"> AI-Powered</span> Education
            </h1>
            <p className="text-xl md:text-2xl text-indigo-100 mb-8 max-w-3xl mx-auto">
              Transform your learning experience with personalized AI tutoring,
              interactive courses, and progress tracking.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-indigo-50 transition-colors shadow-lg"
              >
                Start Learning Free
              </Link>
              <Link
                href="/courses"
                className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/10 transition-colors"
              >
                Browse Courses
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
            Why Choose LearnHub?
          </h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Our platform combines cutting-edge AI technology with proven
            learning methodologies to help you succeed.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={Brain}
              title="AI Tutor"
              description="Get instant answers and explanations from our AI-powered tutor available 24/7."
            />
            <FeatureCard
              icon={BookOpen}
              title="Rich Courses"
              description="Access comprehensive courses with videos, quizzes, and interactive content."
            />
            <FeatureCard
              icon={Trophy}
              title="Track Progress"
              description="Monitor your learning journey with detailed analytics and study streaks."
            />
            <FeatureCard
              icon={Users}
              title="Community"
              description="Connect with fellow learners through forums and discussion boards."
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <StatCard number="10,000+" label="Active Learners" />
            <StatCard number="500+" label="Courses" />
            <StatCard number="95%" label="Satisfaction Rate" />
            <StatCard number="24/7" label="AI Support" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-indigo-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Your Learning Journey?
          </h2>
          <p className="text-indigo-100 text-lg mb-8">
            Join thousands of students who are already learning smarter with
            LearnHub.
          </p>
          <Link
            href="/register"
            className="inline-block bg-white text-indigo-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-indigo-50 transition-colors shadow-lg"
          >
            Get Started for Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <BookOpen className="h-8 w-8 text-indigo-400" />
              <span className="font-bold text-xl text-white">LearnHub</span>
            </div>
            <p className="text-sm">
              © 2024 LearnHub. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-gray-50 rounded-2xl p-6 text-center hover:shadow-lg transition-shadow">
      <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
        <Icon className="h-7 w-7 text-indigo-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <p className="text-3xl md:text-4xl font-bold text-indigo-600">{number}</p>
      <p className="text-gray-600 mt-1">{label}</p>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft,
  ThumbsUp,
  MessageSquare,
  CheckCircle2,
  Pin,
  Loader2,
  Send,
  Edit2,
  Trash2,
} from "lucide-react";

interface User {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
}

interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  content: string;
  is_accepted_answer: boolean;
  upvotes: number;
  created_at: string;
  updated_at: string;
  author: User;
}

interface Post {
  id: string;
  module_id: string | null;
  author_id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  is_resolved: boolean;
  upvotes: number;
  view_count: number;
  created_at: string;
  updated_at: string;
  author: User;
  comments: Comment[];
  comment_count: number;
}

export default function ForumPostPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const postId = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    fetchPost();
  }, [postId, isAuthenticated, router]);

  const fetchPost = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/forum/posts/${postId}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) throw new Error("Failed to fetch post");

      const data = await response.json();
      setPost(data);
    } catch (error) {
      console.error("Failed to fetch post:", error);
      alert("Failed to load post");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleUpvotePost = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/forum/posts/${postId}/upvote`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (response.ok) {
        fetchPost(); // Refresh to get updated upvote count
      }
    } catch (error) {
      console.error("Failed to upvote:", error);
    }
  };

  const handleUpvoteComment = async (commentId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/forum/comments/${commentId}/upvote`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (response.ok) {
        fetchPost();
      }
    } catch (error) {
      console.error("Failed to upvote comment:", error);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/forum/posts/${postId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            content: commentText,
            parent_id: replyingTo,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to post comment");

      setCommentText("");
      setReplyingTo(null);
      fetchPost();
    } catch (error) {
      console.error("Failed to post comment:", error);
      alert("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkResolved = async () => {
    if (!post) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/forum/posts/${postId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            is_resolved: !post.is_resolved,
          }),
        }
      );

      if (response.ok) {
        fetchPost();
      }
    } catch (error) {
      console.error("Failed to update post:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Post not found
          </h2>
          <button
            onClick={() => router.push("/forum")}
            className="text-indigo-600 hover:text-indigo-700"
          >
            Back to forum
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <button
          onClick={() => router.push("/forum")}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Forum
        </button>

        {/* Post */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="flex items-start gap-4 mb-6">
            {/* Avatar */}
            {post.author.avatar_url ? (
              <img
                src={post.author.avatar_url}
                alt={post.author.full_name}
                className="w-12 h-12 rounded-full"
              />
            ) : (
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold text-lg">
                {post.author.full_name.charAt(0)}
              </div>
            )}

            {/* Author Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {post.is_pinned && (
                  <Pin className="h-4 w-4 text-amber-500 fill-amber-500" />
                )}
                {post.is_resolved && (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )}
                <h1 className="text-2xl font-bold text-gray-900">{post.title}</h1>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span className="font-medium">{post.author.full_name}</span>
                {post.author.role === "instructor" && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                    Instructor
                  </span>
                )}
                <span>•</span>
                <span>{formatDate(post.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="prose max-w-none mb-6">
            <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4 border-t">
            <button
              onClick={handleUpvotePost}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              <ThumbsUp className="h-5 w-5" />
              <span className="font-semibold">{post.upvotes}</span>
            </button>
            <div className="flex items-center gap-2 text-gray-600">
              <MessageSquare className="h-5 w-5" />
              <span>{post.comment_count} replies</span>
            </div>
            {user?.id === post.author_id && (
              <button
                onClick={handleMarkResolved}
                className={`ml-auto px-4 py-2 rounded-lg font-semibold ${
                  post.is_resolved
                    ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    : "bg-green-100 text-green-700 hover:bg-green-200"
                }`}
              >
                {post.is_resolved ? "Mark as Unresolved" : "Mark as Resolved"}
              </button>
            )}
          </div>
        </div>

        {/* Comments */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Replies ({post.comments.length})
          </h2>

          {post.comments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No replies yet. Be the first to respond!
            </p>
          ) : (
            <div className="space-y-6">
              {post.comments.map((comment) => (
                <div key={comment.id} className="flex gap-4">
                  {/* Avatar */}
                  {comment.author.avatar_url ? (
                    <img
                      src={comment.author.avatar_url}
                      alt={comment.author.full_name}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-semibold">
                      {comment.author.full_name.charAt(0)}
                    </div>
                  )}

                  {/* Comment Content */}
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900">
                          {comment.author.full_name}
                        </span>
                        {comment.author.role === "instructor" && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                            Instructor
                          </span>
                        )}
                        {comment.is_accepted_answer && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Accepted Answer
                          </span>
                        )}
                        <span className="text-xs text-gray-500 ml-auto">
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>

                    {/* Comment Actions */}
                    <div className="flex items-center gap-4 mt-2 ml-2">
                      <button
                        onClick={() => handleUpvoteComment(comment.id)}
                        className="flex items-center gap-1 text-sm text-gray-600 hover:text-indigo-600"
                      >
                        <ThumbsUp className="h-4 w-4" />
                        <span>{comment.upvotes}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reply Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Add a Reply</h3>
          <form onSubmit={handleSubmitComment}>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write your reply..."
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              rows={4}
            />
            <div className="flex justify-end mt-4">
              <button
                type="submit"
                disabled={submitting || !commentText.trim()}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Post Reply
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

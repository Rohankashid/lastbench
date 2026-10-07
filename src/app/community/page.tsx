"use client";

import React, { useEffect, useState } from "react";
import { collection, addDoc, query, orderBy, onSnapshot, Timestamp, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/context/AuthModalContext";
import { Modal } from "@/components/ui/Modal";
import { motion } from "framer-motion";

interface Post {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: Timestamp;
  pinnedAt?: Timestamp | null;
}

export default function CommunityPage() {
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostText, setNewPostText] = useState("");
  const [loading, setLoading] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      user.getIdToken().then(token => {
        fetch('/api/auth/is-admin', {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => setIsAdmin(data.isAdmin))
        .catch(() => setIsAdmin(false));
      });
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  useEffect(() => {
    const q = query(
      collection(db, "community_posts"),
      orderBy("pinnedAt", "desc"),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Post))
      );
      setIsFetching(false);
    });
    return () => unsubscribe();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPostText.trim()) return;
    setLoading(true);
    try {
      await addDoc(collection(db, "community_posts"), {
        authorId: user.uid,
        authorName: user.displayName || user.email?.split('@')[0] || "Student",
        text: newPostText.trim(),
        createdAt: Timestamp.now(),
        pinnedAt: null,
      });
      setNewPostText("");
    } catch (error) {
      console.error("Failed to post:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePin = async (postId: string, isPinned: boolean) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      await fetch('/api/community/pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          postId,
          action: isPinned ? 'unpin' : 'pin'
        })
      });
    } catch (error) {
      console.error('Failed to toggle pin:', error);
    }
  };

  const confirmDeletePost = async () => {
    if (!postToDelete) return;
    try {
      await deleteDoc(doc(db, "community_posts", postToDelete));
      setPostToDelete(null);
    } catch (error) {
      console.error("Failed to delete post:", error);
    }
  };

  const formatTime = (timestamp: Timestamp) => {
    if (!timestamp) return "Just now";
    const date = timestamp.toDate();
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000); // in seconds
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="relative min-h-[calc(100vh-64px)] bg-white selection:bg-zinc-200">
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-16 pb-32 flex flex-col">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-12"
        >
          <h1 className="text-4xl sm:text-5xl font-semibold text-zinc-950 tracking-[-0.04em] mb-3">
            Community
          </h1>
          <p className="text-base text-zinc-500 tracking-[-0.01em] max-w-xl">
            A minimalist board for engineering students to ask questions, request notes and papers, or discuss insems.
          </p>
        </motion.div>

        {/* Composer Section */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-12"
        >
          {!user ? (
            <div className="py-6 border-t border-zinc-200">
              <p className="text-sm text-zinc-500">
                You must be signed in to post.{" "}
                <button onClick={() => openAuthModal('signin')} className="text-zinc-950 hover:underline font-medium">
                  Sign in &rarr;
                </button>
              </p>
            </div>
          ) : (
            <form onSubmit={handleCreatePost} className="flex flex-col border border-zinc-200 focus-within:border-zinc-400 transition-colors bg-white">
              <textarea
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                placeholder="Start a new discussion..."
                className="w-full min-h-[100px] p-4 text-sm text-zinc-950 placeholder:text-zinc-400 focus:outline-none resize-none bg-transparent"
                disabled={loading}
                required
              />
              <div className="flex justify-between items-center px-4 py-3 border-t border-zinc-100 bg-zinc-50/50">
                <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest">
                  Posting as {user.displayName?.split(' ')[0] || user.email?.split('@')[0]}
                </span>
                <button
                  type="submit"
                  disabled={loading || !newPostText.trim()}
                  className="px-4 py-1.5 bg-zinc-950 text-white text-xs font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Posting..." : "Post"}
                </button>
              </div>
            </form>
          )}
        </motion.div>

        {/* Feed Section */}
        <div className="flex flex-col">
          {isFetching ? (
            <div className="py-12 text-center text-sm text-zinc-500 font-mono">
              Loading...
            </div>
          ) : posts.length === 0 ? (
            <div className="py-24 border-t border-zinc-200 text-center flex flex-col items-center">
              <h3 className="text-sm font-medium text-zinc-950 mb-1">No discussions</h3>
              <p className="text-sm text-zinc-500">The board is currently empty.</p>
            </div>
          ) : (
            <div className="flex flex-col border-t border-zinc-200">
              {posts.map((post) => (
                <div 
                  key={post.id} 
                  className="py-6 border-b border-zinc-100 group flex flex-col sm:flex-row sm:items-start gap-4"
                >
                  <div className="flex-shrink-0 flex items-center gap-3 sm:w-32 sm:block sm:gap-0">
                    <div className="flex items-center gap-2 sm:mb-1">
                      <div className="w-5 h-5 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-[9px] font-semibold text-zinc-700">
                        {post.authorName?.[0]?.toUpperCase() || "U"}
                      </div>
                      <span className="text-xs font-medium text-zinc-950 truncate max-w-[100px]">
                        {post.authorName}
                      </span>
                      {post.pinnedAt && (
                        <span className="text-[9px] font-medium text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded uppercase tracking-wider hidden sm:inline-block">
                          Pinned
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 sm:block sm:pl-7">
                      <span className="text-[11px] font-mono text-zinc-400">
                        {formatTime(post.createdAt)}
                      </span>
                      {post.pinnedAt && (
                        <span className="text-[9px] font-medium text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded uppercase tracking-wider sm:hidden">
                          Pinned
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 flex flex-col sm:flex-row sm:justify-between gap-4">
                    <p className="text-sm text-zinc-800 leading-relaxed whitespace-pre-wrap flex-1">
                      {post.text}
                    </p>
                    
                    <div className="flex items-center gap-3 self-start">
                      {isAdmin && (
                        <button
                          onClick={() => handleTogglePin(post.id, !!post.pinnedAt)}
                          className="text-[11px] font-medium text-zinc-400 hover:text-zinc-900 transition-colors sm:opacity-0 group-hover:opacity-100"
                        >
                          {post.pinnedAt ? 'Unpin' : 'Pin'}
                        </button>
                      )}
                      {user && user.uid === post.authorId && (
                        <button
                          onClick={() => setPostToDelete(post.id)}
                          className="text-[11px] font-medium text-zinc-400 hover:text-rose-600 transition-colors sm:opacity-0 group-hover:opacity-100"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
      
      <Modal
        isOpen={!!postToDelete}
        onClose={() => setPostToDelete(null)}
        onConfirm={confirmDeletePost}
        title="Delete Post"
        variant="danger"
        confirmText="Delete"
        cancelText="Cancel"
      >
        Are you sure you want to delete this post?
      </Modal>
    </div>
  );
}

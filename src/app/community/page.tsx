"use client";

import React, { useEffect, useState } from "react";
import { collection, addDoc, query, orderBy, onSnapshot, Timestamp, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/context/AuthModalContext";
import { Modal } from "@/components/ui/Modal";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface Post {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: Timestamp;
}

const MOCK_CHATS = [
  { id: "mock1", authorName: "Rahul S.", text: "Anyone have the SPPU engineering math notes for Sem 3? Need them urgently for midterms!", time: "2m ago" },
  { id: "mock2", authorName: "Priya M.", text: "Check out the latest upload in the PYQ section, I just added the 2023 papers for Data Structures.", time: "15m ago" },
  { id: "mock3", authorName: "Amit K.", text: "Is the deadline for the DB assignment extended? Heard some rumors in class today.", time: "1h ago" },
  { id: "mock4", authorName: "Neha R.", text: "I highly recommend going through the mock tests before tomorrow's lab viva. Helped me a ton!", time: "2h ago" },
];

export default function CommunityPage() {
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostText, setNewPostText] = useState("");
  const [loading, setLoading] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, "community_posts"),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Post))
      );
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
      });
      setNewPostText("");
    } catch (error) {
      console.error("Failed to post:", error);
    } finally {
      setLoading(false);
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

  return (
    <div className="relative min-h-screen py-10 lg:py-16 px-4 sm:px-6">
      
      {/* Strict Grid Background (smaller cells as requested) */}
      {/* Global grid handles background now */}
      
      
      <div className="max-w-6xl mx-auto relative z-10 mb-8 lg:mb-12">
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="border-b-4 border-zinc-950 pb-6"
          >
            <h1 className="text-5xl font-black text-zinc-950 uppercase tracking-tighter mb-4">
              Community
            </h1>
            <p className="text-lg text-zinc-700 font-bold max-w-2xl leading-relaxed">
              Discuss topics, ask questions, and connect. Stay ahead of the curve.
            </p>
          </motion.div>
      </div>
      <div className="max-w-6xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Left Column: Fixed Header and Action Card */}
        <div className="lg:col-span-5 flex flex-col gap-8 lg:sticky lg:top-24 h-max">
          

          {!user ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white border-4 border-zinc-950 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 relative"
            >
              <div className="relative aspect-[4/3] w-full border-4 border-zinc-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-slate-100 mb-6">
                <Image 
                  src="/community_illustration.jpg" 
                  alt="Students collaborating" 
                  fill
                  className="object-cover"
                />
              </div>
              <h2 className="text-2xl font-black text-zinc-950 mb-3 uppercase tracking-tight">Join the Network</h2>
              <p className="text-zinc-700 font-bold mb-6 leading-relaxed text-sm">
                Exchange study materials, debate past papers, and elevate your learning experience.
              </p>
              <button
                onClick={() => openAuthModal('signin')}
                className="w-full text-center px-6 py-4 bg-zinc-950 text-white text-sm font-black uppercase tracking-wider border-4 border-transparent hover:bg-white hover:text-zinc-950 hover:border-zinc-950 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
              >
                Sign In to Join
              </button>
            </motion.div>
          ) : (
            <motion.form 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleCreatePost} 
              className="bg-white p-6 border-4 border-zinc-950 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 bg-zinc-950 flex items-center justify-center text-sm font-black text-white">
                  {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                </div>
                <h3 className="font-black text-xl text-zinc-950 uppercase tracking-tight">Start a discussion</h3>
              </div>
              <textarea
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                placeholder="What's on your mind? Share a tip or ask a question..."
                className="w-full border-4 border-zinc-950 p-4 text-base focus:outline-none focus:ring-0 focus:bg-zinc-50 transition-colors resize-y min-h-[140px] font-bold placeholder:text-zinc-400 rounded-none"
                disabled={loading}
                required
              />
              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={loading || !newPostText.trim()}
                  className="px-8 py-3 bg-zinc-950 text-white font-black uppercase tracking-wider border-4 border-transparent hover:bg-white hover:text-zinc-950 hover:border-zinc-950 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? "Posting..." : "Post"}
                </button>
              </div>
            </motion.form>
          )}
        </div>

        {/* Right Column: Feed */}
        <div className="lg:col-span-7 flex flex-col gap-6 lg:pt-0">
          <AnimatePresence mode="wait">
            {!user ? (
              // GUEST VIEW: Animated Advertisement Window in Neobrutalism Style
              <motion.div 
                key="guest-view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="relative w-full border-4 border-zinc-950 bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col h-[600px]"
              >
                {/* Neobrutalist Window Header */}
                <div className="h-14 border-b-4 border-zinc-950 flex items-center px-4 gap-3 shrink-0 z-20 bg-[#fafafa]">
                  <div className="flex gap-2">
                    <div className="w-4 h-4 bg-zinc-950 border-2 border-zinc-950" />
                    <div className="w-4 h-4 bg-zinc-950 border-2 border-zinc-950" />
                    <div className="w-4 h-4 bg-zinc-950 border-2 border-zinc-950" />
                  </div>
                  <div className="mx-auto text-sm font-black text-zinc-950 uppercase tracking-widest flex items-center gap-2 pr-8">
                    <span className="w-2.5 h-2.5 bg-zinc-950 animate-pulse" />
                    Live Demo
                  </div>
                </div>
                
                {/* Scrolling Feed */}
                <div className="flex-1 relative bg-white overflow-hidden">
                  <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-b from-white via-transparent to-transparent h-20" />
                  
                  <motion.div 
                    animate={{ y: ["0%", "-50%"] }}
                    transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
                    className="flex flex-col gap-6 p-6 pt-6"
                  >
                    {[...MOCK_CHATS, ...MOCK_CHATS, ...MOCK_CHATS].map((post, i) => (
                      <div key={i} className="bg-white p-6 border-4 border-zinc-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-10 h-10 bg-zinc-100 flex items-center justify-center text-sm font-black text-zinc-950 border-2 border-zinc-950">
                            {post.authorName[0]}
                          </div>
                          <div>
                            <h4 className="font-black text-base text-zinc-950 uppercase">{post.authorName}</h4>
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mt-0.5">{post.time}</p>
                          </div>
                        </div>
                        <div className="text-zinc-900 text-[15px] font-bold leading-relaxed">
                          {post.text}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                  
                  {/* Overlay CTA */}
                  <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-white via-white/90 to-transparent z-20 flex flex-col items-center justify-end pb-8 px-6">
                    <button onClick={() => openAuthModal('signin')} className="w-full max-w-sm px-6 py-4 bg-zinc-950 text-white text-sm font-black uppercase tracking-wider border-4 border-zinc-950 hover:bg-white hover:text-zinc-950 transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1">
                      Unlock Full Access
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : posts.length === 0 ? (
               // LOGGED IN, NO POSTS
               <motion.div 
                 key="empty"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 className="text-center py-24 bg-white border-4 border-zinc-950 border-dashed"
               >
                  <h3 className="text-2xl font-black text-zinc-950 mb-2 uppercase tracking-tight">No discussions yet</h3>
                  <p className="text-zinc-700 font-bold">Be the first to start a conversation with the community!</p>
               </motion.div>
            ) : (
               // LOGGED IN, SHOW POSTS
               <motion.div key="feed" className="flex flex-col gap-6">
                 {posts.map((post, index) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.05, 0.4) }}
                    key={post.id} 
                    className="bg-white p-6 sm:p-8 border-4 border-zinc-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 transition-all"
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-zinc-100 flex items-center justify-center text-lg font-black text-zinc-950 border-4 border-zinc-950">
                          {post.authorName?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div>
                          <h4 className="font-black text-lg text-zinc-950 leading-tight uppercase tracking-tight">{post.authorName}</h4>
                          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mt-1">
                            {post.createdAt?.toDate?.().toLocaleString() || "Just now"}
                          </p>
                        </div>
                      </div>
                      {user && user.uid === post.authorId && (
                        <button
                          onClick={() => setPostToDelete(post.id)}
                          className="text-xs font-black uppercase tracking-wider text-white bg-rose-500 border-4 border-zinc-950 px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all opacity-0 group-hover:opacity-100"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <div className="text-zinc-900 font-bold whitespace-pre-wrap leading-relaxed text-base">
                      {post.text}
                    </div>
                  </motion.div>
                 ))}
               </motion.div>
            )}
          </AnimatePresence>
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
        Are you sure you want to delete this post? This action cannot be undone.
      </Modal>
    </div>
  );
}

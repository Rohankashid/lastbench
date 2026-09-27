"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { doc, getDoc, collection, addDoc, query, orderBy, onSnapshot, Timestamp, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeftIcon, ArrowDownTrayIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import { BackgroundGrid } from "@/components/ui/BackgroundGrid";
import { DocumentViewer } from "@/components/ui/DocumentViewer";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { SignInModal } from "@/components/ui/SignInModal";
import { useAuthModal } from "@/context/AuthModalContext";
import { BookmarkButton } from "@/components/ui/BookmarkButton";

interface PYQ {
  id: string;
  title: string;
  name?: string;
  description: string;
  subject: string;
  semester: string;
  university: string;
  branch?: string;
  year: string;
  examYear: string;
  downloadUrl: string;
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: string;
}

interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: Timestamp;
  parentId: string | null;
}

export default function PYQDetailPage() {
  const params = useParams()!;
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const { toast } = useToast();
  const [pyq, setPYQ] = useState<PYQ | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showDownloadSignIn, setShowDownloadSignIn] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    if (!id) return;
    const fetchPYQ = async () => {
      setLoading(true);
      try {
        const pyqDoc = await getDoc(doc(db, "materials", id as string));
        if (pyqDoc.exists()) {
          const data = pyqDoc.data();
          const { uploadedBy, ...safeData } = data;
          setPYQ({ id: pyqDoc.id, ...safeData } as PYQ);
        } else {
          setError("PYQ not found");
        }
      } catch {
        setError("Failed to fetch PYQ");
      } finally {
        setLoading(false);
      }
    };
    fetchPYQ();
  }, [id]);

  useEffect(() => {
    if (!user) return;
    const fetchRole = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setIsAdmin(userDoc.data().role === "admin");
        }
      } catch {}
    };
    fetchRole();
  }, [user]);

  useEffect(() => {
    if (!id) return;
    const q = query(
      collection(db, "materials", id as string, "comments"),
      orderBy("createdAt", "asc")
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setComments(
          snapshot.docs.map((doc) => ({ id: doc.id, parentId: null, ...doc.data() } as Comment))
        );
      },
      (error) => {
        // Silently handle permission errors for guests
        if (error.code !== 'permission-denied') {
          console.warn('Comments listener error:', error.message);
        }
        setComments([]);
      }
    );
    return () => unsubscribe();
  }, [id]);

  const handleAddComment = async (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault();
    if (!user) return;
    const text = parentId ? replyText : commentText;
    if (!text.trim()) return;
    setCommentLoading(true);
    try {
      await addDoc(collection(db, "materials", id as string, "comments"), {
        authorId: user.uid,
        authorName: user.displayName || user.email?.split('@')[0] || "Student",
        text: text.trim(),
        createdAt: Timestamp.now(),
        parentId: parentId || null,
      });
      if (parentId) setReplyText("");
      else setCommentText("");
      setReplyingTo(null);
      toast.success(parentId ? "Reply posted" : "Comment posted");
    } catch {
      toast.error("Failed to post comment");
    } finally {
      setCommentLoading(false);
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingText(comment.text);
  };

  const handleEditComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCommentId || !editingText.trim()) return;
    setCommentLoading(true);
    try {
      await updateDoc(
        doc(db, "materials", id as string, "comments", editingCommentId),
        { text: editingText.trim() }
      );
      setEditingCommentId(null);
      setEditingText("");
      toast.success("Comment updated");
    } catch {
      toast.error("Failed to update comment");
    } finally {
      setCommentLoading(false);
    }
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;
    setCommentLoading(true);
    try {
      await deleteDoc(doc(db, "materials", id as string, "comments", commentToDelete));
      toast.success("Comment deleted permanently");
      setCommentToDelete(null);
    } catch {
      toast.error("Failed to delete comment");
    } finally {
      setCommentLoading(false);
    }
  };

  const groupComments = (comments: Comment[]) => {
    const map: { [parentId: string]: Comment[] } = {};
    comments.forEach(comment => {
      const pid = comment.parentId || "root";
      if (!map[pid]) map[pid] = [];
      map[pid].push(comment);
    });
    return map;
  };
  const grouped = groupComments(comments);

  const renderComments = (parentId: string | null = null, level = 0) => {
    const pid = parentId || "root";
    return (grouped[pid] || []).map(comment => (
      <div key={comment.id} className={`py-4 flex items-start gap-4 ${level > 0 ? 'ml-4 pl-4 border-l-2 border-indigo-200' : 'border-b border-slate-100'}`}>
        <div className="w-10 h-10 rounded-full bg-gradient-primary flex-shrink-0 flex items-center justify-center text-sm font-bold text-white shadow-md">
          {comment.authorName?.[0]?.toUpperCase() || "U"}
        </div>
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1">
            <span className="font-semibold text-slate-900">{comment.authorName}</span>
            <span className="text-slate-400 text-xs">{comment.createdAt?.toDate?.().toLocaleString?.() || ""}</span>
          </div>
          
          {editingCommentId === comment.id ? (
            <form onSubmit={handleEditComment} className="flex flex-col gap-2 mt-2">
              <textarea
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-y min-h-[80px]"
                disabled={commentLoading}
                required
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  disabled={commentLoading || !editingText.trim()}
                >Save</button>
                <button
                  type="button"
                  className="px-4 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                  onClick={() => { setEditingCommentId(null); setEditingText(""); }}
                  disabled={commentLoading}
                >Cancel</button>
              </div>
            </form>
          ) : (
            <div className="text-sm text-slate-700 leading-relaxed">{comment.text}</div>
          )}

          <div className="flex gap-4 mt-3 text-xs font-medium text-slate-500">
            {user && !editingCommentId && (
              <button
                className="hover:text-indigo-600 transition-colors"
                onClick={() => setReplyingTo(comment.id)}
                disabled={commentLoading}
              >Reply</button>
            )}
            {(user && (user.uid === comment.authorId || isAdmin)) && !editingCommentId && (
              <>
                <button
                  className="hover:text-indigo-600 transition-colors"
                  onClick={() => startEdit(comment)}
                  disabled={commentLoading}
                >Edit</button>
                <button
                  className="text-rose-500 hover:text-rose-700 transition-colors"
                  onClick={() => setCommentToDelete(comment.id)}
                  disabled={commentLoading}
                >Delete</button>
              </>
            )}
          </div>

          {replyingTo === comment.id && (
            <form onSubmit={e => handleAddComment(e, comment.id)} className="mt-4 flex flex-col gap-3">
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-y min-h-[80px]"
                placeholder="Write a reply..."
                disabled={commentLoading}
                required
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  disabled={commentLoading || !replyText.trim()}
                >Post Reply</button>
                <button
                  type="button"
                  className="px-4 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                  onClick={() => { setReplyingTo(null); setReplyText(""); }}
                  disabled={commentLoading}
                >Cancel</button>
              </div>
            </form>
          )}

          <div className="mt-2">
            {renderComments(comment.id, level + 1)}
          </div>
        </div>
      </div>
    ));
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center text-rose-500 font-medium px-4 py-3 bg-rose-50 rounded-lg border border-rose-100">{error}</div>
    </div>
  );

  if (!pyq) return null;

  return (
    <div className="relative min-h-screen py-10 px-4 sm:px-6">
      <BackgroundGrid variant="grid" />
      <div className="max-w-3xl mx-auto">
        <Link 
          href="/pyqs" 
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-950 transition-colors mb-6"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" />
          <span>Back to PYQ Archive</span>
        </Link>

        {/* Hero Section */}
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden mb-8">
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-500 font-medium">
                QUESTION PAPER ARCHIVE
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-950 tracking-tight mb-3">
              {pyq.name || pyq.title}
            </h1>
            
            {pyq.description && (
              <p className="text-sm text-zinc-600 mb-6 leading-relaxed">
                {pyq.description}
              </p>
            )}
            
            <div className="flex flex-wrap gap-2 mb-8">
              {(pyq.examYear || pyq.year) && (
                <span className="mono-chip font-medium">
                  EXAM YEAR: {pyq.examYear || pyq.year}
                </span>
              )}
              {pyq.subject && (
                <span className="mono-chip">
                  Subject: {pyq.subject}
                </span>
              )}
              {pyq.semester && (
                <span className="mono-chip">
                  Sem: {pyq.semester}
                </span>
              )}
              {pyq.university && (
                <span className="mono-chip">
                  {pyq.university}
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-zinc-100">
              <a 
                href={user ? (pyq.fileUrl || pyq.downloadUrl) : '#'} 
                download={user ? true : undefined}
                target={user ? "_blank" : undefined}
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (!user) {
                    e.preventDefault();
                    setShowDownloadSignIn(true);
                  }
                }}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-white font-medium text-xs bg-zinc-950 hover:bg-zinc-800 transition-colors shadow-sm w-full sm:w-auto cursor-pointer"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                <span>Download Paper</span>
              </a>
              <button 
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium text-xs bg-white text-zinc-800 border border-zinc-200 hover:bg-zinc-50 transition-colors w-full sm:w-auto cursor-pointer"
              >
                <DocumentTextIcon className="w-4 h-4 text-zinc-500" />
                <span>Preview Document</span>
              </button>
              <BookmarkButton materialId={id} variant="pill" size="md" className="w-full sm:w-auto px-5 py-2.5" />
            </div>
          </div>
        </div>

        {/* Interactive In-App Document Viewer */}
        <DocumentViewer
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title={pyq.name || pyq.title}
          fileUrl={pyq.fileUrl || pyq.downloadUrl}
          materialId={id}
          metadata={{
            subject: pyq.subject,
            semester: pyq.semester,
            university: pyq.university,
            year: pyq.examYear || pyq.year,
          }}
        />

        {/* Sign In Required Modal for Guests */}
        <SignInModal
          isOpen={showDownloadSignIn}
          onClose={() => setShowDownloadSignIn(false)}
          title={pyq.name || pyq.title}
          redirectUrl={`/pyqs/${id}`}
        />

        {/* Comments Section */}
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Discussion</h2>
          
          <div className="space-y-2 mb-10">
            {comments.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-slate-500">No comments yet. Start the discussion!</p>
              </div>
            ) : (
              renderComments()
            )}
          </div>

          {user ? (
            <form onSubmit={e => handleAddComment(e, null)} className="flex flex-col gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <h3 className="font-semibold text-slate-900">Leave a comment</h3>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-4 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-y min-h-[100px]"
                placeholder="Share your thoughts or ask a question..."
                disabled={commentLoading}
                required
              />
              <button
                type="submit"
                className="self-end px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all disabled:opacity-50"
                disabled={commentLoading || !commentText.trim()}
              >
                {commentLoading ? "Posting..." : "Post Comment"}
              </button>
            </form>
          ) : (
            <div className="bg-zinc-50 rounded-2xl p-6 text-center border border-zinc-200/80">
              <p className="text-xs text-zinc-600 mb-3">Sign in with your student account to join the academic discussion.</p>
              <button
                type="button"
                onClick={() => openAuthModal('signin', { contextMessage: 'Sign in to join the discussion on this question paper' })}
                className="inline-flex items-center justify-center px-4 py-2 bg-zinc-950 text-white text-xs font-medium rounded-xl hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer"
              >
                Sign In to Comment
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Rare UI Minimal Delete Modal for Comments */}
      <Modal
        isOpen={!!commentToDelete}
        onClose={() => setCommentToDelete(null)}
        onConfirm={confirmDeleteComment}
        variant="danger"
        title="Delete Comment"
        confirmText={commentLoading ? "Deleting..." : "Delete Comment"}
        cancelText="Cancel"
      >
        <p className="text-zinc-700">
          Are you sure you want to delete this comment?
        </p>
        <p className="mt-2 text-zinc-500">
          This comment will be permanently removed. This action cannot be reversed.
        </p>
      </Modal>
    </div>
  );
}
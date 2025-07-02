"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, collection, addDoc, query, orderBy, onSnapshot, Timestamp, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";

interface Note {
  id: string;
  title: string;
  description: string;
  subject: string;
  semester: string;
  university: string;
  year: string;
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

export default function NoteDetailPage() {
  const params = useParams()!;
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { user } = useAuth();
  const [note, setNote] = useState<Note | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [error, setError] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  // Fetch note details
  useEffect(() => {
    if (!id) return;
    const fetchNote = async () => {
      setLoading(true);
      try {
        const noteDoc = await getDoc(doc(db, "materials", id as string));
        if (noteDoc.exists()) {
          setNote({ id: noteDoc.id, ...noteDoc.data() } as Note);
        } else {
          setError("Note not found");
        }
      } catch {
        setError("Failed to fetch note");
      } finally {
        setLoading(false);
      }
    };
    fetchNote();
  }, [id]);

  // Fetch all comments (flat), then group by parentId
  useEffect(() => {
    if (!id) return;
    const q = query(
      collection(db, "materials", id as string, "comments"),
      orderBy("createdAt", "asc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(
        snapshot.docs.map((doc) => ({ id: doc.id, parentId: null, ...doc.data() } as Comment))
      );
    });
    return () => unsubscribe();
  }, [id]);

  // Add comment or reply
  const handleAddComment = async (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault();
    if (!user) return;
    const text = parentId ? replyText : commentText;
    if (!text.trim()) return;
    setCommentLoading(true);
    try {
      await addDoc(collection(db, "materials", id as string, "comments"), {
        authorId: user.uid,
        authorName: user.displayName || user.email || "Anonymous",
        text: text.trim(),
        createdAt: Timestamp.now(),
        parentId: parentId || null,
      });
      if (parentId) setReplyText("");
      else setCommentText("");
      setReplyingTo(null);
    } catch {
      alert("Failed to add comment");
    } finally {
      setCommentLoading(false);
    }
  };

  // Helper to group comments by parentId
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

  // Recursive comment renderer
  const renderComments = (parentId: string | null = null, level = 0) => {
    const pid = parentId || "root";
    return (grouped[pid] || []).map(comment => (
      <div key={comment.id} className={`border-b border-gray-100 py-2 pl-1 flex items-start gap-2 ${level > 0 ? 'ml-6' : ''}`}>
        {/* Avatar */}
        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
          {comment.authorName?.[0]?.toUpperCase() || "U"}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-blue-700 text-xs">{comment.authorName}</span>
            <span className="text-gray-400 text-xs">{comment.createdAt?.toDate?.().toLocaleString?.() || ""}</span>
          </div>
          <div className="text-sm text-gray-800 mt-0.5">{comment.text}</div>
          <div className="flex gap-2 mt-1 text-xs text-blue-500">
            {user && (
              <button
                className="hover:underline"
                onClick={() => setReplyingTo(comment.id)}
                disabled={commentLoading}
              >Reply</button>
            )}
            {(user && (user.uid === comment.authorId || isAdmin)) && (
              <>
                <button
                  className="hover:underline"
                  onClick={() => startEdit(comment)}
                  disabled={commentLoading}
                >Edit</button>
                <button
                  className="text-red-500 hover:underline"
                  onClick={() => handleDeleteComment(comment.id)}
                  disabled={commentLoading}
                >Delete</button>
              </>
            )}
          </div>
          {replyingTo === comment.id && (
            <form onSubmit={e => handleAddComment(e, comment.id)} className="mt-2 flex flex-col gap-2">
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                className="border rounded p-2 min-h-[32px] text-xs"
                placeholder="Write a reply..."
                disabled={commentLoading}
                required
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  disabled={commentLoading || !replyText.trim()}
                >Reply</button>
                <button
                  type="button"
                  className="px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  onClick={() => { setReplyingTo(null); setReplyText(""); }}
                  disabled={commentLoading}
                >Cancel</button>
              </div>
            </form>
          )}
          {editingCommentId === comment.id ? (
            <form onSubmit={handleEditComment} className="flex flex-col gap-2 mt-2">
              <textarea
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                className="border rounded p-2 min-h-[40px] text-xs"
                disabled={commentLoading}
                required
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  disabled={commentLoading || !editingText.trim()}
                >Save</button>
                <button
                  type="button"
                  className="px-3 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  onClick={() => { setEditingCommentId(null); setEditingText(""); }}
                  disabled={commentLoading}
                >Cancel</button>
              </div>
            </form>
          ) : null}
          {/* Render replies recursively */}
          {renderComments(comment.id, level + 1)}
        </div>
      </div>
    ));
  };

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
    } catch {
      alert("Failed to update comment");
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("Delete this comment?")) return;
    setCommentLoading(true);
    try {
      await deleteDoc(doc(db, "materials", id as string, "comments", commentId));
    } catch {
      alert("Failed to delete comment");
    } finally {
      setCommentLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!note) return null;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">{note.title}</h1>
      <div className="mb-4 text-gray-600">{note.description}</div>
      <div className="mb-2 text-sm text-gray-500">
        <span>Subject: {note.subject}</span> | <span>Semester: {note.semester}</span> | <span>University: {note.university}</span> | <span>Year: {note.year}</span>
      </div>

      <hr className="my-6" />

      <h2 className="text-2xl font-semibold mb-4">Comments</h2>
      <div className="space-y-4 mb-6">
        {comments.length === 0 && <div className="text-gray-500">No comments yet.</div>}
        {renderComments()}
      </div>

      {user ? (
        <form onSubmit={e => handleAddComment(e, null)} className="flex flex-col gap-2">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="border rounded p-2 min-h-[60px]"
            placeholder="Write a comment..."
            disabled={commentLoading}
            required
          />
          <button
            type="submit"
            className="self-end px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={commentLoading || !commentText.trim()}
          >
            {commentLoading ? "Posting..." : "Post Comment"}
          </button>
        </form>
      ) : (
        <div className="text-gray-500">Sign in to write a comment.</div>
      )}
    </div>
  );
} 
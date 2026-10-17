'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Zap, FileQuestion, Lock, CheckCircle2, Mail } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthModal } from '@/context/AuthModalContext';
import { useToast } from '@/components/ui/Toast';
import { Spinner } from '@/components/ui/Spinner';

interface RequestPaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  source?: 'notes' | 'pyqs';
}

export function RequestPaperModal({
  isOpen,
  onClose,
  initialQuery = '',
  source = 'pyqs',
}: RequestPaperModalProps) {
  const { user, userData } = useAuth();
  const { openAuthModal } = useAuthModal();
  const { toast } = useToast();
  const [description, setDescription] = useState(initialQuery);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isNotes = source === 'notes';
  const modalTitle = isNotes ? 'Request Study Notes' : 'Request Question Paper / PYQ';
  const modalSubtitle = isNotes
    ? 'Tell us which subject or unit notes you need and our team will upload them'
    : 'Tell us what paper you need and we will find it for you';

  const placeholderText = isNotes
    ? 'e.g. SPPU SE 2024 Pattern DBMS Unit 3 & 4 Handwritten Notes or EnTC Signals Formula Sheet'
    : 'e.g. SPPU FE 2024 Pattern FPL In-Sem Dec 2023 Paper or EnTC 2nd Year Signals & Systems May 2024 ESE';

  useEffect(() => {
    if (isOpen) {
      setDescription(initialQuery.trim());
      // Slight delay for focus after modal animates in
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !submitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, submitting, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || submitting) return;

    if (!user || !user.email) {
      toast.error('Please sign in to submit a request');
      openAuthModal('signin', {
        contextMessage: isNotes
          ? 'Sign in to request study materials & get notified when uploaded'
          : 'Sign in to request question papers & get notified when uploaded',
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim(),
          source,
          userId: user.uid,
          userEmail: user.email,
          userName: userData?.name || user.displayName || 'Student',
          isFoundingMember: Boolean(userData?.isFoundingMember),
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to submit request');
      }

      if (userData?.isFoundingMember) {
        toast.success(
          `Priority request received! As a Founding Member, we'll notify you at ${user.email} within 24 hours.`
        );
      } else {
        toast.success(`Request received! We'll notify you at ${user.email} as soon as it's uploaded.`);
      }

      setDescription('');
      onClose();
    } catch (err) {
      console.error('Request submission error:', err);
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm -z-10"
            onClick={() => !submitting && onClose()}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', damping: 26, stiffness: 360 }}
            className="relative bg-white rounded-2xl shadow-2xl border border-zinc-200/90 w-full max-w-lg overflow-hidden flex flex-col outline-none"
            role="dialog"
            aria-modal="true"
            aria-labelledby="request-paper-title"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200/60 flex items-center justify-center text-zinc-700 shrink-0">
                  <FileQuestion className="w-4 h-4" />
                </div>
                <div>
                  <h2 id="request-paper-title" className="text-sm font-semibold text-zinc-950 tracking-tight">
                    {modalTitle}
                  </h2>
                  <p className="text-xs text-zinc-500">
                    {modalSubtitle}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors rounded-lg p-1.5 focus:outline-none disabled:opacity-50 cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content: Auth Required Gate if not logged in */}
            {!user ? (
              <div className="px-6 py-7 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 border border-zinc-200/80 flex items-center justify-center text-zinc-800 mx-auto shadow-2xs">
                  <Lock className="w-6 h-6 text-zinc-700" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-sm font-semibold text-zinc-950">
                    Sign in to request study materials
                  </h3>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                    Previewing notes on LastBench is free for everyone. To submit a request and get notified via email when uploaded, please sign in with your student account.
                  </p>
                </div>

                <div className="pt-2 flex flex-col gap-2 max-w-xs mx-auto">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      openAuthModal('signin', {
                        contextMessage: isNotes
                          ? 'Sign in to request study materials & get notified when uploaded'
                          : 'Sign in to request question papers & get notified when uploaded',
                      });
                    }}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-zinc-950 hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer"
                  >
                    Sign In with Google / Email
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-2 px-4 rounded-xl text-xs font-medium text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleSubmit}>
                <div className="px-6 py-5 space-y-3.5">
                  {/* Verified Student Badge */}
                  <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200/80 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-zinc-950 text-white font-semibold flex items-center justify-center text-[11px] shrink-0">
                        {(userData?.name || user.displayName || user.email || 'S')[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-zinc-900 truncate text-xs leading-tight">
                          {userData?.name || user.displayName || 'Student'}
                        </p>
                        <p className="text-[11px] text-zinc-500 truncate leading-tight">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-full shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Verified Email</span>
                    </span>
                  </div>

                  {userData?.isFoundingMember && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200/60 text-amber-800 text-xs font-medium">
                      <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Founders Club: Your request gets 24-hr priority turnaround</span>
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="paper-description"
                      className="block text-xs font-medium text-zinc-700 mb-1.5"
                    >
                      Describe what you need in detail:
                    </label>
                    <textarea
                      id="paper-description"
                      ref={inputRef}
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={placeholderText}
                      disabled={submitting}
                      className="w-full text-sm text-zinc-900 placeholder:text-zinc-400 bg-white border border-zinc-200 rounded-xl px-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:border-transparent transition-all resize-none leading-relaxed"
                    />
                    <div className="mt-2 space-y-1">
                      <p className="text-[11px] text-zinc-500 flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-zinc-400 shrink-0" />
                        <span>We will notify you at <strong className="font-semibold text-zinc-800">{user.email}</strong> as soon as this is uploaded.</span>
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        Tip: Mention university, subject name, branch, and semester or year.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-3.5 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={submitting}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 transition-colors focus:outline-none disabled:opacity-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!description.trim() || submitting}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-white bg-zinc-950 hover:bg-zinc-800 transition-colors shadow-sm focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Spinner size="sm" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Request</span>
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

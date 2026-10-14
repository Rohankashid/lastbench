'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Zap, FileQuestion } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
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
  const { toast } = useToast();
  const [description, setDescription] = useState(initialQuery);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

    setSubmitting(true);
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim(),
          source,
          userId: user?.uid || null,
          userEmail: user?.email || null,
          userName: userData?.name || user?.displayName || null,
          isFoundingMember: Boolean(userData?.isFoundingMember),
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to submit request');
      }

      if (userData?.isFoundingMember) {
        toast.success(
          "Priority request received! As a Founding Member, we'll prioritize finding and uploading this paper within 24 hours."
        );
      } else {
        toast.success("Request received! We'll search our archives and upload this paper soon.");
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
                    Request Question Paper / PYQ
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Tell us what paper you need and we will find it for you
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors rounded-lg p-1.5 focus:outline-none disabled:opacity-50"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-5 space-y-3">
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
                    placeholder="e.g. SPPU FE 2024 Pattern FPL In-Sem Dec 2023 Paper or EnTC 2nd Year Signals & Systems May 2024 ESE"
                    disabled={submitting}
                    className="w-full text-sm text-zinc-900 placeholder:text-zinc-400 bg-white border border-zinc-200 rounded-xl px-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:border-transparent transition-all resize-none leading-relaxed"
                  />
                  <p className="mt-1.5 text-[11px] text-zinc-400">
                    Tip: Mention the university, subject name, branch, and exam session or year (e.g., In-Sem Dec 2023).
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-3.5 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 transition-colors focus:outline-none disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!description.trim() || submitting}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-white bg-zinc-950 hover:bg-zinc-800 transition-colors shadow-sm focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

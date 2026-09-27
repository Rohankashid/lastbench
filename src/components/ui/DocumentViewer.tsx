'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Download } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { SignInModal } from '@/components/ui/SignInModal';
import { BookmarkButton } from '@/components/ui/BookmarkButton';

interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fileUrl: string;
  materialId?: string;
  metadata?: {
    subject?: string;
    semester?: string;
    university?: string;
    year?: string;
  };
}

export function DocumentViewer({
  isOpen,
  onClose,
  title,
  fileUrl,
  materialId,
  metadata,
}: DocumentViewerProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [showSignInModal, setShowSignInModal] = useState(false);

  // Reset loading state whenever a new document is opened
  useEffect(() => {
    if (isOpen && fileUrl) {
      setIsLoading(true);
    }
  }, [isOpen, fileUrl]);

  // Lock scroll without horizontal layout shift (compensate scrollbar width)
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const previewUrl = fileUrl ? `/api/preview?url=${encodeURIComponent(fileUrl)}` : '';

  return (
    <>
      <AnimatePresence>
        {isOpen && fileUrl && (
          <div key="document-viewer-modal" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm -z-10"
              onClick={onClose}
            />

            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 6 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="w-full max-w-5xl h-[86vh] bg-white rounded-2xl shadow-2xl border border-zinc-200 flex flex-col overflow-hidden will-change-transform"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 bg-white shrink-0">
                <div className="flex items-center gap-3 overflow-hidden mr-4">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <div className="truncate">
                    <h3 className="text-sm font-semibold text-zinc-950 truncate">
                      {title || 'Document Preview'}
                    </h3>
                    {metadata && (
                      <div className="flex items-center gap-2 mt-0.5">
                        {metadata.subject && (
                          <span className="font-mono text-[10px] uppercase text-zinc-500">
                            {metadata.subject}
                          </span>
                        )}
                        {metadata.semester && (
                          <span className="font-mono text-[10px] text-zinc-400">
                            &bull; Sem {metadata.semester}
                          </span>
                        )}
                        {metadata.university && (
                          <span className="font-mono text-[10px] text-zinc-400">
                            &bull; {metadata.university}
                          </span>
                        )}
                        {metadata.year && (
                          <span className="font-mono text-[10px] text-zinc-400">
                            &bull; {metadata.year}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 text-xs font-medium transition-colors"
                    title="Open in new window"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="hidden sm:inline">Open in Tab</span>
                  </a>

                  <a
                    href={user ? fileUrl : '#'}
                    download={user ? true : undefined}
                    onClick={(e) => {
                      if (!user) {
                        e.preventDefault();
                        setShowSignInModal(true);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-950 text-white hover:bg-zinc-800 text-xs font-medium transition-colors shadow-sm cursor-pointer"
                    title="Download File"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Download</span>
                  </a>

                  {materialId && (
                    <BookmarkButton materialId={materialId} />
                  )}

                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors ml-1"
                    aria-label="Close Preview"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Viewer Body */}
              <div className="flex-1 relative bg-zinc-50 w-full h-full overflow-hidden">
                <iframe
                  key={fileUrl}
                  src={previewUrl}
                  onLoad={() => {
                    // Small buffer so the document canvas initializes before hiding the loader
                    setTimeout(() => setIsLoading(false), 150);
                  }}
                  className="w-full h-full border-0 bg-white"
                  title={title || 'Document Preview'}
                />

                {/* Smooth Fading Loading Overlay */}
                <div
                  className={`absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/95 backdrop-blur-xs z-10 transition-opacity duration-300 ${
                    isLoading ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full border-2 border-zinc-200 border-t-zinc-900 animate-spin" />
                  <div className="text-center">
                    <p className="text-xs font-semibold text-zinc-900">Opening preview...</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Preparing document for viewing</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sign In Required Modal for Guests */}
      <SignInModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        title={title}
      />
    </>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Download, Share2, Check, Flag } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { useAuth } from '@/hooks/useAuth';
import { SignInModal } from '@/components/ui/SignInModal';
import { BookmarkButton } from '@/components/ui/BookmarkButton';
import Link from 'next/link';

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
  const [isCopied, setIsCopied] = useState(false);

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

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  const proxyUrl = fileUrl ? `/api/preview?url=${encodeURIComponent(fileUrl)}` : '';
  const previewUrl = isMobile 
    ? `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true` 
    : proxyUrl;

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?v=${materialId}` : '';
  const waMessage = `📚 Check out this ${metadata?.subject || title} notes/PYQ — free preview, no login needed! ${shareUrl}`;

  return (
    <>
      <AnimatePresence>
        {isOpen && fileUrl && (
          <div key="document-viewer-modal" className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6 overflow-hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm -z-10 hidden sm:block"
              onClick={onClose}
            />

            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 6 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="w-full h-[100dvh] sm:h-[90vh] max-w-5xl bg-white sm:rounded-2xl shadow-2xl border-0 sm:border border-zinc-200 flex flex-col overflow-hidden will-change-transform"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3.5 border-b border-zinc-200 bg-white shrink-0">
                <div className="flex items-center min-w-0 pr-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 hidden sm:block mr-3" />
                  <div className="truncate">
                    <h3 className="text-sm font-semibold text-zinc-950 truncate">
                      {title || 'Document Preview'}
                    </h3>
                    {metadata && (
                      <div className="flex flex-wrap items-center gap-x-2 mt-0.5">
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
                          <span className="font-mono text-[10px] text-zinc-400 hidden sm:inline">
                            &bull; {metadata.university}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Desktop Actions */}
                  <div className="hidden sm:flex items-center gap-2">
                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(waMessage)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 text-xs font-medium transition-colors cursor-pointer"
                      title="Share to WhatsApp"
                    >
                      <FaWhatsapp className="w-4 h-4" />
                      <span>WhatsApp</span>
                    </a>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(shareUrl);
                        setIsCopied(true);
                        setTimeout(() => setIsCopied(false), 2000);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 text-xs font-medium transition-colors cursor-pointer"
                      title="Copy Share Link"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5 text-zinc-500" />}
                      <span>{isCopied ? 'Copied!' : 'Share'}</span>
                    </button>

                    <a
                      href={proxyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 text-xs font-medium transition-colors"
                      title="Open in new window"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Open in Tab</span>
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
                      <span>Download</span>
                    </a>

                    {materialId && (
                      <BookmarkButton materialId={materialId} variant="pill" className="shrink-0 border-zinc-200 shadow-none hover:shadow-none bg-white" />
                    )}
                    
                    {materialId && (
                       <Link href={`/takedown?id=${materialId}`} className="font-mono text-[10px] text-red-500 hover:underline inline-flex items-center gap-1 ml-1 px-2">
                         <Flag className="w-3 h-3" /> Report
                       </Link>
                    )}

                    <button
                      onClick={onClose}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors ml-1"
                      aria-label="Close Preview"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Mobile Actions (essential only in header) */}
                  <div className="flex sm:hidden items-center gap-1">
                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(waMessage)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors"
                    >
                      <FaWhatsapp className="w-4 h-4" />
                    </a>
                    <button
                      onClick={onClose}
                      className="p-2 rounded-lg text-zinc-400 hover:text-zinc-700 bg-zinc-100 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Mobile Action Bar (Scrollable) */}
              <div className="flex sm:hidden items-center overflow-x-auto scrollbar-none gap-2 px-3 py-2 border-b border-zinc-200 bg-zinc-50 shrink-0">
                  <a
                    href={user ? fileUrl : '#'}
                    download={user ? true : undefined}
                    onClick={(e) => {
                      if (!user) {
                        e.preventDefault();
                        setShowSignInModal(true);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-950 text-white hover:bg-zinc-800 text-xs font-medium transition-colors shadow-sm whitespace-nowrap shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(shareUrl);
                      setIsCopied(true);
                      setTimeout(() => setIsCopied(false), 2000);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5 text-zinc-500" />}
                    <span>{isCopied ? 'Copied!' : 'Copy Link'}</span>
                  </button>

                  {materialId && (
                    <BookmarkButton materialId={materialId} variant="pill" className="shrink-0 border-zinc-200 shadow-none hover:shadow-none" />
                  )}

                  <a
                    href={proxyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Open in Tab</span>
                  </a>

                  {materialId && (
                     <Link href={`/takedown?id=${materialId}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-red-500 hover:bg-red-50 text-xs font-medium transition-colors whitespace-nowrap shrink-0">
                       <Flag className="w-3.5 h-3.5" /> <span>Report</span>
                     </Link>
                  )}
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

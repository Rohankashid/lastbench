'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Download, Share2, Check, Flag, Lock } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { useAuth } from '@/hooks/useAuth';
import { useAuthModal } from '@/context/AuthModalContext';
import { SignInModal } from '@/components/ui/SignInModal';
import { BookmarkButton } from '@/components/ui/BookmarkButton';
import { HelpfulButton } from '@/components/ui/HelpfulButton';
import Link from 'next/link';
import { Spinner } from '@/components/ui/Spinner';
import { trackDocumentView, trackDocumentDownload } from '@/lib/analytics';

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
    category?: string;
  };
  requireAuth?: boolean;
}

export function DocumentViewer({
  isOpen,
  onClose,
  title,
  fileUrl,
  materialId,
  metadata,
  requireAuth = false,
}: DocumentViewerProps) {
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [isLoading, setIsLoading] = useState(true);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const lastTrackedDocIdRef = React.useRef<string | null>(null);

  const isLocked = Boolean(requireAuth && !user);

  // Reset loading state and track document view whenever a new document is opened
  useEffect(() => {
    if (isOpen && fileUrl) {
      setIsLoading(true);
      const docKey = materialId || fileUrl;
      if (lastTrackedDocIdRef.current !== docKey) {
        lastTrackedDocIdRef.current = docKey;
        trackDocumentView({
          id: docKey,
          title,
          subject: metadata?.subject,
          semester: metadata?.semester,
          university: metadata?.university,
          year: metadata?.year,
        });
      }
    } else if (!isOpen) {
      lastTrackedDocIdRef.current = null;
    }
  }, [isOpen, fileUrl, materialId, title, metadata?.subject, metadata?.semester, metadata?.university, metadata?.year]);

  const handleDownloadClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      setShowSignInModal(true);
      return;
    }
    trackDocumentDownload({
      id: materialId || fileUrl,
      title,
      subject: metadata?.subject,
      semester: metadata?.semester,
      university: metadata?.university,
      year: metadata?.year,
    });
  };

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
  const waMessage = `📚 Check out this ${metadata?.subject || title} notes/PYQ - free preview, no login needed! ${shareUrl}`;

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
                      href={user ? proxyUrl : '#'}
                      target={user ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 text-xs font-medium transition-colors cursor-pointer"
                      title="Open in new window"
                      onClick={(e) => {
                        if (!user) {
                          e.preventDefault();
                          setShowSignInModal(true);
                        }
                      }}
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Open in Tab</span>
                    </a>

                    <a
                      href={user ? `/api/download?url=${encodeURIComponent(fileUrl)}&filename=${encodeURIComponent((title || 'document') + '.pdf')}` : '#'}
                      download={user ? true : undefined}
                      onClick={handleDownloadClick}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-950 text-white hover:bg-zinc-800 text-xs font-medium transition-colors shadow-sm cursor-pointer"
                      title="Download File"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>

                    {materialId && (
                      <HelpfulButton materialId={materialId} />
                    )}

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
                    href={user ? `/api/download?url=${encodeURIComponent(fileUrl)}&filename=${encodeURIComponent((title || 'document') + '.pdf')}` : '#'}
                    download={user ? true : undefined}
                    onClick={handleDownloadClick}
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
                    <HelpfulButton materialId={materialId} />
                  )}

                  {materialId && (
                    <BookmarkButton materialId={materialId} variant="pill" className="shrink-0 border-zinc-200 shadow-none hover:shadow-none" />
                  )}

                  <a
                    href={user ? proxyUrl : '#'}
                    target={user ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      if (!user) {
                        e.preventDefault();
                        setShowSignInModal(true);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
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
              <div className="flex-1 relative bg-zinc-50 w-full h-full overflow-hidden flex items-center justify-center">
                {isLocked ? (
                  <div className="max-w-md w-full mx-4 bg-white border border-zinc-200/90 rounded-2xl p-6 sm:p-8 text-center shadow-xl relative z-20">
                    <div className="w-13 h-13 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center mx-auto mb-4 shadow-2xs">
                      <Lock className="w-6 h-6" />
                    </div>

                    <span className="inline-block text-[10px] font-mono uppercase tracking-wider text-amber-800 bg-amber-100/60 px-2.5 py-0.5 rounded-full border border-amber-200 font-semibold mb-3">
                      Solved PYQ Archive
                    </span>

                    <h3 className="text-lg sm:text-xl font-bold text-zinc-950 tracking-tight mb-2">
                      Sign in to View Solved Paper
                    </h3>

                    <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed mb-6">
                      Unlock university past question papers, verified solution schemes, and exam marking patterns completely free.
                    </p>

                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => openAuthModal('signin', { contextMessage: `Sign in with Google to view "${title}"` })}
                        className="w-full inline-flex items-center justify-center gap-2.5 px-4 py-3 bg-zinc-950 hover:bg-zinc-800 text-white text-xs sm:text-sm font-medium rounded-xl transition-all shadow-sm hover:shadow cursor-pointer"
                      >
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                        <span>Continue with Google</span>
                      </button>

                      <div className="flex items-center justify-center gap-3 text-[11px] text-zinc-400 font-medium pt-3 border-t border-zinc-100">
                        <span>✓ 100% Free Access</span>
                        <span>•</span>
                        <span>✓ Instant 1-Tap Unlock</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
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
                      <Spinner size="md" />
                      <div className="text-center">
                        <p className="text-xs font-semibold text-zinc-900">Opening preview...</p>
                        <p className="text-[11px] text-zinc-500 mt-0.5">Preparing document for viewing</p>
                      </div>
                    </div>
                  </>
                )}
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

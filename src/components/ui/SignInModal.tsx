'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useAuthModal } from '@/context/AuthModalContext';
import { ArrowDownTrayIcon, XMarkIcon, CheckIcon, UserPlusIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

export interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  redirectUrl?: string;
}

export const SignInModal: React.FC<SignInModalProps> = ({
  isOpen,
  onClose,
  title,
  redirectUrl,
}) => {
  const pathname = usePathname();
  const { openAuthModal } = useAuthModal();

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
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const targetRedirect = redirectUrl || (typeof window !== 'undefined' ? pathname : '/');

  const handleSignIn = () => {
    onClose();
    openAuthModal('signin', {
      redirectUrl: targetRedirect,
      contextMessage: title ? `Sign in to download "${title}"` : 'Sign in to download offline study material',
    });
  };

  const handleSignUp = () => {
    onClose();
    openAuthModal('signup', {
      redirectUrl: targetRedirect,
      contextMessage: title ? `Create an account to download "${title}"` : 'Create an account to download offline study material',
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="signin-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          {/* Modal Container */}
          <motion.div
            key="signin-modal-card"
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden p-6 sm:p-7 relative text-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Icon + Close Button in dedicated row */}
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-2xl bg-zinc-100 border border-zinc-200/80 flex items-center justify-center text-zinc-900 shadow-2xs">
                <ArrowDownTrayIcon className="w-5 h-5" />
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Title & Subtitle */}
            <h3 className="text-lg font-semibold text-zinc-950 tracking-tight">
              Sign In to Download
            </h3>
            <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
              Reading and previewing study materials is completely free for everyone. To download offline copies, please sign in with your student account.
            </p>

            {/* Document Mention (if provided) */}
            {title && (
              <div className="mt-3.5 px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200/70 text-xs text-zinc-700 font-medium truncate">
                <span className="text-zinc-400 font-normal">File: </span>
                {title}
              </div>
            )}

            {/* Benefits List */}
            <div className="mt-4 pt-4 border-t border-zinc-100 space-y-2 text-xs text-zinc-600">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckIcon className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span>Free instant PDF downloads for all subjects</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckIcon className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span>Verified Maharashtra university question papers</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckIcon className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span>100% free, community-powered engineering archive</span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 space-y-2.5">
              <button
                type="button"
                onClick={handleSignIn}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-zinc-950 hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                <span>Sign In to Continue</span>
              </button>

              <button
                type="button"
                onClick={handleSignUp}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 transition-colors cursor-pointer"
              >
                <UserPlusIcon className="w-4 h-4 text-zinc-500" />
                <span>Create Free Student Account</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full text-center text-xs text-zinc-400 hover:text-zinc-600 py-1 transition-colors font-medium cursor-pointer"
              >
                Continue reading for free
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

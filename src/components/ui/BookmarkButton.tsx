'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark } from 'lucide-react';
import { useBookmarks } from '@/context/BookmarkContext';
import { useAuth } from '@/hooks/useAuth';
import { useAuthModal } from '@/context/AuthModalContext';

interface BookmarkButtonProps {
  materialId?: string;
  /** 'icon' = compact icon-only button, 'pill' = icon + label */
  variant?: 'icon' | 'pill';
  /** Additional className override */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md';
}

export function BookmarkButton({
  materialId,
  variant = 'icon',
  className = '',
  size = 'sm',
}: BookmarkButtonProps) {
  const { user } = useAuth();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { openAuthModal } = useAuthModal();

  const bookmarked = isBookmarked(materialId);

  if (!materialId) return null;

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!user) {
      openAuthModal('signin', {
        contextMessage: 'Sign in to bookmark study materials for quick access before exams',
      });
      return;
    }

    await toggleBookmark(materialId);
  };

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-[18px] h-[18px]';
  const buttonPadding = size === 'sm' ? 'p-1.5' : 'p-2';

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${
          bookmarked
            ? 'bg-zinc-950 text-white hover:bg-zinc-800'
            : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300'
        } ${className}`}
        title={bookmarked ? 'Remove bookmark' : 'Bookmark this material'}
        aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={bookmarked ? 'filled' : 'outline'}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          >
            <Bookmark
              className={`w-3.5 h-3.5 ${bookmarked ? 'fill-white text-white' : 'text-zinc-500'}`}
            />
          </motion.div>
        </AnimatePresence>
        <span>{bookmarked ? 'Saved' : 'Save'}</span>
      </button>
    );
  }

  // Default: compact icon button
  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${buttonPadding} rounded-lg transition-all duration-200 cursor-pointer group ${
        bookmarked
          ? 'text-zinc-950 bg-zinc-100 hover:bg-zinc-200'
          : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100'
      } ${className}`}
      title={bookmarked ? 'Remove bookmark' : 'Bookmark this material'}
      aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={bookmarked ? 'filled' : 'outline'}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        >
          <Bookmark
            className={`${iconSize} transition-colors ${
              bookmarked ? 'fill-zinc-950 text-zinc-950' : 'group-hover:text-zinc-700'
            }`}
          />
        </motion.div>
      </AnimatePresence>
    </button>
  );
}

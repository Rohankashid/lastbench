
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Bookmark } from 'lucide-react';
import { useBookmarks } from '@/context/BookmarkContext';
import { useAuth } from '@/hooks/useAuth';
import { useAuthModal } from '@/context/AuthModalContext';

interface BookmarkButtonProps {
  materialId?: string;
  variant?: 'icon' | 'pill';
  className?: string;
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
      <motion.button
        type="button"
        onClick={handleClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.92 }}
        className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
          bookmarked
            ? 'bg-zinc-950 text-white hover:bg-zinc-800'
            : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300'
        } ${className}`}
        title={bookmarked ? 'Remove bookmark' : 'Bookmark this material'}
      >
        <motion.div
          animate={ bookmarked ? { scale: [1, 1.3, 1] } : { scale: 1 } }
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <Bookmark
            className={`w-3.5 h-3.5 ${bookmarked ? 'fill-white text-white' : 'text-zinc-500'}`}
          />
        </motion.div>
        <span>{bookmarked ? 'Saved' : 'Save'}</span>
      </motion.button>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.85 }}
      className={`${buttonPadding} rounded-lg transition-colors cursor-pointer group relative overflow-hidden ${
        bookmarked
          ? 'text-zinc-950 bg-zinc-100 hover:bg-zinc-200'
          : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100'
      } ${className}`}
      title={bookmarked ? 'Remove bookmark' : 'Bookmark this material'}
    >
      <motion.div
        animate={ bookmarked ? { scale: [1, 1.4, 1] } : { scale: 1 } }
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <Bookmark
          className={`${iconSize} transition-colors ${
            bookmarked ? 'fill-zinc-950 text-zinc-950' : 'group-hover:text-zinc-700'
          }`}
        />
      </motion.div>
      
      {/* Sparkle burst effect on bookmark true */}
      {bookmarked && (
        <motion.div 
           initial={{ opacity: 1, scale: 0 }}
           animate={{ opacity: 0, scale: 2 }}
           transition={{ duration: 0.4, ease: "easeOut" }}
           className="absolute inset-0 bg-zinc-950 rounded-full mix-blend-overlay"
        />
      )}
    </motion.button>
  );
}

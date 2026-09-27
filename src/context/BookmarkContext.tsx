'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';

interface BookmarkContextType {
  bookmarks: string[];
  isBookmarked: (materialId?: string) => boolean;
  toggleBookmark: (materialId?: string) => Promise<void>;
  loading: boolean;
}

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined);

export function BookmarkProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch bookmarks when user changes
  useEffect(() => {
    if (!user) {
      setBookmarks([]);
      setLoading(false);
      return;
    }

    const fetchBookmarks = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setBookmarks(data.bookmarks || []);
        }
      } catch (err) {
        console.error('Failed to fetch bookmarks:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarks();
  }, [user]);

  const isBookmarked = useCallback(
    (materialId?: string) => (materialId ? bookmarks.includes(materialId) : false),
    [bookmarks]
  );

  const toggleBookmark = useCallback(
    async (materialId?: string) => {
      if (!user || !materialId) return;

      const userRef = doc(db, 'users', user.uid);
      const alreadyBookmarked = bookmarks.includes(materialId);

      // Optimistic update
      if (alreadyBookmarked) {
        setBookmarks((prev) => prev.filter((id) => id !== materialId));
      } else {
        setBookmarks((prev) => [...prev, materialId]);
      }

      try {
        if (alreadyBookmarked) {
          await updateDoc(userRef, { bookmarks: arrayRemove(materialId) });
        } else {
          await updateDoc(userRef, { bookmarks: arrayUnion(materialId) });
        }
      } catch (err) {
        console.error('Failed to toggle bookmark:', err);
        // Revert optimistic update on error
        if (alreadyBookmarked) {
          setBookmarks((prev) => [...prev, materialId]);
        } else {
          setBookmarks((prev) => prev.filter((id) => id !== materialId));
        }
      }
    },
    [user, bookmarks]
  );

  return (
    <BookmarkContext.Provider value={{ bookmarks, isBookmarked, toggleBookmark, loading }}>
      {children}
    </BookmarkContext.Provider>
  );
}

export function useBookmarks() {
  const context = useContext(BookmarkContext);
  if (!context) {
    throw new Error('useBookmarks must be used within a BookmarkProvider');
  }
  return context;
}

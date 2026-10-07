'use client';

import React, { useState, useEffect } from 'react';
import { ThumbsUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthModal } from '@/context/AuthModalContext';
import { doc, onSnapshot, updateDoc, increment, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function HelpfulButton({ materialId }: { materialId: string }) {
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [count, setCount] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    if (!materialId) return;
    
    // We listen to the material document for real-time count
    const materialRef = doc(db, 'materials', materialId);
    const unsubscribe = onSnapshot(materialRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setCount(data.helpfulCount || 0);
        if (user && data.helpfulUsers?.includes(user.uid)) {
          setHasVoted(true);
        } else {
          setHasVoted(false);
        }
      }
    });

    return () => unsubscribe();
  }, [materialId, user]);

  const toggleHelpful = async () => {
    if (!user) {
      openAuthModal('signin', {
        contextMessage: 'Sign in to vote on study material.',
      });
      return;
    }

    if (isLiking) return;
    setIsLiking(true);

    try {
      const materialRef = doc(db, 'materials', materialId);
      
      // Optimistic update
      setHasVoted(!hasVoted);
      setCount(prev => hasVoted ? prev - 1 : prev + 1);

      await updateDoc(materialRef, {
        helpfulCount: hasVoted ? increment(-1) : increment(1),
        helpfulUsers: hasVoted ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
    } catch (error) {
      console.error('Failed to toggle helpful vote:', error);
      // Revert optimistic update
      setHasVoted(!hasVoted);
      setCount(prev => hasVoted ? prev - 1 : prev + 1);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <button
      onClick={toggleHelpful}
      disabled={isLiking}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
        hasVoted 
          ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100' 
          : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
      }`}
      title={hasVoted ? "Remove helpful vote" : "Mark as helpful"}
    >
      <ThumbsUp className={`w-3.5 h-3.5 ${hasVoted ? 'fill-current' : ''}`} />
      <span>{count > 0 ? count : 'Helpful'}</span>
    </button>
  );
}

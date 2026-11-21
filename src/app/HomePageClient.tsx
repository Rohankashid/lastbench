'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { GuestLanding } from '@/components/home/GuestLanding';
import { StudentDashboard } from '@/components/home/StudentDashboard';

interface HomePageClientProps {
  initialHasSession: boolean;
}

export default function HomePageClient({ initialHasSession }: HomePageClientProps) {
  const { user, loading } = useAuth();
  const [hasCachedSession, setHasCachedSession] = useState(initialHasSession);

  // Sync with localStorage as fallback if the cookie was not yet populated
  useEffect(() => {
    if (!hasCachedSession && typeof window !== 'undefined') {
      try {
        if (localStorage.getItem('lb_auth') === '1') {
          setHasCachedSession(true);
        }
      } catch {}
    }
  }, [hasCachedSession]);

  // When user is confirmed signed in, mount StudentDashboard
  if (user) {
    return (
      <Suspense fallback={
        <div className="flex flex-col justify-center items-center min-h-[60vh] gap-3">
          <h1 className="sr-only">LastBench - Engineering Notes and PYQs</h1>
          <Spinner size="sm" />
          <span className="text-xs text-zinc-400 font-mono">Loading your study desk...</span>
        </div>
      }>
        <StudentDashboard user={user} />
      </Suspense>
    );
  }

  // While Firebase Auth is initializing on client:
  if (loading) {
    // If user has an active session cookie/cache, show the study desk loading state
    // so they NEVER see a jarring flash of the GuestLanding page.
    if (hasCachedSession) {
      return (
        <div className="flex flex-col justify-center items-center min-h-[60vh] gap-3">
          <h1 className="sr-only">LastBench - Engineering Notes and PYQs</h1>
          <Spinner size="sm" />
          <span className="text-xs text-zinc-400 font-mono">Loading your study desk...</span>
        </div>
      );
    }

    // For unauthenticated visitors and search bots, render GuestLanding immediately.
    return <GuestLanding />;
  }

  // Auth resolved: unauthenticated visitor
  return <GuestLanding />;
}

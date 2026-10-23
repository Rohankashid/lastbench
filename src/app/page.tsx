'use client';

import React, { Suspense } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { GuestLanding } from '@/components/home/GuestLanding';
import { StudentDashboard } from '@/components/home/StudentDashboard';

export default function HomePage() {
  const { user } = useAuth();

  if (user) {
    return (
      <Suspense fallback={
        <div className="flex flex-col justify-center items-center min-h-[60vh]">
          <h1 className="sr-only">LastBench - Engineering Notes and PYQs</h1>
          <Spinner size="sm" />
        </div>
      }>
        <StudentDashboard user={user} />
      </Suspense>
    );
  }

  // Render GuestLanding on SSR and initial load so Google AdSense and search bots
  // receive full content, navigation links, and headings instead of an empty spinner.
  return <GuestLanding />;
}

'use client';

import React, { Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { GuestLanding } from '@/components/home/GuestLanding';
import { StudentDashboard } from '@/components/home/StudentDashboard';

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh]">
        <h1 className="sr-only">LastBench - Engineering Notes and PYQs</h1>
        <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-950 rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return (
      <Suspense fallback={
        <div className="flex flex-col justify-center items-center min-h-[60vh]">
          <h1 className="sr-only">LastBench - Engineering Notes and PYQs</h1>
          <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-950 rounded-full animate-spin" />
        </div>
      }>
        <StudentDashboard user={user} />
      </Suspense>
    );
  }

  return <GuestLanding />;
}

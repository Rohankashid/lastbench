'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const redirectParam = searchParams.get('redirect');
    const target = redirectParam
      ? `/?auth=login&redirect=${encodeURIComponent(redirectParam)}`
      : '/?auth=login';
    router.replace(target);
  }, [router, searchParams]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-200 border-t-zinc-950" />
      <p className="text-xs text-zinc-500 font-mono">Opening student sign-in...</p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-950 rounded-full animate-spin" />
        </div>
      }
    >
      <LoginRedirect />
    </Suspense>
  );
}
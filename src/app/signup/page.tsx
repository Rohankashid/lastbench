'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function SignUpRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const redirectParam = searchParams.get('redirect');
    const target = redirectParam
      ? `/?auth=signup&redirect=${encodeURIComponent(redirectParam)}`
      : '/?auth=signup';
    router.replace(target);
  }, [router, searchParams]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-200 border-t-zinc-950" />
      <p className="text-xs text-zinc-500 font-mono">Opening account registration...</p>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-950 rounded-full animate-spin" />
        </div>
      }
    >
      <SignUpRedirect />
    </Suspense>
  );
}
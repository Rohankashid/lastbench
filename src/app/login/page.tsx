'use client';

import { Spinner } from '@/components/ui/Spinner';
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
      <Spinner size="md" />
      <p className="text-xs text-zinc-500 font-mono">Opening student sign-in...</p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <Spinner size="sm" />
        </div>
      }
    >
      <LoginRedirect />
    </Suspense>
  );
}
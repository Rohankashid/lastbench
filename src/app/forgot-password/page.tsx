'use client';

import { Spinner } from '@/components/ui/Spinner';
import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function ForgotPasswordRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const redirectParam = searchParams.get('redirect');
    const target = redirectParam
      ? `/?auth=forgot-password&redirect=${encodeURIComponent(redirectParam)}`
      : '/?auth=forgot-password';
    router.replace(target);
  }, [router, searchParams]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
      <Spinner size="md" />
      <p className="text-xs text-zinc-500 font-mono">Opening password recovery...</p>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <Spinner size="sm" />
        </div>
      }
    >
      <ForgotPasswordRedirect />
    </Suspense>
  );
}
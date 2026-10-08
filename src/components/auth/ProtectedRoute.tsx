'use client';

import { Spinner } from '@/components/ui/Spinner';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      const redirectUrl = encodeURIComponent(pathname || '/');
      router.replace(`/?auth=login&redirect=${redirectUrl}`);
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Spinner size="md" />
        <p className="text-xs text-zinc-500 font-mono">Verifying student session...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
} 
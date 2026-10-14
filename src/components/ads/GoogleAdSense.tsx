'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function GoogleAdSenseController() {
  const { userData } = useAuth();

  useEffect(() => {
    if (userData?.adFree && typeof window !== 'undefined') {
      try {
        const win = window as unknown as { adsbygoogle?: Array<Record<string, unknown>> & { pauseAdRequests?: number } };
        win.adsbygoogle = win.adsbygoogle || [];
        win.adsbygoogle.pauseAdRequests = 1;
      } catch (e) {
        console.error('Failed to pause AdSense:', e);
      }
    }
  }, [userData?.adFree]);

  return null;
}

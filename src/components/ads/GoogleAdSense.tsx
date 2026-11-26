'use client';

import React, { useEffect, useState } from 'react';
import Script from 'next/script';
import { useAuth } from '@/hooks/useAuth';

export function GoogleAdSenseController() {
  const { userData } = useAuth();
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    // If user has ad-free status, never load ads
    if (userData?.adFree) return;

    const onInteract = () => {
      setShouldLoad(true);
      cleanup();
    };

    const cleanup = () => {
      window.removeEventListener('scroll', onInteract);
      window.removeEventListener('mousemove', onInteract);
      window.removeEventListener('touchstart', onInteract);
      window.removeEventListener('keydown', onInteract);
    };

    window.addEventListener('scroll', onInteract, { passive: true, once: true });
    window.addEventListener('mousemove', onInteract, { passive: true, once: true });
    window.addEventListener('touchstart', onInteract, { passive: true, once: true });
    window.addEventListener('keydown', onInteract, { passive: true, once: true });

    // Fallback: load after 4 seconds of idle time if no interaction
    let idleHandle: number | undefined;
    let timer: NodeJS.Timeout | undefined;

    if ('requestIdleCallback' in window) {
      idleHandle = (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback(
        () => setShouldLoad(true),
        { timeout: 4000 }
      );
    } else {
      timer = setTimeout(() => setShouldLoad(true), 4000);
    }

    return () => {
      cleanup();
      if (idleHandle !== undefined && 'cancelIdleCallback' in window) {
        (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleHandle);
      }
      if (timer) clearTimeout(timer);
    };
  }, [userData?.adFree]);

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

  if (!shouldLoad || userData?.adFree) return null;

  return (
    <Script
      id="adsense-init"
      strategy="lazyOnload"
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5720306425929294"
      crossOrigin="anonymous"
    />
  );
}

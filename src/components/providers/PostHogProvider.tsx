'use client';

import React, { useEffect } from 'react';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

    if (!posthogKey || typeof window === 'undefined') return;

    const initPostHog = async () => {
      try {
        const { default: posthog } = await import('posthog-js');
        if (!posthog.__loaded) {
          posthog.init(posthogKey, {
            api_host: posthogHost,
            person_profiles: 'identified_only',
            capture_pageview: true,
            capture_pageleave: true,
            autocapture: false, // Disabling DOM autocapture prevents main-thread mobile lag
            disable_session_recording: true,
          });
        }
      } catch (e) {
        console.debug('Failed to initialize PostHog:', e);
      }
    };

    if ('requestIdleCallback' in window) {
      const handle = (window as Window & { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(initPostHog);
      return () => {
        if ('cancelIdleCallback' in window) {
          (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(handle);
        }
      };
    } else {
      const timer = setTimeout(initPostHog, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  return <>{children}</>;
}

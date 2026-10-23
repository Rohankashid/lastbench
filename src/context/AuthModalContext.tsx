'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';

export type AuthMode = 'signin' | 'signup' | 'forgot-password';

interface OpenAuthModalOptions {
  contextMessage?: string;
  redirectUrl?: string;
  onSuccess?: () => void;
}

interface AuthModalContextType {
  isOpen: boolean;
  mode: AuthMode;
  contextMessage: string;
  redirectUrl: string;
  openAuthModal: (mode?: AuthMode, options?: OpenAuthModalOptions) => void;
  closeAuthModal: () => void;
  setMode: (mode: AuthMode) => void;
  onSuccessCallback?: () => void;
}

const defaultAuthModalContext: AuthModalContextType = {
  isOpen: false,
  mode: 'signin',
  contextMessage: '',
  redirectUrl: '',
  openAuthModal: () => {},
  closeAuthModal: () => {},
  setMode: () => {},
};

const AuthModalContext = createContext<AuthModalContextType>(defaultAuthModalContext);

function cleanAuthUrl() {
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    if (url.searchParams.has('auth') || url.searchParams.has('redirect')) {
      url.searchParams.delete('auth');
      url.searchParams.delete('redirect');
      const cleanPath = url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : '') + url.hash;
      window.history.replaceState({}, '', cleanPath);
    }
  }
}

function AuthModalWatcher({
  openAuthModal,
}: {
  openAuthModal: (mode?: AuthMode, options?: OpenAuthModalOptions) => void;
}) {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading || typeof window === 'undefined') return;

    // Check if ?auth=login or ?auth=signup is present in URL without triggering Next.js SSR bail-out
    const params = new URLSearchParams(window.location.search);
    const authParam = params.get('auth');
    const redirectParam = params.get('redirect') || '';

    if (!user && (authParam === 'login' || authParam === 'signin')) {
      openAuthModal('signin', { redirectUrl: redirectParam });
      cleanAuthUrl();
    } else if (!user && (authParam === 'signup' || authParam === 'register')) {
      openAuthModal('signup', { redirectUrl: redirectParam });
      cleanAuthUrl();
    } else if (!user && (authParam === 'forgot' || authParam === 'forgot-password')) {
      openAuthModal('forgot-password', { redirectUrl: redirectParam });
      cleanAuthUrl();
    } else if (user && authParam) {
      cleanAuthUrl();
    }
  }, [user, loading, openAuthModal]);

  return null;
}

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>('signin');
  const [contextMessage, setContextMessage] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('');
  const [onSuccessCallback, setOnSuccessCallback] = useState<(() => void) | undefined>(undefined);

  const openAuthModal = useCallback(
    (newMode: AuthMode = 'signin', options?: OpenAuthModalOptions) => {
      setMode(newMode);
      setContextMessage(options?.contextMessage || '');
      setRedirectUrl(options?.redirectUrl || '');
      setOnSuccessCallback(() => options?.onSuccess);
      setIsOpen(true);
    },
    []
  );

  const closeAuthModal = useCallback(() => {
    setIsOpen(false);
    setContextMessage('');
    setOnSuccessCallback(undefined);
    cleanAuthUrl();
  }, []);

  return (
    <AuthModalContext.Provider
      value={{
        isOpen,
        mode,
        contextMessage,
        redirectUrl,
        openAuthModal,
        closeAuthModal,
        setMode,
        onSuccessCallback,
      }}
    >
      <Suspense fallback={null}>
        <AuthModalWatcher openAuthModal={openAuthModal} />
      </Suspense>
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  return context || defaultAuthModalContext;
}

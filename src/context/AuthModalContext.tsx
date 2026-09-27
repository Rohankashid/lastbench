'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
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

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

function AuthModalWatcher({
  openAuthModal,
  isOpen,
}: {
  openAuthModal: (mode?: AuthMode, options?: OpenAuthModalOptions) => void;
  isOpen: boolean;
}) {
  const searchParams = useSearchParams();
  const { user } = useAuth();

  useEffect(() => {
    // Check if ?auth=login or ?auth=signup is present in URL
    const authParam = searchParams.get('auth');
    const redirectParam = searchParams.get('redirect') || '';

    if (!user && (authParam === 'login' || authParam === 'signin')) {
      openAuthModal('signin', { redirectUrl: redirectParam });
    } else if (!user && (authParam === 'signup' || authParam === 'register')) {
      openAuthModal('signup', { redirectUrl: redirectParam });
    } else if (!user && (authParam === 'forgot' || authParam === 'forgot-password')) {
      openAuthModal('forgot-password', { redirectUrl: redirectParam });
    }
  }, [searchParams, user, openAuthModal]);

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
        <AuthModalWatcher openAuthModal={openAuthModal} isOpen={isOpen} />
      </Suspense>
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return context;
}

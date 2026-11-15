'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  Bookmark, 
  Copy, 
  Sparkles, 
  X 
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'bookmark' | 'copy' | 'ai';

interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toast: {
    success: (msg: string) => void;
    error: (msg: string) => void;
    warning: (msg: string) => void;
    info: (msg: string) => void;
    bookmark: (msg: string) => void;
    copy: (msg: string) => void;
    ai: (msg: string) => void;
  };
}

const defaultToastMethods = {
  success: () => {},
  error: () => {},
  warning: () => {},
  info: () => {},
  bookmark: () => {},
  copy: () => {},
  ai: () => {},
};

const ToastContext = createContext<ToastContextType>({ toast: defaultToastMethods });

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    setToasts(prev => {
      const newToast = { id: Math.random().toString(36).substring(2, 9), type, message };
      // Keep only the most recent toast for a clean Dynamic Island pill
      return [newToast];
    });
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toastMethods = {
    success: (msg: string) => addToast('success', msg),
    error: (msg: string) => addToast('error', msg),
    warning: (msg: string) => addToast('warning', msg),
    info: (msg: string) => addToast('info', msg),
    bookmark: (msg: string) => addToast('bookmark', msg),
    copy: (msg: string) => addToast('copy', msg),
    ai: (msg: string) => addToast('ai', msg),
  };

  return (
    <ToastContext.Provider value={{ toast: toastMethods }}>
      {children}
      {/* Top-Centered Dynamic Island Viewport Container */}
      <div className="fixed top-4 inset-x-0 z-[9999] flex justify-center pointer-events-none px-4">
        <AnimatePresence mode="wait">
          {toasts.map(t => (
            <DynamicIslandItem key={t.id} toast={t} onRemove={() => removeToast(t.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

const DynamicIslandItem = ({ toast, onRemove }: { toast: ToastMessage; onRemove: () => void }) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(onRemove, 3600);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onRemove]);

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'bookmark':
        return <Bookmark className="w-4 h-4 text-amber-400 fill-amber-400/20" />;
      case 'copy':
        return <Copy className="w-4 h-4 text-sky-400" />;
      case 'ai':
        return <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-rose-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'info':
        return <Info className="w-4 h-4 text-indigo-400" />;
      case 'success':
      default:
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    }
  };

  const getGlow = (type: ToastType) => {
    switch (type) {
      case 'bookmark':
        return 'rgba(251, 191, 36, 0.2)';
      case 'copy':
        return 'rgba(56, 189, 248, 0.2)';
      case 'ai':
        return 'rgba(192, 132, 252, 0.25)';
      case 'error':
        return 'rgba(244, 63, 94, 0.25)';
      case 'warning':
        return 'rgba(245, 158, 11, 0.2)';
      case 'info':
        return 'rgba(99, 102, 241, 0.2)';
      case 'success':
      default:
        return 'rgba(52, 211, 153, 0.2)';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -24, scale: 0.85, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -16, scale: 0.9, filter: 'blur(4px)' }}
      transition={{
        type: 'spring',
        stiffness: 450,
        damping: 32,
        mass: 0.8,
      }}
      className="pointer-events-auto relative flex items-center gap-3 px-4 py-2.5 rounded-full bg-zinc-950/95 backdrop-blur-xl border border-white/15 text-white shadow-[0_12px_36px_rgba(0,0,0,0.4)] select-none max-w-[90vw] sm:max-w-md"
      style={{
        boxShadow: `0 12px 36px rgba(0,0,0,0.4), 0 0 24px ${getGlow(toast.type)}`,
      }}
    >
      {/* Morphing icon capsule */}
      <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
        {getIcon(toast.type)}
      </div>

      {/* Toast message text */}
      <div className="flex-1 pr-1 truncate">
        <p className="text-xs font-medium tracking-tight text-zinc-100 truncate">
          {toast.message}
        </p>
      </div>

      {/* Manual dismiss */}
      <button
        onClick={onRemove}
        className="w-5 h-5 rounded-full hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors shrink-0 cursor-pointer"
        aria-label="Dismiss notification"
      >
        <X className="w-3 h-3" />
      </button>
    </motion.div>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  return context || { toast: defaultToastMethods };
};

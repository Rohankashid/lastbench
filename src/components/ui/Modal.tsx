'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  children: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      modalRef.current?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const confirmBtnClass = variant === 'danger'
    ? 'bg-rose-600 hover:bg-rose-700 text-white'
    : 'bg-zinc-950 hover:bg-zinc-800 text-white';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm -z-10"
            onClick={onClose}
          />

          {/* Dialog Container */}
          <motion.div
            ref={modalRef}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', damping: 26, stiffness: 360 }}
            className="relative bg-white rounded-2xl shadow-2xl border border-zinc-200/90 w-full max-w-md overflow-hidden flex flex-col outline-none"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {variant === 'danger' && (
                  <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-200/60 flex items-center justify-center text-rose-600 shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                )}
                <h2 id="modal-title" className="text-sm font-semibold text-zinc-950 tracking-tight">
                  {title}
                </h2>
              </div>
              
              <button 
                onClick={onClose}
                className="text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors rounded-lg p-1.5 focus:outline-none"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Body */}
            <div className="px-5 py-4 text-xs text-zinc-600 leading-relaxed">
              {children}
            </div>
            
            {/* Footer */}
            <div className="px-5 py-3.5 border-t border-zinc-100 bg-zinc-50/50 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-lg text-xs font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 transition-colors focus:outline-none"
              >
                {cancelText}
              </button>
              {onConfirm && (
                <button
                  type="button"
                  onClick={onConfirm}
                  className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors shadow-sm focus:outline-none ${confirmBtnClass}`}
                >
                  {confirmText}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;

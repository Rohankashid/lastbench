'use client';

import React from 'react';

export type InkStampVariant = 'verified' | 'approved' | 'syllabus' | 'accent';

interface InkStampProps {
  text?: string;
  variant?: InkStampVariant;
  rotate?: number; // rotation in degrees, e.g. -8, 6, -12
  size?: 'sm' | 'md';
  className?: string;
}

export function InkStamp({
  text = 'VERIFIED',
  variant = 'verified',
  rotate = -6,
  size = 'sm',
  className = '',
}: InkStampProps) {
  const variantStyles: Record<InkStampVariant, { border: string; text: string; bg: string }> = {
    verified: {
      border: 'border-emerald-600',
      text: 'text-emerald-700',
      bg: 'bg-emerald-50/60',
    },
    approved: {
      border: 'border-rose-600',
      text: 'text-rose-700',
      bg: 'bg-rose-50/60',
    },
    syllabus: {
      border: 'border-indigo-600',
      text: 'text-indigo-700',
      bg: 'bg-indigo-50/60',
    },
    accent: {
      border: 'border-amber-600',
      text: 'text-amber-800',
      bg: 'bg-amber-50/60',
    },
  };

  const style = variantStyles[variant];

  const sizeStyles = size === 'sm' 
    ? 'px-2 py-0.5 text-[9px] tracking-[0.22em] border-[1.5px]'
    : 'px-3 py-1 text-[11px] tracking-[0.28em] border-2';

  return (
    <div
      style={{ transform: `rotate(${rotate}deg)` }}
      className={`inline-flex items-center justify-center font-mono font-bold uppercase rounded-sm border-dashed select-none pointer-events-none transition-transform ${style.border} ${style.text} ${style.bg} ${sizeStyles} ${className}`}
      aria-hidden="true"
    >
      <span className="relative top-[0.5px]">{text}</span>
    </div>
  );
}

'use client';

import React from 'react';

interface BackgroundGridProps {
  variant?: 'grid' | 'dots' | 'both';
  className?: string;
}

export function BackgroundGrid({ variant = 'grid', className = '' }: BackgroundGridProps) {
  return (
    <div className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className}`}>
      {/* Top ambient spotlight (pure neutral, low opacity) */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[480px] opacity-40 blur-3xl"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(24, 24, 27, 0.05) 0%, rgba(255, 255, 255, 0) 70%)'
        }}
      />
      
      {/* Precision Pattern with Radial Fade Mask */}
      <div 
        className={`absolute inset-0 radial-fade-mask ${
          variant === 'grid' 
            ? 'bg-grid-pattern' 
            : variant === 'dots' 
            ? 'bg-dot-pattern' 
            : 'bg-grid-pattern bg-dot-pattern'
        }`}
      />
    </div>
  );
}

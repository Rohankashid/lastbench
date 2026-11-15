'use client';

import React from 'react';

export type AnnotationVariant = 'highlight' | 'wavy' | 'underline' | 'circle';

interface AnnotatedTextProps {
  children: React.ReactNode;
  variant?: AnnotationVariant;
  color?: string; // hex or rgb
  className?: string;
}

export function AnnotatedText({
  children,
  variant = 'highlight',
  color = '#FFB02E', // LastBench signature amber accent
  className = '',
}: AnnotatedTextProps) {
  if (variant === 'highlight') {
    return (
      <span className={`relative inline-block isolate whitespace-nowrap ${className}`}>
        <span
          className="absolute inset-x-[-6px] -inset-y-0.5 rounded-sm pointer-events-none z-0"
          style={{
            backgroundColor: color,
            opacity: 0.38,
            transform: 'rotate(-0.8deg) scaleY(0.92)',
            borderRadius: '4px 8px 3px 7px',
          }}
          aria-hidden="true"
        />
        <span className="relative z-10">{children}</span>
      </span>
    );
  }

  if (variant === 'wavy') {
    return (
      <span className={`relative inline-block isolate ${className}`}>
        <span className="relative z-10">{children}</span>
        <svg
          className="absolute left-0 -bottom-2 w-full h-2.5 pointer-events-none overflow-visible z-0"
          viewBox="0 0 100 10"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M 0 5 Q 12.5 0, 25 5 T 50 5 T 75 5 T 100 5"
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </span>
    );
  }

  if (variant === 'underline') {
    return (
      <span className={`relative inline-block isolate ${className}`}>
        <span className="relative z-10">{children}</span>
        <svg
          className="absolute left-0 -bottom-1.5 w-full h-2 pointer-events-none overflow-visible z-0"
          viewBox="0 0 100 8"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M 1 5 C 25 7, 75 3, 99 5"
            fill="none"
            stroke={color}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      </span>
    );
  }

  if (variant === 'circle') {
    return (
      <span className={`relative inline-block isolate px-1.5 ${className}`}>
        <span className="relative z-10">{children}</span>
        <svg
          className="absolute -inset-1.5 w-[calc(100%+12px)] h-[calc(100%+12px)] pointer-events-none overflow-visible z-0"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M 10 50 C 10 18, 90 12, 92 48 C 94 82, 14 88, 8 54 C 6 42, 18 24, 38 18"
            fill="none"
            stroke={color}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      </span>
    );
  }

  return <span className={className}>{children}</span>;
}

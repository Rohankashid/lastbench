'use client';

import React, { useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface InfiniteMarqueeProps {
  items: React.ReactNode[];
  speed?: number; // duration in seconds
  direction?: 'left' | 'right';
  pauseOnHover?: boolean;
  gap?: string;
  fade?: boolean;
  className?: string;
}

export function InfiniteMarquee({
  items,
  speed = 35,
  direction = 'left',
  pauseOnHover = true,
  gap = '2.5rem',
  fade = true,
  className = '',
}: InfiniteMarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const isReverse = direction === 'right';

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden select-none ${className}`}
      style={{
        maskImage: fade
          ? 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)'
          : undefined,
        WebkitMaskImage: fade
          ? 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)'
          : undefined,
      }}
    >
      <motion.div
        className="flex w-max items-center"
        style={{ gap }}
        animate={
          shouldReduceMotion
            ? undefined
            : {
                x: isReverse ? ['-50%', '0%'] : ['0%', '-50%'],
              }
        }
        transition={
          shouldReduceMotion
            ? undefined
            : {
                x: {
                  repeat: Infinity,
                  repeatType: 'loop',
                  duration: speed,
                  ease: 'linear',
                },
              }
        }
        whileHover={pauseOnHover ? { animationPlayState: 'paused' } : undefined}
      >
        {/* First track */}
        <div className="flex shrink-0 items-center" style={{ gap }}>
          {items.map((item, index) => (
            <div key={`track-1-${index}`} className="shrink-0 flex items-center">
              {item}
            </div>
          ))}
        </div>

        {/* Duplicate track for seamless infinite seam */}
        <div className="flex shrink-0 items-center" style={{ gap }} aria-hidden="true">
          {items.map((item, index) => (
            <div key={`track-2-${index}`} className="shrink-0 flex items-center">
              {item}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

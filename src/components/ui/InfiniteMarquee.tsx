'use client';

import React from 'react';

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
  const isReverse = direction === 'right';

  return (
    <div
      className={`relative w-full overflow-hidden select-none min-h-[96px] sm:min-h-[128px] ${className}`}
      style={{
        maskImage: fade
          ? 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)'
          : undefined,
        WebkitMaskImage: fade
          ? 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)'
          : undefined,
      }}
    >
      <div
        className={`flex w-max items-center ${pauseOnHover ? 'hover:[animation-play-state:paused]' : ''}`}
        style={{
          gap,
          animation: `${isReverse ? 'marquee-reverse' : 'marquee'} ${speed}s linear infinite`,
          willChange: 'transform',
        }}
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
      </div>
    </div>
  );
}

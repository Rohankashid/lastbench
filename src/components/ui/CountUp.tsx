'use client';

import React, { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  to: number;
  from?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export function CountUp({
  to,
  from = 0,
  duration = 2,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [displayValue, setDisplayValue] = useState<string>(from.toFixed(decimals));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let startTime: number | null = null;
    let animationFrameId: number;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          observer.disconnect();

          const step = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
            // Ease out cubic
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = from + (to - from) * easeOut;

            if (decimals > 0) {
              setDisplayValue(current.toFixed(decimals));
            } else {
              setDisplayValue(Math.round(current).toLocaleString());
            }

            if (progress < 1) {
              animationFrameId = requestAnimationFrame(step);
            }
          };

          animationFrameId = requestAnimationFrame(step);
        }
      },
      { rootMargin: '-40px' }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [from, to, duration, decimals]);

  return (
    <span ref={ref} className={`font-mono tabular-nums ${className}`}>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
}

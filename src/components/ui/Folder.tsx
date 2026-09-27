'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export interface FolderItem {
  id: string;
  title: string;
  subtitle: string;
  tag?: string;
}

interface FolderProps {
  title: string;
  count: number;
  category: string;
  href: string;
  items: FolderItem[];
}

export function Folder({
  title,
  count,
  category,
  href,
  items,
}: FolderProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link 
      href={href}
      className="block group select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative w-full h-[270px] sm:h-[295px] flex flex-col justify-end p-2 cursor-pointer">
        {/* Fanned out preview cards behind the folder */}
        <div className="absolute inset-x-6 top-6 sm:top-8 h-36 sm:h-40 flex items-center justify-center">
          {items.slice(0, 3).map((item, index) => {
            // Spring-based fanning out on hover
            const rotations = [-7, 0, 7];
            const yOffsets = [-18, -26, -18];
            const xOffsets = [-24, 0, 24];

            const rotation = isHovered ? rotations[index] : (index - 1) * 2;
            const yOffset = isHovered ? yOffsets[index] : (index * 4);
            const xOffset = isHovered ? xOffsets[index] : 0;

            return (
              <motion.div
                key={item.id}
                animate={{
                  rotate: rotation,
                  y: yOffset,
                  x: xOffset,
                  scale: isHovered ? 1.02 : 0.96,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 350,
                  damping: 25,
                }}
                style={{ zIndex: index + 1 }}
                className="absolute inset-0 bg-white border border-zinc-200/90 rounded-xl p-4 shadow-[0_4px_16px_rgba(0,0,0,0.04)] flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
                    {item.tag || category}
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-zinc-900 truncate">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* The Front Folder Enclosure */}
        <motion.div 
          animate={{
            y: isHovered ? 4 : 0,
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="relative z-10 bg-zinc-900 text-white rounded-2xl p-6 border border-zinc-800 shadow-[0_12px_32px_rgba(0,0,0,0.12)] overflow-hidden"
        >
          {/* Subtle top folder tab styling */}
          <div className="absolute top-0 right-0 w-28 h-6 bg-zinc-800/80 rounded-bl-xl border-l border-b border-zinc-700/50 flex items-center justify-center">
            <span className="font-mono text-[10px] text-zinc-400 font-medium tracking-widest">
              {count} FILES
            </span>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-wider text-zinc-400">
              {category}
            </span>
          </div>

          <div className="flex items-end justify-between mt-4">
            <div>
              <h3 className="text-lg font-semibold text-white tracking-tight group-hover:text-zinc-100 transition-colors">
                {title}
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Explore curated syllabus repository
              </p>
            </div>

            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700/60 flex items-center justify-center group-hover:bg-zinc-700 group-hover:text-white transition-all">
              <svg 
                className="w-4 h-4 text-zinc-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          </div>
        </motion.div>
      </div>
    </Link>
  );
}

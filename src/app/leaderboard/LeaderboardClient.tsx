'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BackgroundGrid } from '@/components/ui/BackgroundGrid';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface LeaderboardEntry {
  uid: string;
  name: string;
  university: string;
  contributionsCount: number;
}

export function LeaderboardClient() {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        const res = await fetch('/api/leaderboard');
        if (res.ok) {
          const data = await res.json();
          setLeaders(data.leaderboard || []);
        }
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaders();
  }, []);

  return (
    <div className="relative min-h-[calc(100vh-64px)] bg-[#FAFAFA]">
      <BackgroundGrid variant="grid" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
        
        {/* Header Section */}
        <div className="flex flex-col items-center text-center mb-16 space-y-6">
          <motion.div 
            initial={{ opacity: 0, filter: 'blur(4px)', y: 10 }}
            animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-zinc-950 tracking-[-0.04em]">
              Community Leaderboard
            </h1>
            <p className="text-base sm:text-lg text-zinc-500 max-w-2xl mx-auto leading-relaxed tracking-[-0.01em]">
              Recognizing the students who power our open-source archive. The top 3 contributors each month receive exclusive campus merchandise and rewards.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Link 
              href="/upload" 
              className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-zinc-950 text-white hover:bg-zinc-800 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm font-medium shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
            >
              <span>Submit Material</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>

        {/* Data Table */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full"
        >
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 sm:gap-4 px-2 sm:px-4 py-3 border-b border-zinc-200/80 text-[10px] sm:text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">
            <div className="col-span-1 text-left">#</div>
            <div className="col-span-8 sm:col-span-6">Contributor</div>
            <div className="hidden sm:block sm:col-span-3">University</div>
            <div className="col-span-3 sm:col-span-2 text-right">Uploads</div>
          </div>

          {/* Table Body */}
          <div className="flex flex-col">
            {loading ? (
              <div className="py-24 flex items-center justify-center">
                <div className="w-5 h-5 border-[1.5px] border-zinc-300 border-t-zinc-950 rounded-full animate-spin" />
              </div>
            ) : leaders.length === 0 ? (
              <div className="py-24 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-zinc-100/50 border border-zinc-200 flex items-center justify-center mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                </div>
                <h3 className="text-sm font-medium text-zinc-950 tracking-tight">No data available</h3>
                <p className="text-sm text-zinc-500 mt-1 mb-6">The leaderboard is waiting for its first contributor.</p>
                <Link 
                  href="/upload" 
                  className="text-sm font-medium text-zinc-950 hover:text-zinc-600 transition-colors underline decoration-zinc-300 underline-offset-4"
                >
                  Be the first to upload →
                </Link>
              </div>
            ) : (
              leaders.map((leader, idx) => (
                <div 
                  key={leader.uid}
                  className="grid grid-cols-12 gap-2 sm:gap-4 px-2 sm:px-4 py-3 sm:py-4 items-center border-b border-zinc-100/50 hover:bg-zinc-50/50 transition-colors group"
                >
                  <div className="col-span-1">
                    <span className={`text-xs sm:text-sm font-medium ${idx < 3 ? 'text-zinc-950' : 'text-zinc-400'}`}>
                      {idx + 1}
                    </span>
                  </div>
                  <div className="col-span-8 sm:col-span-6 flex items-center gap-2 sm:gap-3">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white border border-zinc-200 flex flex-shrink-0 items-center justify-center text-[10px] sm:text-[11px] font-semibold text-zinc-700 shadow-sm">
                      {leader.name.charAt(0).toUpperCase()}
                    </div>
                    <span className={`text-xs sm:text-sm truncate ${idx < 3 ? 'font-medium text-zinc-950' : 'text-zinc-600'}`}>
                      {leader.name}
                    </span>
                  </div>
                  <div className="hidden sm:block sm:col-span-3">
                    <span className="text-xs sm:text-sm text-zinc-500 truncate block">
                      {leader.university}
                    </span>
                  </div>
                  <div className="col-span-3 sm:col-span-2 text-right">
                    <span className="text-xs sm:text-sm font-medium text-zinc-950 tabular-nums">
                      {leader.contributionsCount}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
}

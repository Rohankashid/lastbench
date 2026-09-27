'use client';

import React from 'react';
import { motion } from 'framer-motion';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-[3px]',
  lg: 'w-12 h-12 border-4',
};

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '' }) => {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className={`rounded-full border-t-indigo-600 border-r-indigo-600 border-b-indigo-200 border-l-indigo-200 ${sizeMap[size]} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
};

export const FullPageSpinner: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50/80 backdrop-blur-sm">
      <Spinner size="lg" />
      <motion.p 
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-4 text-slate-600 font-medium tracking-wide"
      >
        LastBench
      </motion.p>
    </div>
  );
};

export default Spinner;

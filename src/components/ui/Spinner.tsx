'use client';

import React from 'react';
import { motion } from 'framer-motion';

export const BrandLoader: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const isSmall = size === 'sm';
  
  return (
    <div className={`flex flex-col items-center justify-center ${isSmall ? 'gap-2' : 'gap-4'}`}>
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={`flex items-center justify-center bg-zinc-950 shadow-sm ${
          isSmall ? 'w-6 h-6 rounded-md' : 'w-12 h-12 rounded-xl'
        }`}
      >
        <span className={`text-white font-bold tracking-tighter ${isSmall ? 'text-[10px]' : 'text-xl'}`}>LB</span>
      </motion.div>
      
      {!isSmall && (
        <div className="flex gap-1.5">
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
            className="w-1.5 h-1.5 rounded-full bg-zinc-400"
          />
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
            className="w-1.5 h-1.5 rounded-full bg-zinc-400"
          />
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
            className="w-1.5 h-1.5 rounded-full bg-zinc-400"
          />
        </div>
      )}
    </div>
  );
};

export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ size = 'md', className }) => {
  return <div className={className}><BrandLoader size={size} /></div>;
};

export const FullPageSpinner: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm">
      <BrandLoader size="lg" />
    </div>
  );
};

export default Spinner;

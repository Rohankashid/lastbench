'use client';

import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col gap-4 w-full h-full">
      {/* Header/Title placeholder */}
      <div className="flex justify-between items-start gap-4">
        <div className="skeleton h-6 w-3/4 rounded-lg"></div>
        {/* Badge placeholder */}
        <div className="skeleton h-6 w-16 rounded-full shrink-0"></div>
      </div>
      
      {/* Description placeholder */}
      <div className="space-y-2 mt-2">
        <div className="skeleton h-4 w-full rounded-md"></div>
        <div className="skeleton h-4 w-5/6 rounded-md"></div>
      </div>
      
      {/* Footer metadata placeholder */}
      <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-50">
        <div className="flex items-center gap-2">
          <div className="skeleton h-6 w-6 rounded-full"></div>
          <div className="skeleton h-4 w-20 rounded-md"></div>
        </div>
        <div className="skeleton h-4 w-12 rounded-md"></div>
      </div>
    </div>
  );
};

export default SkeletonCard;
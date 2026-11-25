import type { Metadata } from 'next';
import { Suspense } from 'react';
import MicrosClient from './MicrosClient';

export const metadata: Metadata = {
  title: 'LastBench Micros | 4-in-1 & 8-in-1 Foldable Pocket Revision PDF Converter',
  description: 'Convert any university course pack, notes, or uploaded PDF into clean 4-in-1 or 8-in-1 double-sided foldable pocket sheets. Crystal clear text, zero xerox smudges.',
  keywords: [
    'micro xerox converter',
    '4 in 1 pdf converter',
    '8 in 1 pdf converter',
    'micro notes generator',
    'pocket cheat sheet pdf',
    'engineering exam revision',
    'foldable pocket notes',
    'LastBench micros'
  ],
  openGraph: {
    title: 'LastBench Micros | 4-in-1 & 8-in-1 Foldable Pocket Notes',
    description: 'Transform any PDF into compact pocket sheets with fold & cut guides.',
    url: 'https://www.lastbench.online/micros',
    siteName: 'LastBench',
  },
};

export default function MicrosPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAFAFA]" />}>
      <MicrosClient />
    </Suspense>
  );
}

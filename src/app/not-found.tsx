import Link from 'next/link';
import Image from 'next/image';
import { BackgroundGrid } from '@/components/ui/BackgroundGrid';

export default function NotFound() {
  return (
    <div className="relative min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <BackgroundGrid variant="grid" />
      
      <div className="relative z-10 flex flex-col items-center text-center max-w-md mx-auto">
        <div className="relative w-64 h-64 mix-blend-multiply mb-2">
          <Image 
            src="/images/404-student-premium.jpg" 
            alt="Tired student illustration"
            fill
            className="object-contain"
            priority
          />
        </div>
        
        <h1 className="text-4xl font-bold text-zinc-950 tracking-tight mb-2">
          404
        </h1>
        <h2 className="text-lg font-semibold text-zinc-800 mb-2">
          Dead End
        </h2>
        <p className="text-sm text-zinc-500 mb-8 max-w-[280px]">
          We searched the archives but couldn&apos;t find the requested page. It&apos;s either been moved, or you&apos;re lost.
        </p>
        
        <Link 
          href="/"
          className="inline-flex items-center justify-center px-6 py-2.5 bg-zinc-950 text-white text-sm font-medium rounded-full hover:bg-zinc-800 transition-all shadow-sm"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}

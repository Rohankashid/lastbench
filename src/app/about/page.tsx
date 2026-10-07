import React from 'react';
import { BackgroundGrid } from '@/components/ui/BackgroundGrid';

export const metadata = {
  title: 'About Us',
  description: 'Learn about LastBench, the open-access engineering study archive built by students, for students.',
};

export default function AboutPage() {
  return (
    <div className="relative min-h-screen py-16 px-4 sm:px-6 lg:px-8 bg-zinc-50/50">
      <BackgroundGrid variant="grid" />
      <div className="relative max-w-3xl mx-auto space-y-12">
        
        <header className="border-b border-zinc-200 pb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-mono text-xs uppercase tracking-wider text-zinc-500 font-medium">
              Our Mission
            </span>
          </div>
          <h1 className="text-4xl font-semibold text-zinc-950 tracking-tight mb-4">
            Democratizing Engineering Education.
          </h1>
          <p className="text-lg text-zinc-600 leading-relaxed max-w-2xl">
            LastBench is an open-access, community-driven study archive built by students, for students. We believe that high-quality university notes and past question papers should be freely accessible to everyone.
          </p>
        </header>

        <section className="space-y-6 text-zinc-800 leading-relaxed text-[15px]">
          <h2 className="text-2xl font-semibold text-zinc-950 tracking-tight">The Problem</h2>
          <p>
            Engineering students waste countless hours before every exam frantically messaging seniors and WhatsApp groups for syllabus copies, lecture digests, and previous year question papers (PYQs). Existing platforms either lock this crucial material behind expensive paywalls or spam-filled interfaces.
          </p>
          
          <h2 className="text-2xl font-semibold text-zinc-950 tracking-tight pt-4">Our Solution</h2>
          <p>
            We built LastBench to solve this problem once and for all. It serves as a centralized, minimalist, and lightning-fast repository for university study materials. 
          </p>
          <ul className="list-disc pl-5 space-y-2 text-zinc-700">
            <li><strong>100% Free Previews:</strong> Read any document directly in your browser without spending a dime or creating an account.</li>
            <li><strong>Community Powered:</strong> Our entire database is crowdsourced from generous engineering students across the country.</li>
            <li><strong>Zero Clutter:</strong> We prioritize a clean, ad-light, distraction-free interface so you can focus entirely on studying.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-zinc-950 tracking-tight pt-4">Get Involved</h2>
          <p>
            LastBench grows through community contribution. If you have clear, high-yield lecture notes or recent exam papers, you can instantly upload them to our public archive to help thousands of juniors who will take the exact same exam next year. 
          </p>
          <p>
            For questions, takedown requests, or partnership inquiries, please visit our <a href="/contact" className="text-blue-600 hover:underline">Contact Page</a>.
          </p>
        </section>
      </div>
    </div>
  );
}

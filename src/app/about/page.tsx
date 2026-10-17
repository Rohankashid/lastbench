import React from 'react';
import Link from 'next/link';
import { BackgroundGrid } from '@/components/ui/BackgroundGrid';
import { BookOpen, ShieldCheck, GraduationCap, Users } from 'lucide-react';

export const metadata = {
  title: 'About Us | LastBench',
  description: 'Learn about LastBench, the open-access engineering study archive built by students, for students.',
};

export default function AboutPage() {
  return (
    <div className="relative min-h-screen py-16 px-4 sm:px-6 lg:px-8 bg-zinc-50/50">
      <BackgroundGrid variant="grid" />
      <div className="relative max-w-3xl mx-auto space-y-12">
        
        {/* Header */}
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
            LastBench is an open-access, community-driven study repository built by students, for students. We believe that high-quality university notes and past question papers should be freely accessible to everyone without paywalls or subscriptions.
          </p>
        </header>

        {/* Narrative Sections */}
        <section className="space-y-6 text-zinc-800 leading-relaxed text-[15px]">
          <h2 className="text-2xl font-semibold text-zinc-950 tracking-tight">The Problem We Solve</h2>
          <p>
            Engineering students waste countless hours before every examination frantically messaging seniors and WhatsApp groups for syllabus copies, unit notes, and previous year question papers (PYQs). Existing platforms either lock this crucial material behind expensive paywalls or spam-filled, cluttered interfaces.
          </p>
          
          <h2 className="text-2xl font-semibold text-zinc-950 tracking-tight pt-4">Our Approach</h2>
          <p>
            We built LastBench to solve this problem once and for all. It serves as a centralized, minimalist, and lightning-fast repository for university study materials:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center gap-2 text-zinc-900 font-semibold text-sm mb-1">
                <BookOpen className="w-4 h-4 text-blue-600" />
                100% Free In-Browser Previews
              </div>
              <p className="text-xs text-zinc-600">
                Read any document directly in your browser without spending money, downloading bloated apps, or creating an account.
              </p>
            </div>
            <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center gap-2 text-zinc-900 font-semibold text-sm mb-1">
                <Users className="w-4 h-4 text-emerald-600" />
                Community Sourced
              </div>
              <p className="text-xs text-zinc-600">
                Crowdsourced from generous engineering students and top scorers across Maharashtra technical universities.
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-zinc-950 tracking-tight pt-4">Curriculum & University Coverage</h2>
          <p>
            LastBench actively archives and indexes study materials for major technical universities, with specialized coverage for:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-zinc-700 text-sm">
            <li>
              <strong>Savitribai Phule Pune University (SPPU):</strong> Full support for both the 2019 Credit Pattern (In-Sem 30 Marks / End-Sem 70 Marks) and the latest 2024 National Education Policy (NEP) 60-mark structure.
            </li>
            <li>
              <strong>Dr. Babasaheb Ambedkar Technological University (DBATU):</strong> Semester question papers and model unit digests for state technological curriculum.
            </li>
            <li>
              <strong>Mumbai University & Autonomous Engineering Colleges:</strong> Core foundational and departmental syllabus tracks.
            </li>
          </ul>

          <h2 className="text-2xl font-semibold text-zinc-950 tracking-tight pt-4">Quality & Copyright Policy</h2>
          <p>
            LastBench strictly enforces educational fair-use principles. Our repository accepts only:
          </p>
          <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-3">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <strong className="text-zinc-900">Student-Authored Notes & Public University Papers:</strong> We only host personal student lecture summaries, handwritten formula sheets, and past university examination papers. We strictly forbid and immediately remove scanned copies of commercial textbooks, paid test banks, or proprietary publisher content.
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-zinc-950 tracking-tight pt-4">Get Involved</h2>
          <p>
            LastBench grows through student participation. If you have clear, high-yield lecture notes or recent exam papers, you can instantly upload them to our public archive to help upcoming batches.
          </p>
          <p>
            For questions, takedown notices, or partnership inquiries, please contact us at{' '}
            <a href="mailto:contact.lastbench@gmail.com" className="text-blue-600 hover:underline font-medium">
              contact.lastbench@gmail.com
            </a>{' '}
            or visit our <Link href="/contact" className="text-blue-600 hover:underline font-medium">Contact Page</Link>.
          </p>
        </section>
      </div>
    </div>
  );
}

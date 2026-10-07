'use client';

import React from 'react';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="border-t border-zinc-200 bg-white text-zinc-600 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-10">
          
          {/* Column 1: Brand & Architecture */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center">
              <span className="text-base font-semibold text-zinc-950 tracking-tight">
                LastBench
              </span>
            </div>
            <p className="text-xs text-zinc-500 max-w-sm leading-relaxed">
              Community-driven academic study pool for engineering students. Open peer-shared lecture digests, university previous year question papers, and syllabus reference aids.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-mono text-[11px] text-zinc-500 uppercase tracking-wider">
                30+ Universities Covered
              </span>
            </div>
          </div>

          {/* Column 2: Navigation */}
          <div className="space-y-3">
            <h4 className="font-mono text-[11px] uppercase tracking-wider text-zinc-900 font-semibold">
              Repository
            </h4>
            <nav className="flex flex-col space-y-2 text-xs">
              <Link href="/notes" className="text-zinc-500 hover:text-zinc-950 transition-colors">
                Study Notes
              </Link>
              <Link href="/pyqs" className="text-zinc-500 hover:text-zinc-950 transition-colors">
                Previous Year Papers
              </Link>
              <Link href="/upload" className="text-zinc-500 hover:text-zinc-950 transition-colors">
                Share Material
              </Link>
            </nav>
          </div>

          {/* Column 3: Legal */}
          <div className="space-y-3">
            <h4 className="font-mono text-[11px] uppercase tracking-wider text-zinc-900 font-semibold">
              Legal
            </h4>
            <nav className="flex flex-col space-y-2 text-xs">
              <Link href="/privacy" className="text-zinc-500 hover:text-zinc-950 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-zinc-500 hover:text-zinc-950 transition-colors">
                Terms of Service
              </Link>
              <Link href="/contact" className="text-zinc-500 hover:text-zinc-950 transition-colors">
                Contact Us
              </Link>
            </nav>
          </div>

          {/* Column 4: Contact & Attribution */}
          <div className="space-y-3">
            <h4 className="font-mono text-[11px] uppercase tracking-wider text-zinc-900 font-semibold">
              Connect
            </h4>
            <div className="space-y-2 text-xs">
              <a 
                href="mailto:contact.lastbench@gmail.com" 
                className="text-zinc-600 hover:text-zinc-950 transition-colors inline-block"
              >
                contact.lastbench@gmail.com
              </a>
              <p className="text-[11px] text-zinc-400 pt-1">
                UI components inspired by{' '}
                <a 
                  href="https://www.rareui.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-zinc-700 underline underline-offset-2 hover:text-zinc-950 transition-colors font-medium"
                >
                  Rare UI
                </a>
              </p>
            </div>
          </div>

        </div>

        {/* Fair Use / Educational Disclaimer Notice */}
        <div className="py-4 my-6 border-y border-zinc-100 text-[11px] text-zinc-400 leading-relaxed">
          <strong className="text-zinc-600 font-medium">Educational Disclaimer:</strong> LastBench is a student peer-exchange platform. All lecture summaries, university question papers, and study aids are contributed by students for non-commercial educational study, reference, and exam preparation.
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="font-mono text-[11px] text-zinc-400">
            &copy; {new Date().getFullYear()} LastBench &bull; Open Academic Study Companion
          </p>
          <div className="flex items-center gap-4 font-mono text-[11px] text-zinc-400">
            <span>Engineering Streams: CSE &bull; IT &bull; ENTC &bull; MECH &bull; CIVIL</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
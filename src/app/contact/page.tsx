import React from 'react';
import { Metadata } from 'next';
import { Mail, Flag } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Us | LastBench',
  description: 'Get in touch with the LastBench team.',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-24 pb-16 px-4 flex items-center justify-center">
      <div className="max-w-xl w-full bg-white border border-zinc-200 rounded-2xl p-8 sm:p-12 shadow-sm text-center">
        <h1 className="text-3xl font-semibold text-zinc-950 tracking-tight mb-3">Contact Us</h1>
        <p className="text-sm text-zinc-500 mb-10 leading-relaxed max-w-md mx-auto">
          Whether you have a question, need to report a bug, or want to submit a copyright takedown request, we&apos;re here to help.
        </p>

        <div className="space-y-4">
          <a 
            href="mailto:contact.lastbench@gmail.com"
            className="flex items-center p-4 border border-zinc-200 rounded-xl hover:border-zinc-300 hover:bg-zinc-50 transition-colors group text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center mr-4 group-hover:bg-white group-hover:shadow-sm transition-all shrink-0">
              <Mail className="w-5 h-5 text-zinc-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">General Support</h3>
              <p className="text-xs text-zinc-500 mt-0.5">contact.lastbench@gmail.com</p>
            </div>
          </a>

          <a 
            href="mailto:contact.lastbench@gmail.com?subject=Copyright%20Takedown%20Request"
            className="flex items-center p-4 border border-zinc-200 rounded-xl hover:border-zinc-300 hover:bg-zinc-50 transition-colors group text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center mr-4 group-hover:bg-white group-hover:shadow-sm transition-all shrink-0">
              <Flag className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">Copyright & DMCA</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Report unauthorized copyrighted material.</p>
            </div>
          </a>
        </div>
        
        <div className="mt-12 pt-8 border-t border-zinc-100 text-xs text-zinc-400">
          We usually respond to all inquiries within 24-48 hours.
        </div>
      </div>
    </div>
  );
}

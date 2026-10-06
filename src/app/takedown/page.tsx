import React from 'react';
import { BackgroundGrid } from '@/components/ui/BackgroundGrid';
import { Mail, Flag, Shield, AlertCircle } from 'lucide-react';

export default function TakedownPage() {
  return (
    <div className="relative min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-zinc-50/50">
      <BackgroundGrid variant="both" />
      <div className="max-w-3xl mx-auto space-y-8 relative z-10">
        
        {/* Header Section */}
        <div className="border-b border-zinc-200 pb-5">
          <div className="inline-flex items-center gap-1.5 text-rose-600 text-xs font-medium mb-3">
            <Shield className="w-4 h-4" />
            <span>COPYRIGHT & REPORTING</span>
          </div>
          <h1 className="text-3xl font-semibold text-zinc-950 tracking-tight">
            Takedown & Copyright Policy
          </h1>
          <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
            LastBench is a free, community-driven archive of engineering study material. Content is uploaded by students and community members. We respect copyright and respond promptly to valid complaints.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 p-6 sm:p-8 shadow-sm space-y-8">
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
              <Flag className="w-5 h-5 text-zinc-400" />
              How to Report Copyright Infringement
            </h2>
            <p className="text-sm text-zinc-600 leading-relaxed">
              If you believe content on LastBench infringes your copyright, please email us with the following details:
            </p>
            <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-5">
              <ol className="list-decimal list-inside space-y-3 text-sm text-zinc-700">
                <li>A description of the copyrighted work.</li>
                <li>The exact URL(s) of the material on LastBench.</li>
                <li>Your contact details (name, email).</li>
                <li>A statement that you have a good-faith belief the use is unauthorized, and that the information in your notice is accurate.</li>
              </ol>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-zinc-400" />
              Our Response Process
            </h2>
            <p className="text-sm text-zinc-600 leading-relaxed">
              We aim to review and remove validly reported content <strong>within 48 hours</strong>. We may also remove content at our discretion if it violates our community guidelines.
            </p>
            <p className="text-sm text-zinc-600 leading-relaxed italic">
              Uploaders: By uploading, you confirm you have the right to share the material. Repeat infringers may be blocked.
            </p>
          </section>

          <div className="pt-6 border-t border-zinc-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-950 text-white rounded-xl p-5">
              <div>
                <h3 className="font-medium">Submit a Report</h3>
                <p className="text-xs text-zinc-400 mt-1">Send us an email directly to our support inbox.</p>
              </div>
              <a 
                href="mailto:copyright@lastbench.online"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-zinc-950 hover:bg-zinc-100 text-sm font-medium rounded-lg transition-colors"
              >
                <Mail className="w-4 h-4" />
                contact.lastbench@gmail.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

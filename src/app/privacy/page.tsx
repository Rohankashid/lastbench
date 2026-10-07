import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | LastBench',
  description: 'How LastBench handles your data transparently.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto bg-white border border-zinc-200 rounded-2xl p-8 sm:p-12 shadow-sm">
        <h1 className="text-3xl font-semibold text-zinc-950 tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-sm text-zinc-500 mb-8 font-mono">Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        <div className="space-y-8 text-sm text-zinc-700 leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-3">1. Introduction</h2>
            <p>
              Welcome to LastBench. This platform helps engineering students share notes and study materials. We only collect the data strictly necessary to run the platform, and we do not sell your personal data.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-3">2. Information We Collect</h2>
            <p className="mb-2">When you use LastBench, we collect the following:</p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-600">
              <li><strong>Account Information:</strong> Name, email address, university, branch, and graduation year when you create an account via Google or email/password.</li>
              <li><strong>User-Generated Content:</strong> Study materials (Notes, PYQs) you upload, and any posts or comments you make in the community forum.</li>
              <li><strong>Usage Data:</strong> Bookmarks, download history, and general interaction metrics to improve our ranking algorithms and leaderboard.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-3">3. How We Use Your Information</h2>
            <p className="mb-2">Your information is used strictly to provide and improve the LastBench experience:</p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-600">
              <li>To authenticate your account and keep it secure.</li>
              <li>To attribute uploaded study materials and forum posts to your profile.</li>
              <li>To calculate public leaderboard rankings based on your contributions.</li>
              <li>To filter and recommend materials specific to your university and branch.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-3">4. Cookies and Third-Party Services</h2>
            <p>
              We use standard authentication cookies via Google Firebase to keep you logged in. We also use secure third-party infrastructure including Vercel (hosting) and AWS/Firebase Storage (file hosting) to store and deliver content. These providers only process data on our behalf and are bound by strict security protocols.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-3">5. Public Information</h2>
            <p>
              Please note that your name, university, and uploaded materials are publicly visible on your profile and the leaderboard. Do not upload or post any personal or sensitive information that you do not wish to be public.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-3">6. Your Rights & Account Deletion</h2>
            <p>
              You have the right to access, modify, or delete your personal data at any time. If you wish to permanently delete your account and all associated data, please contact us at the email provided below. We will process data deletion requests within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-3">7. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:{' '}
              <a href="mailto:contact.lastbench@gmail.com" className="text-blue-600 hover:underline">contact.lastbench@gmail.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

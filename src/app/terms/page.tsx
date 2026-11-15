import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | LastBench',
  description: 'Rules and guidelines for using LastBench.',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto bg-white border border-zinc-200 rounded-2xl p-8 sm:p-12 shadow-sm">
        <h1 className="text-3xl font-semibold text-zinc-950 tracking-tight mb-2">Terms of Service</h1>
        <p className="text-sm text-zinc-500 mb-8 font-mono">Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        <div className="space-y-8 text-sm text-zinc-700 leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using LastBench, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access or use our platform.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-3">2. Description of Service</h2>
            <p>
              LastBench is an educational peer-to-peer sharing platform. We provide infrastructure for university students to upload, share, and discuss academic study materials, including personal lecture notes and university previous year question papers (PYQs).
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-3">3. User Uploads and Copyright Policy</h2>
            <p className="mb-2">We take intellectual property rights seriously. When uploading content, you agree to the following strict rules:</p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-600">
              <li><strong>You must own the rights:</strong> You may only upload notes that you wrote yourself or public domain university materials (like PYQs).</li>
              <li><strong>No Copyrighted Textbooks:</strong> You are strictly prohibited from uploading scanned copies of copyrighted textbooks, publisher test banks, or proprietary professor slides.</li>
              <li><strong>License Grant:</strong> By uploading materials, you grant LastBench a non-exclusive, worldwide, royalty-free license to host, display, and distribute that content to other users on the platform.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-3">4. DMCA and Content Takedowns</h2>
            <p>
              LastBench respects the intellectual property of others. If you believe that your copyrighted work has been uploaded to our platform without authorization, please use the &quot;Report&quot; flag located on the document viewer, or contact us directly at our support email. We will promptly remove infringing content and terminate the accounts of repeat offenders.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-3">5. User Conduct</h2>
            <p className="mb-2">You agree not to use the platform to:</p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-600">
              <li>Upload malware, viruses, or malicious code.</li>
              <li>Post spam, promotional content, or irrelevant material.</li>
              <li>Harass, abuse, or harm other students on the platform.</li>
              <li>Attempt to scrape, reverse engineer, or disrupt the platform&apos;s infrastructure.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-3">6. Disclaimer of Warranties</h2>
            <p>
              LastBench is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. We do not guarantee the accuracy, completeness, or academic correctness of any notes or materials uploaded by students. Use the materials at your own discretion. We disclaim all warranties, express or implied.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-3">7. Limitation of Liability</h2>
            <p>
              In no event shall LastBench or its operators be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of the platform, including but not limited to academic performance or loss of data.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-3">8. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. We will notify users of any significant changes by updating the date at the top of this page. Continued use of the platform after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-3">9. Contact</h2>
            <p>
              If you have any questions about these Terms, please visit our <Link href="/contact" className="text-blue-600 hover:underline">Contact page</Link> or email us at contact.lastbench@gmail.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

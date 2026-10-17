import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | LastBench',
  description: 'How LastBench handles your data transparently, including cookie policies and Google AdSense compliance disclosures.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto bg-white border border-zinc-200 rounded-2xl p-8 sm:p-12 shadow-sm">
        <h1 className="text-3xl font-semibold text-zinc-950 tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-sm text-zinc-500 mb-8 font-mono">
          Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        <div className="space-y-8 text-sm text-zinc-700 leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-3">1. Introduction</h2>
            <p>
              Welcome to LastBench (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), accessible from{' '}
              <a href="https://www.lastbench.online" className="text-blue-600 hover:underline">https://www.lastbench.online</a>.
              LastBench is a community-driven, open-access study repository created to help engineering students share and discover lecture notes, revision summaries, and previous year university examination papers.
              Your privacy is of utmost importance to us. This Privacy Policy document outlines the types of personal information that is received and collected by LastBench and how it is used.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-3">2. Information We Collect</h2>
            <p className="mb-2">When you interact with LastBench, we may collect the following categories of information:</p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-600">
              <li>
                <strong>Account & Profile Information:</strong> When you voluntarily register an account via Google Sign-In or email, we collect your name, email address, profile photo, and academic preferences (such as your university, engineering branch, and semester).
              </li>
              <li>
                <strong>User-Generated Content:</strong> Study materials, unit notes, question papers, titles, and descriptions you upload, as well as comments or questions posted in our community spaces.
              </li>
              <li>
                <strong>Usage & Interaction Data:</strong> Search queries, bookmarks, helpful votes, and navigation interactions used to improve catalog ranking, discovery, and search relevance.
              </li>
              <li>
                <strong>Technical Log Data:</strong> Like many websites, our servers automatically record basic technical data such as IP addresses, browser type, referring pages, timestamps, and operating system details to ensure security and prevent abuse.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-3">3. How We Use Your Information</h2>
            <p className="mb-2">We use the information we collect strictly to deliver, maintain, and enhance the LastBench platform:</p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-600">
              <li>To provide, operate, and maintain our study material archive and search indexes.</li>
              <li>To authenticate user accounts and manage access permissions.</li>
              <li>To attribute uploaded lecture notes and PYQs to student contributors.</li>
              <li>To filter and display relevant academic materials by university, semester, and engineering branch.</li>
              <li>To monitor platform integrity, prevent malicious activity, and protect copyrighted works.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-3">4. Cookies and Web Beacons</h2>
            <p className="mb-2">
              LastBench uses &quot;cookies&quot; to store information including visitors&apos; preferences, authentication session state, and the pages on the website that the visitor accessed or visited. The information is used to optimize user experience by customizing our web page content based on visitors&apos; browser type and other preferences.
            </p>
            <p>
              You can choose to disable cookies through your individual browser options. More detailed information about cookie management with specific web browsers can be found at the browsers&apos; respective websites.
            </p>
          </section>

          <section className="bg-zinc-50 border border-zinc-200 rounded-xl p-5">
            <h2 className="text-base font-semibold text-zinc-900 mb-3">5. Google AdSense & Third-Party Advertising Disclosures</h2>
            <p className="mb-3">
              We may display advertisements served by Google AdSense and other third-party advertising vendors to fund our server hosting and open-access educational infrastructure. Google is a third-party vendor on our site.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-600 mb-3">
              <li>
                <strong>Third-Party Vendors & Google:</strong> Third-party vendors, including Google, use cookies to serve ads based on a user&apos;s prior visits to your website or other websites on the Internet.
              </li>
              <li>
                <strong>DoubleClick DART Cookie:</strong> Google&apos;s use of advertising cookies enables it and its partners to serve ads to users based on their visit to LastBench and/or other websites on the Internet.
              </li>
              <li>
                <strong>User Opt-Out:</strong> Users may opt out of personalized advertising by visiting{' '}
                <a 
                  href="https://adssettings.google.com/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-600 hover:underline font-medium"
                >
                  Google Ads Settings
                </a>. Alternatively, you can opt out of third-party vendors&apos; use of cookies for personalized advertising by visiting{' '}
                <a 
                  href="https://www.aboutads.info/choices/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-600 hover:underline font-medium"
                >
                  www.aboutads.info
                </a>.
              </li>
            </ul>
            <p className="text-xs text-zinc-500">
              Note that LastBench has no access to or control over these cookies that are used by third-party advertisers.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-3">6. Third-Party Service Providers</h2>
            <p className="mb-2">
              We partner with trusted enterprise cloud infrastructure providers to operate the platform securely:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-600">
              <li><strong>Google Firebase:</strong> User authentication, secure token validation, and metadata storage.</li>
              <li><strong>Supabase:</strong> Scalable PostgreSQL database and full-text search indexing.</li>
              <li><strong>Amazon Web Services (AWS S3):</strong> Encrypted document binary storage and low-latency CDN delivery.</li>
              <li><strong>Vercel:</strong> Edge hosting, serverless rendering, and privacy-preserving performance telemetry.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-3">7. Your Data Rights & Account Deletion</h2>
            <p>
              You have the right to access, export, or request the deletion of your personal data at any time. If you wish to delete your account, remove an uploaded document, or request data purge, please submit a request to our support email below. We honor all verified privacy requests within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-3">8. Children&apos;s Information</h2>
            <p>
              LastBench is an academic platform intended for university and college engineering students. We do not knowingly collect any Personal Identifiable Information from children under the age of 13. If you believe your child has provided this kind of information on our website, we strongly encourage you to contact us immediately and we will promptly remove such information from our records.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-3">9. Contact Us</h2>
            <p>
              If you have any questions, suggestions, or concerns regarding this Privacy Policy, please feel free to reach out to us:
            </p>
            <p className="mt-2">
              Email:{' '}
              <a href="mailto:contact.lastbench@gmail.com" className="text-blue-600 font-medium hover:underline">
                contact.lastbench@gmail.com
              </a>
              <br />
              Platform:{' '}
              <a href="https://www.lastbench.online" className="text-blue-600 font-medium hover:underline">
                https://www.lastbench.online
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

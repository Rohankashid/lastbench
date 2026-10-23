import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/hooks/useAuth';
import { AuthModalProvider } from '@/context/AuthModalContext';
import { BookmarkProvider } from '@/context/BookmarkContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { Analytics } from "@vercel/analytics/next";
import { ToastProvider } from '@/components/ui/Toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Providers from './Providers';
import { GoogleAdSenseController } from '@/components/ads/GoogleAdSense';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "LastBench | Engineering Notes & PYQs Community",
    template: "%s | LastBench"
  },
  description: "Open-access peer study archive for engineering students. Find and share past university question papers (PYQs) and lecture notes for free.",
  keywords: ["LastBench", "LastBench community", "engineering notes", "engineering PYQs", "university papers", "engineering study material", "Last Bench notes", "BTech notes"],
  authors: [{ name: "LastBench" }],
  openGraph: {
    title: "LastBench | Engineering Notes & PYQs Community",
    description: "Open-access peer study archive for engineering students. Find and share university past question papers (PYQs) and notes.",
    url: "https://www.lastbench.online",
    siteName: "LastBench",
    images: [
      {
        url: "https://www.lastbench.online/icon.png", 
        width: 800,
        height: 600,
        alt: "LastBench Logo",
      }
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LastBench | Engineering Notes & PYQs Community",
    description: "Open-access peer study archive for engineering students.",
    images: ["https://www.lastbench.online/icon.png"],
  },
  alternates: {
    canonical: "https://www.lastbench.online",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5720306425929294"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 relative">
          <div 
            className="fixed inset-0 pointer-events-none z-0 opacity-40"
            style={{
              backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}
          />
          <div className="relative z-10 flex flex-col min-h-screen">
            <Providers>
              <AuthProvider>
                <AuthModalProvider>
                  <BookmarkProvider>
                    <ToastProvider>
                      <Navbar />
                      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                        {children}
                      </main>
                      <AuthModal />
                      <GoogleAdSenseController />
                    </ToastProvider>
                  </BookmarkProvider>
                </AuthModalProvider>
                <Analytics />
              </AuthProvider>
            </Providers>
            <Footer />
          </div>
        </div>
      </body>
    </html>
  );
}

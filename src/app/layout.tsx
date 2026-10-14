import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/hooks/useAuth';
import { AuthModalProvider } from '@/context/AuthModalContext';
import { BookmarkProvider } from '@/context/BookmarkContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { Analytics } from "@vercel/analytics/next";
import { ToastProvider } from '@/components/ui/Toast';
import Layout from '@/components/layout/Layout';
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
        <Providers>
          <AuthProvider>
          <AuthModalProvider>
            <BookmarkProvider>
              <ToastProvider>
                <Layout>
                  {children}
                </Layout>
                <AuthModal />
                <GoogleAdSenseController />
              </ToastProvider>
            </BookmarkProvider>
          </AuthModalProvider>
          <Analytics />
        </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}

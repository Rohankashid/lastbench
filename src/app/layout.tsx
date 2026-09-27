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

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LastBench - Engineering Study Materials",
  description: "Your ultimate engineering study companion. Access and share high-quality study materials, lecture notes, and previous year question papers (PYQs) with ease.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <AuthModalProvider>
            <BookmarkProvider>
              <ToastProvider>
                <Layout>
                  {children}
                </Layout>
                <AuthModal />
              </ToastProvider>
            </BookmarkProvider>
          </AuthModalProvider>
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}

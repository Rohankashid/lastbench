'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function Home() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role);
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
        }
      }
    };

    fetchUserRole();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                LastBench
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <>
                  <Link
                    href="/profile"
                    className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                <span className="sr-only">Open main menu</span>
                {!isMenuOpen ? (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {user ? (
                <>
                  <Link
                    href="/profile"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-6">
            Welcome to <span className="text-blue-600">LastBench</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Your one-stop solution for engineering study resources. Access comprehensive notes, previous year questions, and more.
          </p>
        </div>

        {user ? (
          <div className="space-y-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {user.displayName || user.email}!
              </h2>
              <p className="text-gray-600">What would you like to explore today?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <Link
                href="/notes"
                className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg transition-all hover:shadow-xl hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">Study Notes</h3>
                  <p className="text-gray-600">Access comprehensive study materials and notes for your courses</p>
                </div>
              </Link>

              <Link
                href="/pyqs"
                className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg transition-all hover:shadow-xl hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">Previous Year Questions</h3>
                  <p className="text-gray-600">Browse and practice with previous year question papers</p>
                </div>
              </Link>

              {userRole === 'admin' && (
                <Link
                  href="/upload"
                  className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg transition-all hover:shadow-xl hover:-translate-y-1 md:col-span-2"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="relative">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-3">Upload Content</h3>
                    <p className="text-gray-600">Share your study materials and previous year questions with the community</p>
                  </div>
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto text-center">
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Get Started Today</h2>
              <p className="text-gray-600 mb-8">
                Join our community of learners and access high-quality study materials
              </p>
              <div className="space-y-4">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center w-full px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
                >
                  Sign In
                </Link>
                <p className="text-gray-500">or</p>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center w-full px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors duration-200"
                >
                  Create Account
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

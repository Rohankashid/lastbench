'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useAuthModal } from '@/context/AuthModalContext';
import { usePathname } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark } from 'lucide-react';
import { useBookmarks } from '@/context/BookmarkContext';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const { openAuthModal } = useAuthModal();
  const { bookmarks } = useBookmarks();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setIsAdmin(userDoc.data().role === 'admin');
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
        }
      }
    };

    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (path: string) => pathname === path;

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Notes', path: '/notes' },
    { name: 'PYQs', path: '/pyqs' },
    { name: 'Community', path: '/community' },
    ...(user ? [{ name: 'Upload', path: '/upload' }] : []),
  ];

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-zinc-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Minimal Brand Typography */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center group">
                <span className="text-base font-semibold text-zinc-950 tracking-tight">
                  LastBench
                </span>
              </Link>
            </div>

            {/* Gooey / Spring Animated Desktop Nav (Rare UI Style) */}
            <nav className="hidden md:flex items-center p-1 bg-zinc-100/80 rounded-full border border-zinc-200/60 shadow-inner">
              {navLinks.map((link) => {
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.name}
                    href={link.path}
                    className={`relative px-4 py-1.5 rounded-full text-xs font-medium transition-colors duration-200 ${
                      active ? 'text-zinc-950 font-semibold' : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                  >
                    {active && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 bg-white rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-zinc-200/50 -z-10"
                        transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                      />
                    )}
                    <span className="relative z-10">{link.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Desktop Action Area */}
            <div className="hidden md:flex items-center space-x-3">
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 pr-2.5 rounded-full border border-zinc-200/80 hover:bg-zinc-50 transition-colors focus:outline-none"
                  >
                    <div className="w-6 h-6 rounded-full bg-zinc-900 text-white font-mono text-xs flex items-center justify-center font-medium">
                      {getInitials(user.displayName || user.email)}
                    </div>
                    <span className="text-xs font-medium text-zinc-700 max-w-[100px] truncate">
                      {user.displayName || user.email?.split('@')[0]}
                    </span>
                    <svg 
                      className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor" 
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-xl border border-zinc-200 p-1 overflow-hidden z-50"
                      >
                        <div className="px-3 py-2 border-b border-zinc-100">
                          <p className="text-[11px] font-mono uppercase text-zinc-400">Account</p>
                          <p className="text-xs font-medium text-zinc-800 truncate">{user.email}</p>
                        </div>
                        <div className="py-1">
                          <Link
                            href="/?tab=saved"
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center justify-between px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
                          >
                            <span className="flex items-center gap-2">
                              <Bookmark className="w-3.5 h-3.5 text-zinc-400" />
                              <span>Saved Materials</span>
                            </span>
                            {bookmarks.length > 0 && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 font-medium">
                                {bookmarks.length}
                              </span>
                            )}
                          </Link>
                          <Link
                            href="/profile"
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
                          >
                            Profile Settings
                          </Link>
                          {isAdmin && (
                            <Link
                              href="/admin"
                              onClick={() => setIsDropdownOpen(false)}
                              className="flex items-center px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
                            >
                              Admin Dashboard
                            </Link>
                          )}
                          <div className="border-t border-zinc-100 my-1"></div>
                          <button
                            onClick={() => {
                              setIsDropdownOpen(false);
                              signOut();
                            }}
                            className="w-full text-left flex items-center px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openAuthModal('signin')}
                    className="text-xs font-medium text-zinc-600 hover:text-zinc-950 px-3 py-2 transition-colors cursor-pointer"
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => openAuthModal('signup')}
                    className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg text-xs font-medium text-white bg-zinc-950 hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer"
                  >
                    Create Account
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex md:hidden items-center">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 rounded-lg text-zinc-600 hover:bg-zinc-100 transition-colors"
                aria-label="Open menu"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer (Clean, Minimal, Animated) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed inset-y-0 right-0 w-full max-w-xs bg-white shadow-2xl z-[70] md:hidden flex flex-col border-l border-zinc-200"
            >
              <div className="flex items-center justify-between px-5 h-16 border-b border-zinc-100">
                <span className="text-sm font-semibold text-zinc-900 tracking-tight">Navigation</span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-4 space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive(link.path)
                        ? 'bg-zinc-100 text-zinc-950 font-semibold'
                        : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>

              <div className="mt-auto p-4 border-t border-zinc-100">
                {user ? (
                  <div className="space-y-2">
                    <Link
                      href="/?tab=saved"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between px-4 py-2 rounded-lg text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                    >
                      <span className="flex items-center gap-2">
                        <Bookmark className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Saved Materials</span>
                      </span>
                      {bookmarks.length > 0 && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 font-medium">
                          {bookmarks.length}
                        </span>
                      )}
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-4 py-2 rounded-lg text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                    >
                      Profile Settings
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block px-4 py-2 rounded-lg text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        signOut();
                      }}
                      className="w-full text-left px-4 py-2 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        openAuthModal('signin');
                      }}
                      className="block w-full py-2.5 text-center text-xs font-medium text-zinc-700 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer"
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        openAuthModal('signup');
                      }}
                      className="block w-full py-2.5 text-center text-xs font-medium text-white bg-zinc-950 rounded-xl hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer"
                    >
                      Create Account
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAuthModal } from '@/context/AuthModalContext';
import { useToast } from '@/components/ui/Toast';
import { doc, setDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { 
  UNIVERSITY_SELECT_GROUPS, 
  BRANCH_SELECT_GROUPS, 
  ACADEMIC_YEARS 
} from '@/lib/constants/academic';
import { 
  X, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  Lock,
  ArrowLeft
} from 'lucide-react';

export function AuthModal() {
  const { 
    isOpen, 
    mode, 
    contextMessage, 
    redirectUrl, 
    closeAuthModal, 
    setMode,
    onSuccessCallback 
  } = useAuthModal();

  const { signIn, signUp, signInWithGoogle } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // Sign In State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Sign Up State
  const [signUpData, setSignUpData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    university: '',
    branch: '',
    studyingYear: '',
  });
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // General State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Lock scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeAuthModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeAuthModal]);

  // Reset errors when mode or modal visibility changes
  useEffect(() => {
    setError('');
    setForgotSent(false);
  }, [mode, isOpen]);

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      
      // Save user to Firestore if they don't exist yet
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        name: user.displayName || 'Student',
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      toast.success('Signed in successfully');
      closeAuthModal();
      if (onSuccessCallback) {
        onSuccessCallback();
      } else if (redirectUrl) {
        router.push(redirectUrl);
      }
    } catch (err: unknown) {
      console.error('Google sign-in error:', err);
      setError('Unable to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(signInEmail.trim(), signInPassword);
      toast.success('Signed in successfully');
      closeAuthModal();
      if (onSuccessCallback) {
        onSuccessCallback();
      } else if (redirectUrl) {
        router.push(redirectUrl);
      }
    } catch (err: unknown) {
      console.error('Sign-in error:', err);
      type FirebaseError = { code: string };
      let errorCode = '';
      if (err && typeof err === 'object' && 'code' in err && typeof (err as FirebaseError).code === 'string') {
        errorCode = (err as FirebaseError).code;
      }
      switch (errorCode) {
        case 'auth/user-not-found':
          setError('No student account found with this email.');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password. Please try again.');
          break;
        case 'auth/invalid-credential':
          setError('Invalid credentials. Please verify your email and password.');
          break;
        case 'auth/too-many-requests':
          setError('Too many failed attempts. Please wait a moment before retrying.');
          break;
        default:
          setError('Unable to sign in. Please verify your login details.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (signUpData.password !== signUpData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (signUpData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const newUser = await signUp(signUpData.email.trim(), signUpData.password, signUpData.name.trim());

      await setDoc(doc(db, 'users', newUser.uid), {
        uid: newUser.uid,
        name: signUpData.name.trim(),
        email: signUpData.email.trim(),
        university: signUpData.university,
        branch: signUpData.branch,
        studyingYear: signUpData.studyingYear,
        role: 'student',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      toast.success('Student account created successfully!');
      closeAuthModal();
      if (onSuccessCallback) {
        onSuccessCallback();
      } else if (redirectUrl) {
        router.push(redirectUrl);
      }
    } catch (err: unknown) {
      console.error('Sign-up error:', err);
      type FirebaseError = { code: string };
      let errorCode = '';
      if (err && typeof err === 'object' && 'code' in err && typeof (err as FirebaseError).code === 'string') {
        errorCode = (err as FirebaseError).code;
      }
      switch (errorCode) {
        case 'auth/email-already-in-use':
          setError('This email is already registered. Please sign in instead.');
          break;
        case 'auth/invalid-email':
          setError('Please provide a valid email address.');
          break;
        case 'auth/weak-password':
          setError('Password should be at least 6 characters.');
          break;
        default:
          setError('Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, forgotEmail.trim());
      setForgotSent(true);
    } catch (err: unknown) {
      console.error('Password reset error:', err);
      type FirebaseError = { code: string };
      let errorCode = '';
      if (err && typeof err === 'object' && 'code' in err && typeof (err as FirebaseError).code === 'string') {
        errorCode = (err as FirebaseError).code;
      }
      switch (errorCode) {
        case 'auth/user-not-found':
          setError('No account found with this email.');
          break;
        case 'auth/invalid-email':
          setError('Please enter a valid email address.');
          break;
        default:
          setError('Failed to send recovery email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm -z-10"
            onClick={closeAuthModal}
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            className="relative w-full max-w-md bg-white border border-zinc-200/90 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 my-auto"
          >
            {/* Top Navigation Row: Tabs (or Back button) + Dedicated Close Button */}
            <div className="flex items-center justify-between gap-3 mb-5">
              {mode !== 'forgot-password' ? (
                <div className="flex p-1 bg-zinc-100/90 rounded-2xl flex-1 border border-zinc-200/60">
                  <button
                    type="button"
                    onClick={() => setMode('signin')}
                    className={`relative flex-1 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${
                      mode === 'signin' ? 'text-zinc-950 font-semibold' : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                  >
                    {mode === 'signin' && (
                      <motion.div
                        layoutId="auth-tab-pill"
                        className="absolute inset-0 bg-white rounded-xl shadow-xs border border-zinc-200/60"
                        transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                      />
                    )}
                    <span className="relative z-10">Sign In</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className={`relative flex-1 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${
                      mode === 'signup' ? 'text-zinc-950 font-semibold' : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                  >
                    {mode === 'signup' && (
                      <motion.div
                        layoutId="auth-tab-pill"
                        className="absolute inset-0 bg-white rounded-xl shadow-xs border border-zinc-200/60"
                        transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                      />
                    )}
                    <span className="relative z-10">Create Account</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-950 transition-colors font-medium py-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
              )}

              {/* Close Button - clean dedicated slot, never overlaps tab text */}
              <button
                type="button"
                onClick={closeAuthModal}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors shrink-0 cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Context Message (e.g. on Download) */}
            {contextMessage && (
              <div className="mb-5 p-3 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex items-start gap-2.5 text-xs text-zinc-700">
                <Lock className="w-4 h-4 text-zinc-800 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{contextMessage}</span>
              </div>
            )}

            {/* Error Message Alert */}
            {error && (
              <div className="mb-4 bg-rose-50 border border-rose-200/80 p-3 rounded-xl flex items-start gap-2.5 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <p className="font-medium leading-relaxed">{error}</p>
              </div>
            )}

            {/* =================================================================== */}
            {/* VIEW 1: SIGN IN                                                    */}
            {/* =================================================================== */}
            {mode === 'signin' && (
              <form onSubmit={handleSignInSubmit} className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-zinc-950 tracking-tight">
                    Welcome back
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Sign in to access downloads, bookmarks, and materials.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={signInEmail}
                      onChange={(e) => {
                        setSignInEmail(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="name@example.com"
                      className="w-full px-3.5 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-colors"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-zinc-700">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setMode('forgot-password')}
                        className="text-[11px] text-zinc-500 hover:text-zinc-950 transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showSignInPassword ? 'text' : 'password'}
                        required
                        value={signInPassword}
                        onChange={(e) => {
                          setSignInPassword(e.target.value);
                          if (error) setError('');
                        }}
                        placeholder="••••••••"
                        className="w-full pl-3.5 pr-9 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignInPassword(!showSignInPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-700 transition-colors"
                        tabIndex={-1}
                      >
                        {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex justify-center items-center gap-2 py-2.5 px-4 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium rounded-xl transition-colors shadow-sm disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Spinner size="sm" />
                        <span>Signing In...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>

                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-200"></div>
                  </div>
                  <div className="relative flex justify-center text-[11px]">
                    <span className="bg-white px-2 text-zinc-500">Or continue with</span>
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full inline-flex justify-center items-center gap-2 py-2.5 px-4 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-900 text-xs font-medium rounded-xl transition-colors shadow-sm disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span>Google</span>
                  </button>
                </div>

                <div className="pt-2 text-center">
                  <p className="text-xs text-zinc-500">
                    Don&apos;t have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('signup')}
                      className="font-medium text-zinc-950 hover:underline"
                    >
                      Create one for free
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* =================================================================== */}
            {/* VIEW 2: CREATE STUDENT ACCOUNT                                      */}
            {/* =================================================================== */}
            {mode === 'signup' && (
              <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
                <div>
                  <h3 className="text-xl font-semibold text-zinc-950 tracking-tight">
                    Create student account
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Join Maharashtra&apos;s open academic archive.
                  </p>
                </div>

                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={signUpData.name}
                      onChange={(e) => {
                        setSignUpData({ ...signUpData, name: e.target.value });
                        if (error) setError('');
                      }}
                      placeholder="e.g. Ram Sharma"
                      className="w-full px-3.5 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={signUpData.email}
                      onChange={(e) => {
                        setSignUpData({ ...signUpData, email: e.target.value });
                        if (error) setError('');
                      }}
                      placeholder="name@example.com"
                      className="w-full px-3.5 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      University (Maharashtra)
                    </label>
                    <SearchableSelect
                      value={signUpData.university}
                      onChange={(val) => setSignUpData({ ...signUpData, university: val })}
                      groups={UNIVERSITY_SELECT_GROUPS}
                      placeholder="Select University"
                      allOptionLabel="Select University"
                      searchPlaceholder="Search university..."
                      clearable
                      buttonClassName="py-2 text-xs bg-white text-zinc-800"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1">
                        Branch
                      </label>
                      <SearchableSelect
                        value={signUpData.branch}
                        onChange={(val) => setSignUpData({ ...signUpData, branch: val })}
                        groups={BRANCH_SELECT_GROUPS}
                        placeholder="Select Branch"
                        allOptionLabel="Select Branch"
                        searchPlaceholder="Search branch..."
                        clearable
                        buttonClassName="py-2 text-xs bg-white text-zinc-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1">
                        Year of Study
                      </label>
                      <select
                        value={signUpData.studyingYear}
                        onChange={(e) => setSignUpData({ ...signUpData, studyingYear: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                      >
                        <option value="">Select Year</option>
                        {ACADEMIC_YEARS.map((y) => (
                          <option key={y.value} value={y.value}>{y.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showSignUpPassword ? 'text' : 'password'}
                          required
                          value={signUpData.password}
                          onChange={(e) => {
                            setSignUpData({ ...signUpData, password: e.target.value });
                            if (error) setError('');
                          }}
                          placeholder="Min 6 chars"
                          className="w-full pl-3 pr-8 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                          className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-zinc-400 hover:text-zinc-700"
                          tabIndex={-1}
                        >
                          {showSignUpPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1">
                        Confirm Password
                      </label>
                      <input
                        type={showSignUpPassword ? 'text' : 'password'}
                        required
                        value={signUpData.confirmPassword}
                        onChange={(e) => {
                          setSignUpData({ ...signUpData, confirmPassword: e.target.value });
                          if (error) setError('');
                        }}
                        placeholder="Re-enter password"
                        className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex justify-center items-center gap-2 py-2.5 px-4 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium rounded-xl transition-colors shadow-sm disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Spinner size="sm" />
                        <span>Creating Profile...</span>
                      </>
                    ) : (
                      <>
                        <span>Create Student Account</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>

                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-200"></div>
                  </div>
                  <div className="relative flex justify-center text-[11px]">
                    <span className="bg-white px-2 text-zinc-500">Or continue with</span>
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full inline-flex justify-center items-center gap-2 py-2.5 px-4 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-900 text-xs font-medium rounded-xl transition-colors shadow-sm disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span>Google</span>
                  </button>
                </div>

                <div className="pt-1 text-center">
                  <p className="text-xs text-zinc-500">
                    Already registered?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('signin')}
                      className="font-medium text-zinc-950 hover:underline"
                    >
                      Sign in
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* =================================================================== */}
            {/* VIEW 3: FORGOT PASSWORD                                             */}
            {/* =================================================================== */}
            {mode === 'forgot-password' && (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-zinc-950 tracking-tight">
                    Reset your password
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    We&apos;ll send password recovery instructions to your email.
                  </p>
                </div>

                {forgotSent ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-3">
                    <div className="flex items-center gap-2 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Recovery Email Dispatched</span>
                    </div>
                    <p className="text-emerald-700 leading-relaxed">
                      Check your inbox at <strong className="text-emerald-950">{forgotEmail}</strong> for the password reset link.
                    </p>
                    <button
                      type="button"
                      onClick={() => setMode('signin')}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-xl transition-colors"
                    >
                      Back to Sign In
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 pt-1">
                      <label className="block text-xs font-medium text-zinc-700">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full px-3.5 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full inline-flex justify-center items-center gap-2 py-2.5 px-4 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium rounded-xl transition-colors shadow-sm disabled:opacity-50"
                      >
                        {loading ? (
                          <>
                            <Spinner size="sm" />
                            <span>Sending Link...</span>
                          </>
                        ) : (
                          <>
                            <span>Send Recovery Link</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </form>
            )}

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

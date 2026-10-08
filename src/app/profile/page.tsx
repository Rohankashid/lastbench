'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion } from 'framer-motion';
import { BackgroundGrid } from '@/components/ui/BackgroundGrid';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useBookmarks } from '@/context/BookmarkContext';
import { 
  UNIVERSITY_SELECT_GROUPS, 
  BRANCH_SELECT_GROUPS, 
  ACADEMIC_YEARS 
} from '@/lib/constants/academic';
import {
  User,
  Mail,
  Building2,
  GraduationCap,
  School,
  Calendar,
  Shield,
  Bookmark,
  Pencil,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  X,
  LogOut,
  Upload,
  BookOpen,
  FileText,
  } from 'lucide-react';

interface ProfileData {
  name: string;
  email: string;
  college: string;
  university: string;
  branch: string;
  studyingYear: string;
  role: string;
}

export default function ProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { bookmarks } = useBookmarks();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    email: '',
    college: '',
    university: '',
    branch: '',
    studyingYear: '',
    role: '',
  });

  const fetchProfile = useCallback(async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user!.uid));
      
      if (!userDoc.exists()) {
        setError('Profile record not found in system.');
        return;
      }

      const data = userDoc.data();
      setProfileData({
        name: data.name || '',
        email: data.email || user?.email || '',
        college: data.college || '',
        university: data.university || '',
        branch: data.branch || '',
        studyingYear: data.studyingYear || '',
        role: data.role || 'student',
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/?auth=login&redirect=%2Fprofile');
      return;
    }
    fetchProfile();
  }, [user, authLoading, router, fetchProfile]);

  const handleEdit = () => {
    setError('');
    setSuccessMessage('');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError('');
    fetchProfile();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      await updateDoc(doc(db, 'users', user!.uid), {
        name: profileData.name.trim(),
        college: profileData.college.trim(),
        university: profileData.university,
        branch: profileData.branch,
        studyingYear: profileData.studyingYear,
        updatedAt: new Date().toISOString(),
      });

      setIsEditing(false);
      setSuccessMessage('Profile details updated successfully.');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to save profile changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch {
      setError('Failed to sign out');
    }
  };

  const initials = profileData.name.trim()
    ? profileData.name
        .trim()
        .split(/\s+/)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : (user?.email ? user.email.slice(0, 2).toUpperCase() : 'ST');

  const currentYearObj = ACADEMIC_YEARS.find((y) => y.value === profileData.studyingYear);
  const formattedYear = currentYearObj ? currentYearObj.label : profileData.studyingYear ? `Year ${profileData.studyingYear}` : 'Not set';

  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-zinc-200 border-t-zinc-950 rounded-full animate-spin" />
        <p className="text-xs text-zinc-500 font-mono tracking-wide">Loading student profile...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-64px)] pb-16">
      <BackgroundGrid variant="grid" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Navigation Breadcrumb & Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
              <Link
                href="/"
                className="inline-flex items-center gap-1 hover:text-zinc-950 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
              </Link>
              <span>/</span>
              <span className="text-zinc-900 font-medium">Profile & Settings</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
              Student Profile & Curriculum
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 max-w-2xl leading-relaxed">
              Manage your academic affiliation, engineering branch, and curriculum preferences to personalize study material feeds.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {!isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleEdit}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg text-xs font-medium transition-colors shadow-2xs cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit Profile
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-zinc-50 text-zinc-700 hover:text-rose-600 border border-zinc-200 rounded-lg text-xs font-medium transition-colors shadow-2xs cursor-pointer"
                  title="Sign out of your session"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 rounded-lg text-xs font-medium transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const form = document.getElementById('profile-edit-form') as HTMLFormElement;
                    if (form) form.requestSubmit();
                  }}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg text-xs font-medium transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Spinner size="sm" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Save Changes
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Status Alerts */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2.5 p-3.5 rounded-lg bg-rose-50 border border-rose-200/80 text-xs font-medium text-rose-800"
          >
            <X className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2.5 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200/80 text-xs font-medium text-emerald-800"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </motion.div>
        )}

        {/* Dashboard 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Identity, Quick Metrics & Quick Actions (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Identity Card */}
            <div className="bg-white rounded-xl border border-zinc-200/90 shadow-2xs overflow-hidden">
              <div className="h-16 bg-gradient-to-r from-zinc-100 via-zinc-200/60 to-zinc-100 border-b border-zinc-200/70" />
              <div className="px-5 pb-5 -mt-8">
                <div className="w-16 h-16 rounded-2xl bg-zinc-950 text-white font-mono text-xl font-bold flex items-center justify-center border-2 border-white shadow-xs mb-3">
                  {initials}
                </div>

                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-zinc-950 tracking-tight leading-snug">
                    {profileData.name || 'Anonymous Student'}
                  </h2>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono break-all">
                    <Mail className="w-3 h-3 text-zinc-400 shrink-0" />
                    <span>{profileData.email}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 mt-3.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono uppercase font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200/80">
                    <Shield className="w-3 h-3 text-zinc-700" />
                    {profileData.role === 'admin' ? 'System Administrator' : 'Engineering Student'}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono uppercase font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Active Account
                  </span>
                </div>

                <div className="mt-5 pt-4 border-t border-zinc-100 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 font-medium">University</span>
                    <span className="text-zinc-900 font-semibold text-right max-w-[180px] truncate" title={profileData.university}>
                      {profileData.university || 'Not set'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 font-medium">Branch</span>
                    <span className="text-zinc-900 font-semibold text-right max-w-[180px] truncate" title={profileData.branch}>
                      {profileData.branch || 'Not set'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 font-medium">Year</span>
                    <span className="text-zinc-900 font-semibold text-right">
                      {formattedYear}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Saved Materials Quick Stat Card */}
            <div className="bg-white rounded-xl border border-zinc-200/90 shadow-2xs p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
                    Saved Materials
                  </span>
                  <div className="text-2xl font-bold tracking-tight text-zinc-950 font-mono">
                    {bookmarks.length}
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Course documents bookmarked for quick revision.
                  </p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700 shrink-0 border border-zinc-200/80">
                  <Bookmark className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-4 pt-3.5 border-t border-zinc-100">
                <Link
                  href="/?tab=saved"
                  className="inline-flex items-center justify-between w-full text-xs font-medium text-zinc-900 hover:text-zinc-600 transition-colors group"
                >
                  <span>Open Saved Documents in Dashboard</span>
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Quick Desk Links */}
            <div className="bg-white rounded-xl border border-zinc-200/90 shadow-2xs p-5 space-y-3">
              <h3 className="text-xs font-mono uppercase font-semibold text-zinc-500 tracking-wider">
                Quick Shortcuts
              </h3>
              <div className="space-y-1.5">
                <Link
                  href="/upload"
                  className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/80 transition-colors text-xs font-medium text-zinc-800 group"
                >
                  <div className="flex items-center gap-2.5">
                    <Upload className="w-4 h-4 text-zinc-500 group-hover:text-zinc-950" />
                    <span>Upload & Share Study Material</span>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700" />
                </Link>

                <Link
                  href="/notes"
                  className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/80 transition-colors text-xs font-medium text-zinc-800 group"
                >
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="w-4 h-4 text-zinc-500 group-hover:text-zinc-950" />
                    <span>Browse Engineering Notes</span>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700" />
                </Link>

                <Link
                  href="/pyqs"
                  className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/80 transition-colors text-xs font-medium text-zinc-800 group"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-zinc-500 group-hover:text-zinc-950" />
                    <span>Past Question Papers (PYQs)</span>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700" />
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Academic Affiliations & Curriculum Details (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Main Academic Affiliation Card */}
            <div className="bg-white rounded-xl border border-zinc-200/90 shadow-2xs overflow-hidden">
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-zinc-950 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-zinc-900" />
                    Academic Affiliation & Details
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Your university and branch are automatically used to prioritize syllabus-specific notes and past papers.
                  </p>
                </div>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:text-zinc-950 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                )}
              </div>

              <div className="p-6">
                {isEditing ? (
                  <form id="profile-edit-form" onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* Full Name */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-zinc-700">
                          Full Name <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={profileData.name}
                            onChange={(e) =>
                              setProfileData((prev) => ({ ...prev, name: e.target.value }))
                            }
                            placeholder="e.g. Rohan Kashid"
                            required
                            className="w-full px-3.5 py-2.5 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 transition-colors shadow-2xs font-sans"
                          />
                        </div>
                      </div>

                      {/* Email Address (Read-only) */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-zinc-700">
                          Account Email
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            value={profileData.email}
                            disabled
                            className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-500 font-mono cursor-not-allowed shadow-2xs"
                          />
                        </div>
                        <span className="text-[10px] text-zinc-400">
                          Linked with your authenticated login account.
                        </span>
                      </div>

                      {/* University Selection */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-zinc-700">
                          University / Institute Board <span className="text-rose-500">*</span>
                        </label>
                        <SearchableSelect
                          value={profileData.university}
                          onChange={(val) =>
                            setProfileData((prev) => ({ ...prev, university: val }))
                          }
                          groups={UNIVERSITY_SELECT_GROUPS}
                          placeholder="Select your university"
                          searchPlaceholder="Search university or board..."
                          buttonClassName="px-3.5 py-2.5 rounded-lg border-zinc-200 bg-white text-xs font-sans shadow-2xs"
                          required
                        />
                      </div>

                      {/* Engineering Branch */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-zinc-700">
                          Engineering Branch / Discipline <span className="text-rose-500">*</span>
                        </label>
                        <SearchableSelect
                          value={profileData.branch}
                          onChange={(val) =>
                            setProfileData((prev) => ({ ...prev, branch: val }))
                          }
                          groups={BRANCH_SELECT_GROUPS}
                          placeholder="Select your engineering branch"
                          searchPlaceholder="Search branch or department..."
                          buttonClassName="px-3.5 py-2.5 rounded-lg border-zinc-200 bg-white text-xs font-sans shadow-2xs"
                          required
                        />
                      </div>

                      {/* College / Institution Name */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-zinc-700">
                          College / Campus Name
                        </label>
                        <input
                          type="text"
                          value={profileData.college}
                          onChange={(e) =>
                            setProfileData((prev) => ({ ...prev, college: e.target.value }))
                          }
                          placeholder="e.g. Pune Institute of Computer Technology (PICT)"
                          className="w-full px-3.5 py-2.5 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 transition-colors shadow-2xs font-sans"
                        />
                      </div>

                      {/* Studying Year */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-zinc-700">
                          Current Academic Year <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={profileData.studyingYear}
                          onChange={(e) =>
                            setProfileData((prev) => ({ ...prev, studyingYear: e.target.value }))
                          }
                          required
                          className="w-full px-3.5 py-2.5 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 transition-colors shadow-2xs font-sans cursor-pointer"
                        >
                          <option value="">Select studying year</option>
                          {ACADEMIC_YEARS.map((yr) => (
                            <option key={yr.value} value={yr.value}>
                              {yr.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-5 border-t border-zinc-100">
                      <button
                        type="button"
                        onClick={handleCancel}
                        disabled={saving}
                        className="px-4 py-2 text-xs font-medium text-zinc-700 hover:text-zinc-900 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg text-xs font-medium transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                      >
                        {saving ? (
                          <>
                            <Spinner size="sm" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Save Profile</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Tile 1: Full Name */}
                    <div className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/50 space-y-1">
                      <div className="flex items-center gap-2 text-zinc-500 text-xs font-medium">
                        <User className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Full Name</span>
                      </div>
                      <p className="text-sm font-semibold text-zinc-950 pt-0.5">
                        {profileData.name || 'Not provided'}
                      </p>
                    </div>

                    {/* Tile 2: Account Email */}
                    <div className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/50 space-y-1">
                      <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Account Email</span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 font-semibold">
                          VERIFIED
                        </span>
                      </div>
                      <p className="text-sm font-medium font-mono text-zinc-900 pt-0.5 truncate" title={profileData.email}>
                        {profileData.email || 'Not connected'}
                      </p>
                    </div>

                    {/* Tile 3: University */}
                    <div className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/50 space-y-1">
                      <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                          <span>University / Board</span>
                        </div>
                        {profileData.university && (
                          <span className="text-[10px] font-mono text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200/60">
                            AFFILIATED
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-zinc-950 pt-0.5">
                        {profileData.university || (
                          <span className="text-zinc-400 font-normal">Not configured</span>
                        )}
                      </p>
                    </div>

                    {/* Tile 4: Engineering Branch */}
                    <div className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/50 space-y-1">
                      <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Engineering Branch</span>
                        </div>
                        {profileData.branch && (
                          <span className="text-[10px] font-mono text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200/60">
                            SYLLABUS
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-zinc-950 pt-0.5">
                        {profileData.branch || (
                          <span className="text-zinc-400 font-normal">Not configured</span>
                        )}
                      </p>
                    </div>

                    {/* Tile 5: College / Campus */}
                    <div className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/50 space-y-1">
                      <div className="flex items-center gap-2 text-zinc-500 text-xs font-medium">
                        <School className="w-3.5 h-3.5 text-zinc-400" />
                        <span>College / Institution</span>
                      </div>
                      <p className="text-sm font-medium text-zinc-900 pt-0.5">
                        {profileData.college || (
                          <span className="text-zinc-400 font-normal">Not specified</span>
                        )}
                      </p>
                    </div>

                    {/* Tile 6: Academic Year */}
                    <div className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/50 space-y-1">
                      <div className="flex items-center gap-2 text-zinc-500 text-xs font-medium">
                        <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Studying Year</span>
                      </div>
                      <p className="text-sm font-semibold text-zinc-950 pt-0.5">
                        {formattedYear}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Educational Material Exchange Disclaimer & Privacy Card */}
            <div className="p-5 rounded-xl border border-zinc-200 bg-white shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono uppercase font-semibold text-zinc-500 tracking-wider">
                  Open Educational Exchange Guidelines
                </h3>
                <span className="text-[10px] font-mono text-zinc-400 uppercase">
                  Community Policy
                </span>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">
                LastBench operates as a peer-to-peer open academic study repository. All notes, presentations, and past exam question papers shared on this platform are user-contributed study aids intended solely for non-commercial educational reference under fair use guidelines.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
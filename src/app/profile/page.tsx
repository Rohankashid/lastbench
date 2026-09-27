'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CheckCircleIcon, PencilIcon, XCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { BackgroundGrid } from '@/components/ui/BackgroundGrid';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { 
  UNIVERSITY_SELECT_GROUPS, 
  BRANCH_SELECT_GROUPS, 
  ACADEMIC_YEARS 
} from '@/lib/constants/academic';

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
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
        setError('Profile not found');
        return;
      }

      const data = userDoc.data();
      setProfileData({
        name: data.name || '',
        email: data.email || '',
        college: data.college || '',
        university: data.university || '',
        branch: data.branch || '',
        studyingYear: data.studyingYear || '',
        role: data.role || 'student',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      router.replace('/?auth=login&redirect=%2Fprofile');
      return;
    }
    fetchProfile();
  }, [user, router, fetchProfile]);

  const handleEdit = () => setIsEditing(true);

  const handleCancel = () => {
    setIsEditing(false);
    fetchProfile();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await updateDoc(doc(db, 'users', user!.uid), {
        name: profileData.name,
        college: profileData.college,
        university: profileData.university,
        branch: profileData.branch,
        studyingYear: profileData.studyingYear,
        updatedAt: new Date().toISOString(),
      });

      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-zinc-200 border-t-zinc-950 rounded-full animate-spin" />
        <p className="text-xs text-zinc-500 font-mono">Loading student profile...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative min-h-[calc(100vh-64px)] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center"
    >
      <BackgroundGrid variant="grid" />
      <div className="w-full max-w-xl relative z-10">
        <motion.div 
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl border border-zinc-200/90 p-8 shadow-[0_1px_3px_rgba(0,0,0,0.03)] relative overflow-hidden"
        >
          {error && (
            <div className="mb-6 bg-rose-50 border border-rose-200/80 p-3 rounded-lg text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          <button
            onClick={() => router.push('/')}
            className="absolute top-6 left-6 p-2 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors focus:outline-none"
            aria-label="Back to Home"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </button>
          
          <div className="flex flex-col items-center w-full mb-8 mt-2">
            <div className="w-20 h-20 rounded-full bg-zinc-950 text-white font-mono text-xl font-bold flex items-center justify-center shadow-sm mb-4">
              {profileData.name ? profileData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) : '?'}
            </div>
            <h2 className="text-2xl font-semibold text-zinc-950 tracking-tight mb-0.5">{profileData.name}</h2>
            <div className="text-xs text-zinc-500 font-mono mb-3">{profileData.email}</div>
            
            <span className="mono-chip mb-4">
              {profileData.role === 'admin' ? 'SYSTEM ADMINISTRATOR' : 'VERIFIED STUDENT'}
            </span>
            
            {!isEditing && (
              <button
                onClick={handleEdit}
                className="flex items-center gap-1.5 px-4 py-2 bg-zinc-950 text-white rounded-lg hover:bg-zinc-800 transition-colors text-xs font-medium shadow-sm"
              >
                <PencilIcon className="h-3.5 w-3.5" /> Edit Profile
              </button>
            )}
          </div>

          <div className="w-full">
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-6 bg-white/50 p-6 rounded-2xl border border-white/60 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      className="block w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={profileData.email}
                      disabled
                      className="block w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">College</label>
                    <input
                      type="text"
                      value={profileData.college}
                      onChange={(e) => setProfileData(prev => ({ ...prev, college: e.target.value }))}
                      className="block w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">University</label>
                    <SearchableSelect
                      value={profileData.university}
                      onChange={(val) => setProfileData(prev => ({ ...prev, university: val }))}
                      groups={UNIVERSITY_SELECT_GROUPS}
                      placeholder="Select University"
                      searchPlaceholder="Search university or institute..."
                      buttonClassName="px-4 py-3 rounded-xl border-slate-200 bg-white text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Engineering Branch</label>
                    <SearchableSelect
                      value={profileData.branch}
                      onChange={(val) => setProfileData(prev => ({ ...prev, branch: val }))}
                      groups={BRANCH_SELECT_GROUPS}
                      placeholder="Select Engineering Branch"
                      searchPlaceholder="Search branch..."
                      buttonClassName="px-4 py-3 rounded-xl border-slate-200 bg-white text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Studying Year</label>
                    <select
                      value={profileData.studyingYear}
                      onChange={(e) => setProfileData(prev => ({ ...prev, studyingYear: e.target.value }))}
                      className="block w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow text-sm"
                      required
                    >
                      <option value="">Select Year</option>
                      {ACADEMIC_YEARS.map((yr) => (
                        <option key={yr.value} value={yr.value}>{yr.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Role</label>
                    <input
                      type="text"
                      value={profileData.role}
                      disabled
                      className="block w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed capitalize"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/60 mt-6">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="inline-flex items-center px-6 py-2.5 font-semibold rounded-xl text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
                  >
                    <XCircleIcon className="h-5 w-5 mr-2" /> Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center px-6 py-2.5 font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                       <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                    ) : (
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                    )}
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 bg-white/40 rounded-2xl p-8 border border-white/60 shadow-sm">
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name</div>
                  <div className="text-lg text-slate-900 font-semibold mb-6">{profileData.name}</div>
                  
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">College</div>
                  <div className="text-lg text-slate-900 font-medium mb-6">{profileData.college || '-'}</div>
                  
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Studying Year</div>
                  <div className="text-lg text-slate-900 font-medium mb-6">
                    {profileData.studyingYear ? (ACADEMIC_YEARS.find(y => y.value === profileData.studyingYear)?.label || `Year ${profileData.studyingYear}`) : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address</div>
                  <div className="text-lg text-slate-900 font-medium mb-6">{profileData.email}</div>
                  
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">University</div>
                  <div className="text-lg text-slate-900 font-medium mb-6">{profileData.university || '-'}</div>

                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Engineering Branch</div>
                  <div className="text-lg text-slate-900 font-medium mb-6">{profileData.branch || '-'}</div>
                  
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Role</div>
                  <div className="text-lg text-slate-900 font-medium mb-6 capitalize">{profileData.role}</div>
                </div>
              </div>
            )}
          </div>

          <div className="w-full flex justify-end mt-8 pt-6 border-t border-zinc-100">
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-xs font-medium rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 transition-colors"
            >
              Sign Out Account
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CheckCircleIcon, PencilIcon, XCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

interface ProfileData {
  name: string;
  email: string;
  college: string;
  university: string;
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
      router.push('/login');
      return;
    }

    fetchProfile();
  }, [user, router, fetchProfile]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    fetchProfile(); // Reset form data
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
      router.push('/login');
    } catch {
      setError('Failed to sign out');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center">
            <div className="flex justify-center">
              <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-gray-900">Loading your profile...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow-2xl rounded-2xl p-8 sm:p-10 flex flex-col items-center relative">
          {/* Back Button */}
          <button
            onClick={() => router.push('/')}
            className="absolute top-4 left-4 p-2 rounded-full hover:bg-gray-100 focus:outline-none"
            aria-label="Back to Home"
          >
            <ArrowLeftIcon className="h-6 w-6 text-gray-500" />
          </button>
          {/* Avatar and Basic Info */}
          <div className="flex flex-col items-center w-full mb-8">
            <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-4xl font-bold text-blue-600 mb-4">
              {profileData.name ? profileData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) : '?'}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{profileData.name}</h2>
            <div className="text-gray-500 text-sm mb-1">{profileData.email}</div>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
              {profileData.role === 'admin' ? 'Admin' : 'Student'}
            </span>
            {!isEditing && (
              <button
                onClick={handleEdit}
                className="mt-2 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <PencilIcon className="h-5 w-5" /> Edit Profile
              </button>
            )}
          </div>

          {/* Profile Form */}
          <div className="w-full">
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={profileData.email}
                      disabled
                      className="block w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="college" className="block text-sm font-medium text-gray-700 mb-1">College</label>
                    <input
                      type="text"
                      name="college"
                      id="college"
                      value={profileData.college}
                      onChange={(e) => setProfileData(prev => ({ ...prev, college: e.target.value }))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="university" className="block text-sm font-medium text-gray-700 mb-1">University</label>
                    <input
                      type="text"
                      name="university"
                      id="university"
                      value={profileData.university}
                      onChange={(e) => setProfileData(prev => ({ ...prev, university: e.target.value }))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="studyingYear" className="block text-sm font-medium text-gray-700 mb-1">Studying Year</label>
                    <select
                      id="studyingYear"
                      name="studyingYear"
                      value={profileData.studyingYear}
                      onChange={(e) => setProfileData(prev => ({ ...prev, studyingYear: e.target.value }))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    >
                      <option value="">Select Year</option>
                      <option value="1">First Year</option>
                      <option value="2">Second Year</option>
                      <option value="3">Third Year</option>
                      <option value="4">Fourth Year</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <input
                      type="text"
                      name="role"
                      id="role"
                      value={profileData.role}
                      disabled
                      className="block w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500 sm:text-sm"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                  >
                    <XCircleIcon className="h-5 w-5 mr-2 text-gray-500" /> Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 transition-colors duration-200"
                  >
                    {loading ? (
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <CheckCircleIcon className="h-5 w-5 mr-2 text-white" />
                    )}
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Full Name</div>
                  <div className="text-lg text-gray-900 font-semibold mb-4">{profileData.name}</div>
                  <div className="text-sm font-medium text-gray-700 mb-1">College</div>
                  <div className="text-gray-900 mb-4">{profileData.college}</div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Studying Year</div>
                  <div className="text-gray-900 mb-4">
                    {profileData.studyingYear ? `${profileData.studyingYear} Year` : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Email Address</div>
                  <div className="text-gray-900 mb-4">{profileData.email}</div>
                  <div className="text-sm font-medium text-gray-700 mb-1">University</div>
                  <div className="text-gray-900 mb-4">{profileData.university}</div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Role</div>
                  <div className="text-gray-900 mb-4 capitalize">{profileData.role}</div>
                </div>
              </div>
            )}
          </div>

          {/* Add Sign Out button at the bottom of the profile card */}
          <div className="w-full flex justify-end mt-8">
            <button
              onClick={handleSignOut}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
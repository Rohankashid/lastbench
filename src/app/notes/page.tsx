'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import SkeletonCard from '@/components/SkeletonCard';

interface Note {
  id: string;
  title: string;
  description: string;
  subject: string;
  semester: string;
  university: string;
  year: string;
  downloadUrl: string;
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: string;
}

export default function NotesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [filters, setFilters] = useState({
    semester: '',
    branch: '',
    university: '',
  });

  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const [debouncedUniversity, setDebouncedUniversity] = useState(filters.university);

  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      setDebouncedUniversity(filters.university);
    }, 400);
  }, [filters.university]);

  const checkAdminStatus = useCallback(async () => {
    if (!user) return false;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.role === 'admin';
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
    return false;
  }, [user]);

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      let q = query(
        collection(db, 'materials'),
        where('category', '==', 'note'),
        orderBy('uploadedAt', 'desc')
      );
      if (filters.semester) {
        q = query(q, where('semester', '==', filters.semester));
      }
      if (filters.branch) {
        q = query(q, where('branch', '==', filters.branch));
      }
      // Do NOT filter university in Firestore
      const querySnapshot = await getDocs(q);
      let notesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Note[];
      // Client-side, case-insensitive, partial match for university
      if (debouncedUniversity) {
        notesData = notesData.filter(note =>
          note.university && note.university.toLowerCase().includes(debouncedUniversity.toLowerCase())
        );
      }
      setNotes(notesData);
    } catch (error) {
      console.error('Error fetching notes:', error);
      setError('Failed to fetch notes. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [filters.semester, filters.branch, debouncedUniversity]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    const initializePage = async () => {
      const adminStatus = await checkAdminStatus();
      setIsAdmin(adminStatus);
      await fetchNotes();
    };
    
    initializePage();
  }, [user, router, fetchNotes, checkAdminStatus]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      semester: '',
      branch: '',
      university: '',
    });
  };

  const handleDelete = async (note: Note) => {
    setError('');
    if (!window.confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      console.log('Deleting note:', note.title, 'URL:', note.fileUrl, 'ID:', note.id);

      // Check if this is an S3 URL or Firebase Storage URL
      if (note.fileUrl && (note.fileUrl.includes('s3.amazonaws.com') || note.fileUrl.includes('s3.'))) {
        // This is an S3 URL - delete from S3
        try {
          console.log('S3 URL detected, deleting from S3');
          const response = await fetch('/api/delete', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ fileUrl: note.fileUrl }),
          });
          
          const result = await response.json();
          console.log('S3 deletion result:', result);
          
          if (!response.ok) {
            console.error('S3 deletion failed:', result);
            throw new Error('S3 deletion failed');
          }
          
          console.log('S3 file deleted successfully');
        } catch (s3Error) {
          console.error('S3 delete failed:', s3Error);
          throw new Error('Failed to delete file from S3');
        }
      } else if (note.fileUrl && note.fileUrl.includes('firebasestorage.googleapis.com')) {
        // This is a Firebase Storage URL - delete from Firebase Storage
        try {
          console.log('Firebase Storage URL detected, deleting from Firebase Storage');
          const firebaseUrl = new URL(note.fileUrl);
          const pathMatch = firebaseUrl.pathname.match(/\/o\/(.+?)\?/);
          const filePath = pathMatch ? decodeURIComponent(pathMatch[1]) : null;
          
          if (filePath) {
            console.log('Firebase Storage path:', filePath);
            const fileRef = ref(storage, filePath);
            await deleteObject(fileRef);
            console.log('Firebase Storage file deleted successfully');
          } else {
            console.warn('Could not extract Firebase Storage path from URL');
            throw new Error('Could not extract Firebase Storage path');
          }
        } catch (storageError) {
          console.error('Firebase Storage delete failed:', storageError);
          throw new Error('Failed to delete file from Firebase Storage');
        }
      } else {
        console.warn('Unknown URL format, skipping file deletion');
        console.log('URL that was not recognized:', note.fileUrl);
      }

      // Delete from Firestore
      try {
        console.log('Attempting to delete Firestore doc with id:', note.id);
        await deleteDoc(doc(db, 'materials', note.id));
        console.log('Firestore document deleted successfully for id:', note.id);
      } catch (firestoreError) {
        console.error('Error deleting Firestore document:', firestoreError, 'for id:', note.id);
        throw new Error('Failed to delete Firestore document');
      }
      
      // Update local state
      setNotes(prevNotes => {
        const updatedNotes = prevNotes.filter(n => n.id !== note.id);
        console.log('Updated notes state after deletion:', updatedNotes);
        return updatedNotes;
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      setError('Failed to delete note: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900">Loading...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Study Notes
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Access comprehensive study materials for your courses
          </p>
        </div>

        {/* Filters */}
        <div className="mt-12 bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <form className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div>
                  <label htmlFor="semester" className="block text-sm font-medium text-gray-700">
                    Semester
                  </label>
                  <select
                    id="semester"
                    name="semester"
                    value={filters.semester}
                    onChange={handleFilterChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="">All Semesters</option>
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                    <option value="3">Semester 3</option>
                    <option value="4">Semester 4</option>
                    <option value="5">Semester 5</option>
                    <option value="6">Semester 6</option>
                    <option value="7">Semester 7</option>
                    <option value="8">Semester 8</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="branch" className="block text-sm font-medium text-gray-700">
                    Branch
                  </label>
                  <select
                    id="branch"
                    name="branch"
                    value={filters.branch}
                    onChange={handleFilterChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="">All Branches</option>
                    <option value="First Year">First Year</option>
                    <option value="Computer Engineering / Computer Science and Engineering (CSE)">Computer Engineering / Computer Science and Engineering (CSE)</option>
                    <option value="Information Technology (IT)">Information Technology (IT)</option>
                    <option value="Electronics and Telecommunication (ENTC / E&TC)">Electronics and Telecommunication (ENTC / E&TC)</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Electronics Engineering">Electronics Engineering</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="university" className="block text-sm font-medium text-gray-700">
                    University
                  </label>
                  <input
                    type="text"
                    name="university"
                    id="university"
                    value={filters.university}
                    onChange={handleFilterChange}
                    placeholder="Enter university name"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  Reset Filters
                </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Notes List */}
        <div className="mt-12">
          {error ? (
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
          ) : notes.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No study notes found</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by uploading a new study note.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
                : notes.map((note) => (
                    <div
                      key={note.id}
                      className="block"
                    >
                      <div className="bg-white overflow-hidden shadow-lg rounded-lg hover:shadow-xl transition-shadow duration-300">
                        <div className="p-4">
                          <div className="flex items-center justify-between">
                            <h3
                              className="text-base font-semibold text-blue-700 hover:underline underline-offset-4 transition-all duration-200 cursor-pointer"
                              onClick={e => { e.stopPropagation(); router.push(`/notes/${note.id}`); }}
                              tabIndex={0}
                              role="button"
                              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); router.push(`/notes/${note.id}`); } }}
                            >
                              {note.title}
                            </h3>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {note.subject}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-gray-500 line-clamp-2">{note.description}</p>
                          <div className="mt-4 space-y-2">
                            <div className="flex items-center text-sm text-gray-500">
                              <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                              </svg>
                              Semester {note.semester}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0h8v12H6V4z" clipRule="evenodd" />
                              </svg>
                              {note.university}
                            </div>
                          </div>
                          <div className="mt-6 flex items-center space-x-2">
                            <button
                              className="group flex items-center gap-1 px-2.5 py-1 text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-full shadow hover:scale-105 hover:from-blue-700 hover:to-blue-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                              onClick={e => { e.stopPropagation(); router.push(`/notes/${note.id}`); }}
                            >
                              View
                              <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                            <a
                              href={note.fileUrl}
                              download
                              // target="_blank"
                              rel="noopener noreferrer"
                              className="group flex items-center gap-1 px-2.5 py-1 text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-full shadow hover:scale-105 hover:from-blue-700 hover:to-blue-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                              onClick={e => e.stopPropagation()}
                            >
                              Download
                              <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </a>
                            {isAdmin && (
                              <button
                                onClick={e => { e.stopPropagation(); handleDelete(note); }}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              >
                                <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
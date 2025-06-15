'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';

export default function UploadPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    year: '',
    university: '',
    semester: '',
    subject: '',
    category: 'note', // 'note' or 'pyq'
    file: null as File | null,
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const checkAdminStatus = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (!userDoc.exists()) {
          setError('User profile not found');
          return;
        }

        const userData = userDoc.data();
        const isAdmin = userData.role === 'admin';
        
        if (!isAdmin) {
          router.push('/');
          return;
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setError('Failed to verify admin status');
      }
    };

    checkAdminStatus();
  }, [user, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({
        ...prev,
        file: e.target.files![0]
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // Upload file to Firebase Storage
      const fileRef = ref(storage, `${formData.category}s/${formData.file.name}`);
      await uploadBytes(fileRef, formData.file);
      const downloadURL = await getDownloadURL(fileRef);

      // Add document to Firestore
      await addDoc(collection(db, 'materials'), {
        name: formData.name,
        year: formData.year,
        university: formData.university,
        semester: formData.semester,
        subject: formData.subject,
        category: formData.category,
        fileUrl: downloadURL,
        uploadedBy: user?.email,
        uploadedAt: new Date().toISOString(),
      });

      // Reset form
      setFormData({
        name: '',
        year: '',
        university: '',
        semester: '',
        subject: '',
        category: 'note',
        file: null,
      });

      alert('Material uploaded successfully!');
    } catch (error) {
      console.error('Error uploading material:', error);
      setError('Failed to upload material');
    } finally {
      setUploading(false);
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-red-600">{error}</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Upload Study Material
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Share your study materials with other students
          </p>
        </div>

        <div className="mt-12 bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
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
              )}

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Material Name
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Enter material name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                    Year
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="year"
                      id="year"
                      value={formData.year}
                      onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Enter year"
                      required
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="university" className="block text-sm font-medium text-gray-700">
                    University
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="university"
                      id="university"
                      value={formData.university}
                      onChange={(e) => setFormData(prev => ({ ...prev, university: e.target.value }))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Enter university name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="semester" className="block text-sm font-medium text-gray-700">
                    Semester
                  </label>
                  <div className="mt-1">
                    <select
                      id="semester"
                      name="semester"
                      value={formData.semester}
                      onChange={(e) => setFormData(prev => ({ ...prev, semester: e.target.value }))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    >
                      <option value="">Select Semester</option>
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
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                    Subject
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="subject"
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Enter subject name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                    Type
                  </label>
                  <div className="mt-1">
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="note">Study Note</option>
                      <option value="pyq">Previous Year Question</option>
                    </select>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="file" className="block text-sm font-medium text-gray-700">
                    File (PDF)
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                        >
                          <span>Upload a file</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            className="sr-only"
                            required
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PDF up to 10MB</p>
                    </div>
                  </div>
                  {formData.file && (
                    <p className="mt-2 text-sm text-gray-500">
                      Selected file: {formData.file.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={uploading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {uploading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </div>
                  ) : (
                    'Upload Material'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 
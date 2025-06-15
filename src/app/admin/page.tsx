'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { collection, getDocs, addDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';

interface Material {
  id: string;
  title: string;
  description: string;
  category: string;
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: string;
}

export default function AdminPanel() {
  const { user } = useAuth();
  const router = useRouter();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'note', // 'note' or 'pyq'
    semester: '',
    subject: '',
    year: '', // for PYQs
    file: null as File | null,
  });

  useEffect(() => {
    // Check if user is admin
    if (!user) {
      router.push('/login');
      return;
    }

    const checkAdminStatus = async () => {
      try {
        // Only read the current user's document
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
        
        // If admin, fetch materials
        fetchMaterials();
      } catch (error) {
        console.error('Error checking admin status:', error);
        setError('Failed to verify admin status');
      }
    };

    checkAdminStatus();
  }, [user, router]);

  const fetchMaterials = async () => {
    try {
      const materialsSnapshot = await getDocs(collection(db, 'materials'));
      const materialsList = materialsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Material[];
      setMaterials(materialsList);
    } catch (error) {
      console.error('Error fetching materials:', error);
      setError('Failed to fetch materials');
    } finally {
      setLoading(false);
    }
  };

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
        title: formData.title,
        description: formData.description,
        category: formData.category,
        semester: formData.semester,
        subject: formData.subject,
        year: formData.category === 'pyq' ? formData.year : null,
        fileUrl: downloadURL,
        uploadedBy: user?.email,
        uploadedAt: new Date().toISOString(),
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        category: 'note',
        semester: '',
        subject: '',
        year: '',
        file: null,
      });

      // Refresh materials list
      fetchMaterials();
    } catch (error) {
      console.error('Error uploading material:', error);
      setError('Failed to upload material');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'materials', id));
      setMaterials(materials.filter(material => material.id !== id));
    } catch (error) {
      console.error('Error deleting material:', error);
      setError('Failed to delete material');
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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Admin Panel
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Upload and manage study materials
          </p>
        </div>

        {/* Upload Form */}
        <div className="mt-12 max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Upload Material</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Upload study notes or previous year questions.
                </p>
              </div>
              <div className="mt-5 md:mt-0 md:col-span-2">
                <div className="grid grid-cols-6 gap-6">
                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                      Type
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="note">Study Note</option>
                      <option value="pyq">Previous Year Question</option>
                    </select>
                  </div>

                  <div className="col-span-6">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  <div className="col-span-6">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="semester" className="block text-sm font-medium text-gray-700">
                      Semester
                    </label>
                    <input
                      type="text"
                      name="semester"
                      id="semester"
                      value={formData.semester}
                      onChange={(e) => setFormData(prev => ({ ...prev, semester: e.target.value }))}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                      Subject
                    </label>
                    <input
                      type="text"
                      name="subject"
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  {formData.category === 'pyq' && (
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                        Year
                      </label>
                      <input
                        type="text"
                        name="year"
                        id="year"
                        value={formData.year}
                        onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        required
                      />
                    </div>
                  )}

                  <div className="col-span-6">
                    <label htmlFor="file" className="block text-sm font-medium text-gray-700">
                      File (PDF)
                    </label>
                    <input
                      type="file"
                      name="file"
                      id="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={uploading}
                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
              >
                {uploading ? 'Uploading...' : 'Upload Material'}
              </button>
            </div>
          </form>
        </div>

        {/* Materials List */}
        <div className="mt-12">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Uploaded Materials</h3>
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {materials.map((material) => (
                <li key={material.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-blue-600 truncate">
                          {material.title}
                        </p>
                        <p className="mt-2 flex items-center text-sm text-gray-500">
                          {material.description}
                        </p>
                        <div className="mt-2 flex">
                          <div className="flex items-center text-sm text-gray-500">
                            <span className="truncate">{material.category}</span>
                          </div>
                          <div className="ml-6 flex items-center text-sm text-gray-500">
                            <span>Uploaded by {material.uploadedBy}</span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <button
                          onClick={() => handleDelete(material.id)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 
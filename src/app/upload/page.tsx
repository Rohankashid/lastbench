'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { collection, addDoc, } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Client-side file validation configuration (matches server-side)
const CLIENT_VALIDATION = {
  maxSizeBytes: 10 * 1024 * 1024, // 10MB
  allowedExtensions: ['.pdf', '.docx', '.doc', '.pptx', '.ppt', '.xlsx', '.xls', '.txt', '.jpg', '.jpeg', '.png', '.gif', '.webp'],
  allowedMimeTypes: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/plain',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ],
};

export default function UploadPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    university: '',
    semester: '',
    subject: '',
    category: 'note', 
    branch: '',
    file: null as File | null,
  });
  const [fileValidation, setFileValidation] = useState<{
    isValid: boolean;
    error?: string;
    size?: string;
    type?: string;
  }>({ isValid: false });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    setLoading(false);
  }, [user, router]);

  // Client-side file validation
  const validateFile = (file: File) => {
    const errors: string[] = [];

    // Check file size
    if (file.size > CLIENT_VALIDATION.maxSizeBytes) {
      errors.push(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds 10MB limit`);
    }

    // Check file extension
    const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!CLIENT_VALIDATION.allowedExtensions.includes(ext)) {
      errors.push(`File extension ${ext} not allowed. Allowed: ${CLIENT_VALIDATION.allowedExtensions.join(', ')}`);
    }

    // Check MIME type
    if (!CLIENT_VALIDATION.allowedMimeTypes.includes(file.type)) {
      errors.push(`File type ${file.type} not allowed`);
    }

    // Check filename length
    if (file.name.length > 255) {
      errors.push('Filename too long (max 255 characters)');
    }

    // Check for suspicious filenames
    if (file.name.toLowerCase().includes('virus') || file.name.toLowerCase().includes('malware')) {
      errors.push('Suspicious filename detected');
    }

    return {
      isValid: errors.length === 0,
      error: errors.join('; '),
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      type: file.type,
    };
  };

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setFileValidation({ isValid: false });
      setFormData(prev => ({ ...prev, file: null }));
      return;
    }

    const validation = validateFile(file);
    setFileValidation(validation);
    setFormData(prev => ({ ...prev, file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.file) {
      setError('Please select a file');
      return;
    }

    if (!fileValidation.isValid) {
      setError(`File validation failed: ${fileValidation.error}`);
      return;
    }

    setUploading(true);
    setError('');

    try {
      // 1. Upload file to S3 via API route
      const uploadData = new FormData();
      uploadData.append('file', formData.file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.details || data.error || 'Upload failed');
      }

      if (!data.url) {
        throw new Error('Failed to upload to S3');
      }

      // 2. Add document to Firestore with S3 URL
      await addDoc(collection(db, 'materials'), {
        name: formData.name,
        university: formData.university,
        semester: formData.semester,
        subject: formData.subject,
        category: formData.category,
        branch: formData.branch,
        fileUrl: data.url, // S3 URL
        filename: data.filename, // Secure filename
        originalName: data.originalName, // Original filename
        fileSize: data.size,
        fileType: data.type,
        uploadedBy: user?.email,
        uploadedAt: new Date().toISOString(),
      });

      // Reset form
      setFormData({
        name: '',
        university: '',
        semester: '',
        subject: '',
        category: 'note',
        branch: '',
        file: null,
      });
      setFileValidation({ isValid: false });

      alert('Material uploaded successfully!');
    } catch (error) {
      console.error('Error uploading material:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload material');
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
                  <div>
  <label htmlFor="branch" className="block text-sm font-medium text-gray-700">
    Branch
  </label>
  <div className="mt-1">
    <select
      id="branch"
      name="branch"
      value={formData.branch}
      onChange={e => setFormData(prev => ({ ...prev, branch: e.target.value }))}
      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      required
    >
      <option value="">Select Branch</option>
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
</div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mt-2">
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
                      onChange={e => setFormData(prev => ({ ...prev, semester: e.target.value }))}
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
  <label className="block text-sm font-medium text-gray-700">
    File
  </label>
  <div
    className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md relative cursor-pointer ${
      fileValidation.isValid 
        ? 'border-green-300 bg-green-50' 
        : formData.file 
        ? 'border-red-300 bg-red-50' 
        : 'border-gray-300'
    }`}
    onClick={() => fileInputRef.current?.click()}
    onDrop={e => {
      e.preventDefault();
      if (e.dataTransfer.files[0]) {
        handleFileChange(e.dataTransfer.files[0]);
      }
    }}
    onDragOver={e => e.preventDefault()}
  >
    <div className="space-y-1 text-center">
      <svg
        className={`mx-auto h-12 w-12 ${
          fileValidation.isValid ? 'text-green-400' : formData.file ? 'text-red-400' : 'text-gray-400'
        }`}
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
      <div className="block w-full py-2 bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
        Upload a file
      </div>
      <p className="pl-1">or drag and drop</p>
      <p className="text-xs text-gray-500">
        Allowed: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, Images (JPG, PNG, GIF, WebP)
      </p>
      <p className="text-xs text-gray-500">Maximum size: 10MB</p>
    </div>
  </div>
  
  <input
    id="file-upload"
    type="file"
    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.webp"
    ref={fileInputRef}
    onChange={e => {
      if (e.target.files && e.target.files[0]) {
        handleFileChange(e.target.files[0]);
      }
    }}
    className="sr-only"
  />
  
  {formData.file && (
    <div className="mt-2">
      <p className={`text-sm ${fileValidation.isValid ? 'text-green-600' : 'text-red-600'}`}>
        Selected: {formData.file.name}
        {fileValidation.size && ` (${fileValidation.size})`}
      </p>
      {fileValidation.error && (
        <p className="text-sm text-red-600 mt-1">
          ❌ {fileValidation.error}
        </p>
      )}
      {fileValidation.isValid && (
        <p className="text-sm text-green-600 mt-1">
          ✅ File validation passed
        </p>
      )}
    </div>
  )}
</div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={uploading || !fileValidation.isValid}
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
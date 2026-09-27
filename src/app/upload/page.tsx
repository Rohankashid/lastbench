'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { ArrowUpTrayIcon, CheckCircleIcon, XCircleIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { BackgroundGrid } from '@/components/ui/BackgroundGrid';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { 
  UNIVERSITY_SELECT_GROUPS, 
  BRANCH_SELECT_GROUPS, 
  SEMESTERS 
} from '@/lib/constants/academic';

const CLIENT_VALIDATION = {
  maxSizeBytes: 100 * 1024 * 1024,
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
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    university: '',
    semester: '',
    subject: '',
    category: 'note', 
    branch: '',
    year: '',
    file: null as File | null,
  });
  const [fileValidation, setFileValidation] = useState<{
    isValid: boolean;
    error?: string;
    size?: string;
    type?: string;
  }>({ isValid: false });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace('/?auth=login&redirect=%2Fupload');
      return;
    }
    setLoading(false);
  }, [user, router]);

  const validateFile = (file: File) => {
    const errors: string[] = [];
    if (file.size > CLIENT_VALIDATION.maxSizeBytes) {
      errors.push(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds 10MB limit`);
    }
    const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!CLIENT_VALIDATION.allowedExtensions.includes(ext)) {
      errors.push(`File extension ${ext} not allowed.`);
    }
    if (!CLIENT_VALIDATION.allowedMimeTypes.includes(file.type)) {
      errors.push(`File type ${file.type} not allowed`);
    }
    if (file.name.length > 255) {
      errors.push('Filename too long (max 255 characters)');
    }
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
    setSuccess(false);

    try {
      const uploadData = new FormData();
      uploadData.append('file', formData.file);
      uploadData.append('name', formData.name);
      uploadData.append('university', formData.university);
      uploadData.append('semester', formData.semester);
      uploadData.append('subject', formData.subject);
      uploadData.append('category', formData.category);
      uploadData.append('branch', formData.branch);
      uploadData.append('year', formData.year);
      if (user) {
        uploadData.append('uploadedBy', user.email || user.uid);
      }

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.details || data.error || 'Upload failed');
      if (!data.url) throw new Error('Failed to upload to S3');

      setFormData({
        name: '', university: '', semester: '', subject: '', category: 'note', branch: '', year: '', file: null,
      });
      setFileValidation({ isValid: false });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error uploading material:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload material');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="relative min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <BackgroundGrid variant="grid" />
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 border-b border-zinc-200 pb-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-500 font-medium">
              MATERIAL UPLOAD
            </span>
          </div>
          <h2 className="text-3xl font-semibold text-zinc-950 tracking-tight">
            Upload Study Material
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Share notes and previous year questions. Verified files are indexed instantly.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 border border-zinc-200 relative">
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                className="absolute top-0 left-0 right-0 bg-emerald-500 text-white p-4 flex items-center justify-center gap-2 shadow-md z-10 rounded-t-xl"
              >
                <CheckCircleIcon className="w-6 h-6" />
                <span className="font-semibold">Upload successful!</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="bg-rose-50 text-rose-700 p-4 rounded-xl flex items-start gap-3 border border-rose-100">
                <XCircleIcon className="w-6 h-6 flex-shrink-0" />
                <p className="text-sm font-medium mt-0.5">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Type</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="block w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors sm:text-sm"
                  >
                    <option value="note">Study Note</option>
                    <option value="pyq">Previous Year Question</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Material Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="block w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors sm:text-sm"
                    placeholder="E.g., OS Chapter 1 Notes"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Engineering Branch</label>
                  <SearchableSelect
                    value={formData.branch}
                    onChange={(val) => setFormData(prev => ({ ...prev, branch: val }))}
                    groups={BRANCH_SELECT_GROUPS}
                    placeholder="Select Engineering Branch"
                    searchPlaceholder="Search branch (e.g. CSE, Mechanical, AI)..."
                    buttonClassName="px-4 py-3 rounded-xl border-slate-200 bg-slate-50 focus:bg-white text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">University (Maharashtra)</label>
                  <SearchableSelect
                    value={formData.university}
                    onChange={(val) => setFormData(prev => ({ ...prev, university: val }))}
                    groups={UNIVERSITY_SELECT_GROUPS}
                    placeholder="Select University"
                    searchPlaceholder="Search university (e.g. SPPU, COEP, Mumbai)..."
                    buttonClassName="px-4 py-3 rounded-xl border-slate-200 bg-slate-50 focus:bg-white text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Semester</label>
                    <select
                      value={formData.semester}
                      onChange={e => setFormData(prev => ({ ...prev, semester: e.target.value }))}
                      className="block w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors sm:text-sm"
                      required
                    >
                      <option value="">Select Semester</option>
                      {SEMESTERS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  {formData.category === 'pyq' && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Year</label>
                      <select
                        value={formData.year}
                        onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                        className="block w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors sm:text-sm"
                        required
                      >
                        <option value="">Select</option>
                        {Array.from({ length: 6 }, (_, i) => {
                          const year = new Date().getFullYear() - i;
                          return <option key={year} value={year}>{year}</option>;
                        })}
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Subject</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    className="block w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors sm:text-sm"
                    placeholder="E.g., Operating Systems"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">File Upload</label>
              <div
                className={`mt-1 flex flex-col items-center justify-center px-6 pt-8 pb-10 border-2 border-dashed rounded-2xl relative cursor-pointer transition-all ${
                  isDragOver 
                    ? 'border-indigo-500 bg-indigo-50' 
                    : fileValidation.isValid 
                      ? 'border-emerald-400 bg-emerald-50' 
                      : formData.file 
                        ? 'border-rose-400 bg-rose-50' 
                        : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400'
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={e => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (e.dataTransfer.files[0]) handleFileChange(e.dataTransfer.files[0]);
                }}
              >
                {formData.file ? (
                  <div className="text-center">
                    <DocumentIcon className={`mx-auto h-16 w-16 mb-4 ${fileValidation.isValid ? 'text-emerald-500' : 'text-rose-500'}`} />
                    <p className="text-lg font-medium text-slate-900">{formData.file.name}</p>
                    <p className="text-sm text-slate-500 mt-1">{fileValidation.size}</p>
                    {fileValidation.error ? (
                      <p className="text-sm font-medium text-rose-600 mt-3 bg-rose-100 px-3 py-1 rounded-full inline-block">❌ {fileValidation.error}</p>
                    ) : (
                      <p className="text-sm font-medium text-emerald-600 mt-3 bg-emerald-100 px-3 py-1 rounded-full inline-block">✅ File is ready</p>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm mb-4">
                      <ArrowUpTrayIcon className="h-8 w-8 text-indigo-500" />
                    </div>
                    <div className="text-lg font-medium text-slate-900">Click to upload or drag and drop</div>
                    <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto">
                      PDF, DOCX, PPT, Excel, TXT or Images up to 100MB
                    </p>
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={e => {
                  if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
                }}
                className="sr-only"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.webp"
              />
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={uploading || !fileValidation.isValid}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-zinc-950 text-white font-medium text-xs hover:bg-zinc-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ml-auto flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Uploading...</span>
                  </div>
                ) : (
                  'Confirm & Upload Material'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
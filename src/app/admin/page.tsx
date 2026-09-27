'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { collection, getDocs, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { BackgroundGrid } from '@/components/ui/BackgroundGrid';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { DocumentViewer } from '@/components/ui/DocumentViewer';
import { 
  UNIVERSITY_SELECT_GROUPS, 
  BRANCH_SELECT_GROUPS, 
  SEMESTERS 
} from '@/lib/constants/academic';
import { 
  FileText, 
  BookOpen, 
  GraduationCap, 
  Trash2, 
  Eye, 
  Download, 
  Search, 
  UploadCloud, 
  MapPin, 
  RotateCcw,
  CheckCircle,
  Plus
} from 'lucide-react';

interface Material {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  category: string;
  fileUrl: string;
  uploadedBy?: string;
  uploadedAt: string;
  semester?: string;
  subject?: string;
  university?: string;
  branch?: string;
  year?: string;
  examYear?: string;
}

export default function AdminPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Material | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{
    title: string;
    fileUrl: string;
    metadata?: {
      subject?: string;
      semester?: string;
      university?: string;
      year?: string;
    };
  } | null>(null);

  // Search & Filter state for materials list
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<'all' | 'note' | 'pyq'>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick upload form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'note',
    university: '',
    branch: '',
    semester: '',
    subject: '',
    year: '',
    file: null as File | null,
  });

  useEffect(() => {
    if (!user) {
      router.replace('/?auth=login&redirect=%2Fadmin');
      return;
    }

    const checkAdminStatus = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists() || userDoc.data().role !== 'admin') {
          router.push('/');
          return;
        }
        fetchMaterials();
      } catch (err) {
        console.error('Error checking admin status:', err);
        setError('Failed to verify admin authorization');
      }
    };

    checkAdminStatus();
  }, [user, router]);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const materialsSnapshot = await getDocs(collection(db, 'materials'));
      const materialsList = materialsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Material[];
      setMaterials(materialsList.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()));
    } catch (err) {
      console.error('Error fetching materials:', err);
      setError('Failed to fetch materials repository');
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
      toast.error('Please choose a file to upload');
      return;
    }
    if (!formData.title.trim()) {
      toast.error('Please provide a document title');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const uploadData = new FormData();
      uploadData.append('file', formData.file);
      uploadData.append('name', formData.title.trim());
      uploadData.append('university', formData.university);
      uploadData.append('branch', formData.branch);
      uploadData.append('semester', formData.semester);
      uploadData.append('subject', formData.subject.trim());
      uploadData.append('category', formData.category);
      uploadData.append('year', formData.category === 'pyq' ? formData.year : '');
      uploadData.append('uploadedBy', user?.email || 'admin');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.details || data.error || 'Upload failed');
      if (!data.url) throw new Error('File upload was not acknowledged by storage');

      toast.success('Document uploaded and indexed successfully!');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: 'note',
        university: '',
        branch: '',
        semester: '',
        subject: '',
        year: '',
        file: null,
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      fetchMaterials();
    } catch (err) {
      console.error('Error uploading material:', err);
      const msg = err instanceof Error ? err.message : 'Failed to upload material';
      setError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const confirmDeleteMaterial = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    setError('');

    try {
      if (itemToDelete.fileUrl && (itemToDelete.fileUrl.includes('s3.amazonaws.com') || itemToDelete.fileUrl.includes('s3.'))) {
        const response = await fetch('/api/delete', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileUrl: itemToDelete.fileUrl }),
        });
        if (!response.ok) throw new Error('Storage file deletion failed');
      } else if (itemToDelete.fileUrl && itemToDelete.fileUrl.includes('firebasestorage.googleapis.com')) {
        const firebaseUrl = new URL(itemToDelete.fileUrl);
        const pathMatch = firebaseUrl.pathname.match(/\/o\/(.+?)\?/);
        const filePath = pathMatch ? decodeURIComponent(pathMatch[1]) : null;
        if (filePath) {
          await deleteObject(ref(storage, filePath));
        }
      }

      await deleteDoc(doc(db, 'materials', itemToDelete.id));
      setMaterials(prev => prev.filter(m => m.id !== itemToDelete.id));
      toast.success('Material deleted permanently');
      setItemToDelete(null);
    } catch (err) {
      console.error('Error deleting material:', err);
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      setError('Failed to delete material: ' + errMsg);
      toast.error('Failed to delete material: ' + errMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered materials based on search query & category tab
  const filteredMaterials = useMemo(() => {
    return materials.filter(item => {
      // Category filter
      if (selectedCategoryTab !== 'all' && item.category !== selectedCategoryTab) {
        return false;
      }

      // Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const title = (item.name || item.title || '').toLowerCase();
      const subject = (item.subject || '').toLowerCase();
      const university = (item.university || '').toLowerCase();
      const branch = (item.branch || '').toLowerCase();
      const uploader = (item.uploadedBy || '').toLowerCase();

      return (
        title.includes(q) ||
        subject.includes(q) ||
        university.includes(q) ||
        branch.includes(q) ||
        uploader.includes(q)
      );
    });
  }, [materials, selectedCategoryTab, searchQuery]);

  // Counts
  const totalNotesCount = useMemo(() => materials.filter(m => m.category === 'note').length, [materials]);
  const totalPyqsCount = useMemo(() => materials.filter(m => m.category === 'pyq').length, [materials]);

  if (loading && materials.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="w-8 h-8 border-2 border-zinc-200 border-t-zinc-950 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <BackgroundGrid variant="grid" />
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-200 pb-5">
          <div>
            <h1 className="text-3xl font-semibold text-zinc-950 tracking-tight">
              Admin Management
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Upload study materials, oversee repository assets, and manage student downloads.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchMaterials}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 transition-colors"
              title="Refresh list"
            >
              <RotateCcw className="w-3.5 h-3.5 text-zinc-500" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Overview Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 font-medium">Total Repository Items</p>
              <p className="text-2xl font-bold text-zinc-950 mt-1">{materials.length}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-800">
              <FileText className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 font-medium">Study Notes</p>
              <p className="text-2xl font-bold text-zinc-950 mt-1">{totalNotesCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-800">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 font-medium">Question Papers (PYQs)</p>
              <p className="text-2xl font-bold text-zinc-950 mt-1">{totalPyqsCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-800">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs font-medium flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-700 font-bold ml-2">
              &times;
            </button>
          </div>
        )}

        {/* Main Content Grid: Upload (5 cols) & Manage (7 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Quick Upload Form */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 lg:sticky lg:top-20">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-zinc-100">
              <div>
                <h2 className="text-base font-semibold text-zinc-950">Quick Upload</h2>
                <p className="text-[11px] text-zinc-500 mt-0.5">Upload verified notes and past question papers.</p>
              </div>
              <span className="p-2 rounded-lg bg-zinc-100 text-zinc-700">
                <Plus className="w-4 h-4" />
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">Document Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, category: 'note' }))}
                    className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-colors ${
                      formData.category === 'note'
                        ? 'border-zinc-900 bg-zinc-950 text-white'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    Study Note
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, category: 'pyq' }))}
                    className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-colors ${
                      formData.category === 'pyq'
                        ? 'border-zinc-900 bg-zinc-950 text-white'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    Question Paper (PYQ)
                  </button>
                </div>
              </div>

              {/* Title / Name */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Document Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Operating Systems Chapter 1 Notes"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 bg-white text-zinc-900 transition-colors"
                />
              </div>

              {/* University Select */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  University (Maharashtra) <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  required
                  value={formData.university}
                  onChange={(val) => setFormData(prev => ({ ...prev, university: val }))}
                  groups={UNIVERSITY_SELECT_GROUPS}
                  placeholder="Select University"
                  searchPlaceholder="Search Maharashtra university or institute..."
                />
              </div>

              {/* Engineering Branch Select */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Engineering Branch <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  required
                  value={formData.branch}
                  onChange={(val) => setFormData(prev => ({ ...prev, branch: val }))}
                  groups={BRANCH_SELECT_GROUPS}
                  placeholder="Select Engineering Branch"
                  searchPlaceholder="Search branch (e.g. CSE, IT, Mechanical)..."
                />
              </div>

              {/* Semester & Year */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Semester <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.semester}
                    onChange={(e) => setFormData(prev => ({ ...prev, semester: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-colors"
                  >
                    <option value="">Select Sem</option>
                    {SEMESTERS.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                {formData.category === 'pyq' ? (
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      Exam Year <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.year}
                      onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-colors"
                    >
                      <option value="">Select Year</option>
                      {Array.from({ length: 6 }, (_, i) => {
                        const yr = new Date().getFullYear() - i;
                        return <option key={yr} value={yr}>{yr}</option>;
                      })}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">Subject Code / Tag</label>
                    <input
                      type="text"
                      placeholder="e.g. CS301"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-colors"
                    />
                  </div>
                )}
              </div>

              {/* Subject Name */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Subject Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Operating Systems"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-colors"
                />
              </div>

              {/* File Upload Box */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  File (PDF / Document) <span className="text-rose-500">*</span>
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-4 border border-dashed border-zinc-300 hover:border-zinc-400 bg-zinc-50/70 hover:bg-zinc-50 rounded-xl cursor-pointer text-center transition-colors"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {formData.file ? (
                    <div className="flex items-center justify-between gap-2 text-left bg-white p-2.5 rounded-lg border border-zinc-200">
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-xs font-medium text-zinc-900 truncate">
                          {formData.file.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400 shrink-0 font-mono">
                        {(formData.file.size / (1024 * 1024)).toFixed(1)} MB
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1.5 py-1">
                      <UploadCloud className="w-5 h-5 text-zinc-400" />
                      <p className="text-xs font-medium text-zinc-800">
                        Click to select document
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        PDF, DOCX, PPTX up to 100MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-medium text-white bg-zinc-950 hover:bg-zinc-800 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {uploading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Uploading Document...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Upload & Index Document</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Manage Materials List */}
          <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
            {/* List Header & Controls */}
            <div className="p-5 border-b border-zinc-100 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-zinc-950">Manage Materials</h2>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Showing {filteredMaterials.length} of {materials.length} uploaded files
                  </p>
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg text-xs font-medium text-zinc-600">
                  <button
                    onClick={() => setSelectedCategoryTab('all')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      selectedCategoryTab === 'all' ? 'bg-white text-zinc-950 shadow-xs' : 'hover:text-zinc-950'
                    }`}
                  >
                    All ({materials.length})
                  </button>
                  <button
                    onClick={() => setSelectedCategoryTab('note')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      selectedCategoryTab === 'note' ? 'bg-white text-zinc-950 shadow-xs' : 'hover:text-zinc-950'
                    }`}
                  >
                    Notes ({totalNotesCount})
                  </button>
                  <button
                    onClick={() => setSelectedCategoryTab('pyq')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      selectedCategoryTab === 'pyq' ? 'bg-white text-zinc-950 shadow-xs' : 'hover:text-zinc-950'
                    }`}
                  >
                    PYQs ({totalPyqsCount})
                  </button>
                </div>
              </div>

              {/* Instant Search Bar */}
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 absolute left-3 text-zinc-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by title, subject, university, branch, or uploader..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 text-xs text-zinc-400 hover:text-zinc-600"
                  >
                    &times;
                  </button>
                )}
              </div>
            </div>

            {/* List Body */}
            <div className="max-h-[720px] overflow-y-auto divide-y divide-zinc-100">
              {filteredMaterials.length === 0 ? (
                <div className="p-12 text-center text-zinc-400">
                  <FileText className="w-8 h-8 mx-auto text-zinc-300 mb-2" />
                  <p className="text-xs font-medium text-zinc-600">No materials match your criteria</p>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mt-2 text-xs text-zinc-900 font-medium underline"
                    >
                      Clear search filter
                    </button>
                  )}
                </div>
              ) : (
                filteredMaterials.map((material) => {
                  const displayTitle = material.name || material.title || 'Untitled Document';
                  const isPyq = material.category === 'pyq';

                  return (
                    <div 
                      key={material.id} 
                      className="p-4 sm:p-5 hover:bg-zinc-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      {/* Left: Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase font-mono ${
                            isPyq ? 'bg-sky-50 text-sky-700 border border-sky-200/60' : 'bg-zinc-100 text-zinc-800 border border-zinc-200'
                          }`}>
                            {isPyq ? 'PYQ' : 'NOTE'}
                          </span>

                          {material.semester && (
                            <span className="text-[10px] font-mono text-zinc-500 bg-zinc-50 px-1.5 py-0.5 rounded border border-zinc-200/60">
                              Sem {material.semester}
                            </span>
                          )}

                          {material.year && isPyq && (
                            <span className="text-[10px] font-mono text-zinc-500 bg-zinc-50 px-1.5 py-0.5 rounded border border-zinc-200/60">
                              Year {material.year}
                            </span>
                          )}

                          {material.branch && (
                            <span className="text-[10px] text-zinc-500 truncate max-w-[200px]" title={material.branch}>
                              &bull; {material.branch}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="text-sm font-semibold text-zinc-950 truncate mb-1" title={displayTitle}>
                          {displayTitle}
                        </h3>

                        {/* Subject & University Metadata */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                          {material.subject && (
                            <span className="font-medium text-zinc-700">
                              {material.subject}
                            </span>
                          )}
                          {material.university && (
                            <span className="flex items-center gap-1 text-[11px] truncate max-w-[240px]" title={material.university}>
                              <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                              <span className="truncate">{material.university}</span>
                            </span>
                          )}
                          {material.uploadedBy && (
                            <span className="text-[11px] text-zinc-400 truncate max-w-[180px]" title={material.uploadedBy}>
                              By {material.uploadedBy.split('@')[0]}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => {
                            setPreviewDoc({
                              title: displayTitle,
                              fileUrl: material.fileUrl,
                              metadata: {
                                subject: material.subject,
                                semester: material.semester,
                                university: material.university,
                                year: material.year,
                              },
                            });
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 transition-colors shadow-2xs"
                          title="Preview Document"
                        >
                          <Eye className="w-3.5 h-3.5 text-zinc-500" />
                          <span className="hidden md:inline">Preview</span>
                        </button>

                        <a
                          href={material.fileUrl}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded-lg transition-colors border border-transparent hover:border-zinc-200"
                          title="Download File"
                        >
                          <Download className="w-4 h-4" />
                        </a>

                        <button
                          onClick={() => setItemToDelete(material)}
                          className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Material"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        onConfirm={confirmDeleteMaterial}
        variant="danger"
        title="Delete Material"
        confirmText={isDeleting ? 'Deleting...' : 'Delete Material'}
        cancelText="Cancel"
      >
        <p className="text-zinc-700 text-sm">
          Are you sure you want to permanently delete{' '}
          <strong className="text-zinc-950 font-semibold">
            &ldquo;{itemToDelete?.name || itemToDelete?.title || 'this item'}&rdquo;
          </strong>?
        </p>
        <p className="mt-2 text-zinc-500 text-xs">
          This material will be permanently removed from cloud storage and the platform index. This action cannot be reversed.
        </p>
      </Modal>

      {/* In-App Preview Modal */}
      <DocumentViewer
        isOpen={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        title={previewDoc?.title || ''}
        fileUrl={previewDoc?.fileUrl || ''}
        metadata={previewDoc?.metadata}
      />
    </div>
  );
}
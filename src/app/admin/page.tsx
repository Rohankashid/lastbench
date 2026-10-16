'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { collection, getDocs, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';
import { BackgroundGrid } from '@/components/ui/BackgroundGrid';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { DocumentViewer } from '@/components/ui/DocumentViewer';
import { FullPageSpinner } from '@/components/ui/Spinner';
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
  Plus,
  Inbox,
  Sparkles,
  Clock,
  FolderOpen,
  Mail,
  Check,
  ArrowRight
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

interface PaperRequest {
  id: string;
  description: string;
  source?: string;
  userId?: string | null;
  userEmail?: string | null;
  userName?: string | null;
  isFoundingMember?: boolean;
  status: 'pending' | 'in_progress' | 'fulfilled' | 'rejected';
  createdAt: string;
  updatedAt?: string;
}

export default function AdminPanel() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // Top-level Admin section switcher: 'materials' | 'requests'
  const [activeAdminSection, setActiveAdminSection] = useState<'materials' | 'requests'>('materials');

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

  // Student Paper Requests state
  const [paperRequests, setPaperRequests] = useState<PaperRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestsFilter, setRequestsFilter] = useState<'all' | 'priority' | 'pending' | 'in_progress' | 'fulfilled'>('all');
  const [requestsSearch, setRequestsSearch] = useState('');
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null);

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
    if (authLoading) return;
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
        fetchPaperRequests();
      } catch (err) {
        console.error('Error checking admin status:', err);
        setError('Failed to verify admin authorization');
      }
    };

    checkAdminStatus();
  }, [user, authLoading, router]);

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

  const fetchPaperRequests = async () => {
    try {
      setLoadingRequests(true);
      const res = await fetch('/api/requests');
      if (!res.ok) throw new Error('Failed to fetch requests');
      const data = await res.json();
      setPaperRequests(data.requests || []);
    } catch (err) {
      console.error('Error fetching paper requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleRefreshAll = () => {
    fetchMaterials();
    fetchPaperRequests();
  };

  const handleUpdateStatus = async (id: string, newStatus: 'pending' | 'in_progress' | 'fulfilled' | 'rejected') => {
    try {
      setUpdatingRequestId(id);
      const res = await fetch('/api/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      setPaperRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
      toast.success(`Request marked as ${newStatus.replace('_', ' ')}`);
    } catch (err) {
      console.error('Error updating request status:', err);
      toast.error('Failed to update request status');
    } finally {
      setUpdatingRequestId(null);
    }
  };

  const handleDeletePaperRequest = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this student request?')) return;
    try {
      setUpdatingRequestId(id);
      const res = await fetch(`/api/requests?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete request');
      setPaperRequests(prev => prev.filter(r => r.id !== id));
      toast.success('Request deleted');
    } catch (err) {
      console.error('Error deleting request:', err);
      toast.error('Failed to delete request');
    } finally {
      setUpdatingRequestId(null);
    }
  };

  const handleFulfillWithUpload = (reqItem: PaperRequest) => {
    setFormData(prev => ({
      ...prev,
      category: 'pyq',
      title: reqItem.description.slice(0, 80),
      description: `Fulfilled for request: ${reqItem.description}`,
      subject: reqItem.description.slice(0, 40),
    }));
    setActiveAdminSection('materials');
    toast.success('Upload form pre-filled with request details!');
  };

  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return 'Recently';
    try {
      const date = new Date(dateString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    } catch {
      return 'Recently';
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
      await supabase.from('materials').delete().eq('id', itemToDelete.id);
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
  const pendingRequestsCount = useMemo(() => paperRequests.filter(r => r.status === 'pending').length, [paperRequests]);
  const priorityRequestsCount = useMemo(() => paperRequests.filter(r => r.isFoundingMember && r.status === 'pending').length, [paperRequests]);

  // Filtered requests based on search query & filter tab
  const filteredRequests = useMemo(() => {
    return paperRequests.filter((req) => {
      // Priority filter
      if (requestsFilter === 'priority' && (!req.isFoundingMember || req.status !== 'pending')) return false;
      // Status filter
      if (requestsFilter === 'pending' && req.status !== 'pending') return false;
      if (requestsFilter === 'in_progress' && req.status !== 'in_progress') return false;
      if (requestsFilter === 'fulfilled' && req.status !== 'fulfilled') return false;

      // Search query filter
      if (!requestsSearch.trim()) return true;
      const q = requestsSearch.toLowerCase().trim();
      const desc = (req.description || '').toLowerCase();
      const email = (req.userEmail || '').toLowerCase();
      const name = (req.userName || '').toLowerCase();
      const source = (req.source || '').toLowerCase();

      return desc.includes(q) || email.includes(q) || name.includes(q) || source.includes(q);
    });
  }, [paperRequests, requestsFilter, requestsSearch]);

  if (loading && materials.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <FullPageSpinner />
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
              Upload study materials, fulfill student PYQ requests, and manage repository assets.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefreshAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
              title="Refresh repository & requests"
            >
              <RotateCcw className="w-3.5 h-3.5 text-zinc-500" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Overview Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

          <div 
            onClick={() => setActiveAdminSection('requests')}
            className={`p-5 rounded-2xl border shadow-sm flex items-center justify-between cursor-pointer transition-all ${
              priorityRequestsCount > 0 
                ? 'bg-amber-50/70 border-amber-300 hover:border-amber-400' 
                : 'bg-white border-zinc-200 hover:border-zinc-300'
            }`}
          >
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-medium text-zinc-600">Student Paper Requests</p>
                {priorityRequestsCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-400 text-amber-950 rounded uppercase">
                    24h Priority
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl font-bold text-zinc-950">{paperRequests.length}</p>
                <span className="text-xs text-zinc-500 font-medium">
                  ({pendingRequestsCount} pending)
                </span>
              </div>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              priorityRequestsCount > 0 ? 'bg-amber-400 text-amber-950' : 'bg-zinc-100 text-zinc-800'
            }`}>
              <Inbox className="w-5 h-5" />
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

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-zinc-200 pb-3">
          <button
            onClick={() => setActiveAdminSection('materials')}
            className={`px-4 py-2 text-xs font-medium rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeAdminSection === 'materials'
                ? 'bg-zinc-950 text-white shadow-sm'
                : 'bg-zinc-100 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/70'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Repository & Upload</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              activeAdminSection === 'materials' ? 'bg-white/20 text-white' : 'bg-zinc-200 text-zinc-700'
            }`}>
              {materials.length}
            </span>
          </button>

          <button
            onClick={() => setActiveAdminSection('requests')}
            className={`px-4 py-2 text-xs font-medium rounded-xl transition-all flex items-center gap-2 cursor-pointer relative ${
              activeAdminSection === 'requests'
                ? 'bg-zinc-950 text-white shadow-sm'
                : 'bg-zinc-100 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/70'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Student Paper Requests</span>
            {pendingRequestsCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] bg-amber-400 text-amber-950 font-bold rounded-full">
                {pendingRequestsCount}
              </span>
            )}
            {priorityRequestsCount > 0 && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] bg-amber-500 text-amber-950 font-bold rounded tracking-wide uppercase">
                <Sparkles className="w-2.5 h-2.5" />
                {priorityRequestsCount} 24h
              </span>
            )}
          </button>
        </div>

        {/* Main Content: Repository & Upload Grid */}
        {activeAdminSection === 'materials' && (
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
                    <Spinner size="sm" />
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
        )}

        {/* Student Paper Requests View */}
        {activeAdminSection === 'requests' && (
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
            {/* Request List Header & Filters */}
            <div className="p-5 border-b border-zinc-100 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-zinc-950 flex items-center gap-2">
                    <span>Student Paper Requests</span>
                    {pendingRequestsCount > 0 && (
                      <span className="px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-900 rounded-full">
                        {pendingRequestsCount} Pending
                      </span>
                    )}
                  </h2>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    PYQs, subjects, and exam sessions requested by students when searching.
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg text-xs font-medium text-zinc-600 flex-wrap">
                  <button
                    onClick={() => setRequestsFilter('all')}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      requestsFilter === 'all' ? 'bg-white text-zinc-950 shadow-xs' : 'hover:text-zinc-950'
                    }`}
                  >
                    All ({paperRequests.length})
                  </button>
                  <button
                    onClick={() => setRequestsFilter('priority')}
                    className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
                      requestsFilter === 'priority' ? 'bg-amber-400 text-amber-950 font-semibold shadow-xs' : 'hover:text-zinc-950'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>24h Priority ({priorityRequestsCount})</span>
                  </button>
                  <button
                    onClick={() => setRequestsFilter('pending')}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      requestsFilter === 'pending' ? 'bg-white text-zinc-950 shadow-xs' : 'hover:text-zinc-950'
                    }`}
                  >
                    Pending ({pendingRequestsCount})
                  </button>
                  <button
                    onClick={() => setRequestsFilter('in_progress')}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      requestsFilter === 'in_progress' ? 'bg-white text-zinc-950 shadow-xs' : 'hover:text-zinc-950'
                    }`}
                  >
                    In Progress
                  </button>
                  <button
                    onClick={() => setRequestsFilter('fulfilled')}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      requestsFilter === 'fulfilled' ? 'bg-white text-zinc-950 shadow-xs' : 'hover:text-zinc-950'
                    }`}
                  >
                    Fulfilled
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 absolute left-3 text-zinc-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search requests by paper details, student email, or name..."
                  value={requestsSearch}
                  onChange={(e) => setRequestsSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-colors"
                />
                {requestsSearch && (
                  <button
                    onClick={() => setRequestsSearch('')}
                    className="absolute right-2.5 text-xs text-zinc-400 hover:text-zinc-600 cursor-pointer"
                  >
                    &times;
                  </button>
                )}
              </div>
            </div>

            {/* Requests List */}
            <div className="divide-y divide-zinc-100 max-h-[720px] overflow-y-auto">
              {loadingRequests ? (
                <div className="p-12 text-center text-zinc-400">
                  <Spinner size="md" />
                  <p className="text-xs text-zinc-500 mt-2">Loading student requests...</p>
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="p-16 text-center text-zinc-400">
                  <Inbox className="w-10 h-10 mx-auto text-zinc-300 mb-3" />
                  <p className="text-sm font-medium text-zinc-800">No requests found</p>
                  <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                    {requestsSearch || requestsFilter !== 'all'
                      ? 'No requests match your current filters. Try resetting the filter.'
                      : 'When students request question papers via search empty states or the request modal, they will show up here.'}
                  </p>
                </div>
              ) : (
                filteredRequests.map((req) => (
                  <div key={req.id} className="p-5 hover:bg-zinc-50/60 transition-colors space-y-3">
                    {/* Top row: Badges & time */}
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        {req.isFoundingMember && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                            <Sparkles className="w-3 h-3 text-amber-600" />
                            <span>Founding Member &bull; 24h Priority SLA</span>
                          </span>
                        )}

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase ${
                            req.status === 'pending'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : req.status === 'in_progress'
                              ? 'bg-sky-50 text-sky-800 border border-sky-200'
                              : req.status === 'fulfilled'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                          }`}
                        >
                          {req.status.replace('_', ' ')}
                        </span>

                        {req.source && (
                          <span className="text-[10px] text-zinc-400 font-mono">
                            source: {req.source}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatTimeAgo(req.createdAt)}</span>
                      </div>
                    </div>

                    {/* Middle: Request description text */}
                    <div className="p-3.5 bg-zinc-50 border border-zinc-200/80 rounded-xl">
                      <p className="text-xs font-mono font-medium text-zinc-900 whitespace-pre-wrap leading-relaxed">
                        &ldquo;{req.description}&rdquo;
                      </p>
                    </div>

                    {/* Bottom row: Student details and Action buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                      {/* Student info */}
                      <div className="flex items-center gap-3 text-xs text-zinc-600 flex-wrap">
                        {req.userName && (
                          <span className="font-semibold text-zinc-950">{req.userName}</span>
                        )}
                        {req.userEmail ? (
                          <a
                            href={`mailto:${req.userEmail}?subject=Regarding your question paper request on LastBench`}
                            className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-900 underline text-[11px]"
                            title="Send email to student"
                          >
                            <Mail className="w-3 h-3 text-zinc-400" />
                            <span>{req.userEmail}</span>
                          </a>
                        ) : (
                          <span className="text-zinc-400 text-[11px]">Anonymous Student</span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {/* Quick fulfill via upload */}
                        {req.status !== 'fulfilled' && (
                          <button
                            onClick={() => handleFulfillWithUpload(req)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-950 text-white hover:bg-zinc-800 transition-colors shadow-2xs cursor-pointer"
                            title="Pre-fill Quick Upload form with this request"
                          >
                            <span>Fulfill Paper</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Status Toggles */}
                        {req.status === 'pending' && (
                          <button
                            disabled={updatingRequestId === req.id}
                            onClick={() => handleUpdateStatus(req.id, 'in_progress')}
                            className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
                          >
                            Start Working
                          </button>
                        )}

                        {req.status !== 'fulfilled' && (
                          <button
                            disabled={updatingRequestId === req.id}
                            onClick={() => handleUpdateStatus(req.id, 'fulfilled')}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
                            title="Mark request as fulfilled"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Fulfilled</span>
                          </button>
                        )}

                        {req.status === 'fulfilled' && (
                          <button
                            disabled={updatingRequestId === req.id}
                            onClick={() => handleUpdateStatus(req.id, 'pending')}
                            className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 transition-colors cursor-pointer"
                          >
                            Reopen
                          </button>
                        )}

                        {/* Delete button */}
                        <button
                          disabled={updatingRequestId === req.id}
                          onClick={() => handleDeletePaperRequest(req.id)}
                          className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete request"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
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
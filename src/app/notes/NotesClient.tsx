'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSearchParams } from 'next/navigation';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import SkeletonCard from '@/components/SkeletonCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { motion } from 'framer-motion';
import { BackgroundGrid } from '@/components/ui/BackgroundGrid';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { SignInModal } from '@/components/ui/SignInModal';
import { DocumentViewer } from '@/components/ui/DocumentViewer';
import { BookmarkButton } from '@/components/ui/BookmarkButton';
import { 
  UNIVERSITY_SELECT_GROUPS, 
  BRANCH_SELECT_GROUPS, 
  SEMESTERS,
  matchesUniversity,
  matchesBranch
} from '@/lib/constants/academic';
import { 
  BookOpen, 
  Search, 
  MapPin, 
  GraduationCap, 
  Library, 
  Eye, 
  Download, 
  Trash2, 
  RotateCcw,
  X
} from 'lucide-react';

interface Note {
  id: string;
  title: string;
  name: string; // Material name
  description: string;
  subject: string;
  semester: string;
  university: string;
  branch?: string;
  year: string;
  downloadUrl: string;
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
};

function NotesContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewTarget, setPreviewTarget] = useState<Note | null>(null);
  const [downloadTarget, setDownloadTarget] = useState<Note | null>(null);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Auto-open preview from URL parameter
  useEffect(() => {
    const v = searchParams.get('v');
    if (v && allNotes.length > 0) {
      const target = allNotes.find(item => item.id === v);
      if (target && !previewTarget) {
        setPreviewTarget(target);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, allNotes]);

  const [filters, setFilters] = useState({
    search: '',
    semester: '',
    branch: '',
    university: '',
  });

  // Sync searchParams from URL
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    const urlUniv = searchParams.get('university') || '';
    const urlBranch = searchParams.get('branch') || '';
    const urlSem = searchParams.get('semester') || '';

    if (urlSearch || urlUniv || urlBranch || urlSem) {
      setFilters(prev => ({
        ...prev,
        ...(urlSearch ? { search: urlSearch } : {}),
        ...(urlUniv ? { university: urlUniv } : {}),
        ...(urlBranch ? { branch: urlBranch } : {}),
        ...(urlSem ? { semester: urlSem } : {}),
      }));
    }
  }, [searchParams]);

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
      const q = query(
        collection(db, 'materials'),
        where('category', '==', 'note'),
        orderBy('uploadedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const notesData = querySnapshot.docs.map(doc => {
        const safeData = { ...doc.data() };
        delete safeData.uploadedBy;
        return {
          id: doc.id,
          ...safeData
        };
      }) as Note[];
      setAllNotes(notesData);
    } catch (error) {
      console.error('Error fetching notes:', error);
      setError('Failed to fetch notes. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let filtered = allNotes;

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      filtered = filtered.filter(note =>
        (note.name && note.name.toLowerCase().includes(q)) ||
        (note.title && note.title.toLowerCase().includes(q)) ||
        (note.subject && note.subject.toLowerCase().includes(q)) ||
        (note.description && note.description.toLowerCase().includes(q)) ||
        (note.university && note.university.toLowerCase().includes(q)) ||
        (note.branch && note.branch.toLowerCase().includes(q))
      );
    }

    if (filters.semester) {
      filtered = filtered.filter(note => note.semester === filters.semester);
    }

    if (filters.branch) {
      filtered = filtered.filter(note => matchesBranch(note.branch, filters.branch));
    }
    
    if (filters.university) {
      filtered = filtered.filter(note => matchesUniversity(note.university, filters.university));
    }
    
    setFilteredNotes(filtered);
  }, [allNotes, filters.search, filters.semester, filters.branch, filters.university]);

  useEffect(() => {
    const initializePage = async () => {
      if (user) {
        const adminStatus = await checkAdminStatus();
        setIsAdmin(adminStatus);
      } else {
        setIsAdmin(false);
      }
      await fetchNotes();
    };
    
    initializePage();
  }, [user, fetchNotes, checkAdminStatus]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      semester: '',
      branch: '',
      university: '',
    });
  };

  const hasActiveFilters = Boolean(filters.search || filters.semester || filters.branch || filters.university);

  const confirmDeleteNote = async () => {
    if (!noteToDelete) return;
    setIsDeleting(true);
    setError('');

    try {
      // Check if this is an S3 URL or Firebase Storage URL
      if (noteToDelete.fileUrl && (noteToDelete.fileUrl.includes('s3.amazonaws.com') || noteToDelete.fileUrl.includes('s3.'))) {
        // This is an S3 URL - delete from S3
        try {
          const response = await fetch('/api/delete', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ fileUrl: noteToDelete.fileUrl }),
          });
          
          if (!response.ok) {
            throw new Error('S3 deletion failed');
          }
        } catch (s3Error) {
          console.error('S3 delete failed:', s3Error);
          throw new Error('Failed to delete file from S3');
        }
      } else if (noteToDelete.fileUrl && noteToDelete.fileUrl.includes('firebasestorage.googleapis.com')) {
        // This is a Firebase Storage URL - delete from Firebase Storage
        try {
          const firebaseUrl = new URL(noteToDelete.fileUrl);
          const pathMatch = firebaseUrl.pathname.match(/\/o\/(.+?)\?/);
          const filePath = pathMatch ? decodeURIComponent(pathMatch[1]) : null;
          
          if (filePath) {
            const fileRef = ref(storage, filePath);
            await deleteObject(fileRef);
          } else {
            throw new Error('Could not extract Firebase Storage path');
          }
        } catch (storageError) {
          console.error('Firebase Storage delete failed:', storageError);
          throw new Error('Failed to delete file from Firebase Storage');
        }
      }

      // Delete from Firestore
      await deleteDoc(doc(db, 'materials', noteToDelete.id));
      
      // Update UI
      setAllNotes(prev => prev.filter(n => n.id !== noteToDelete.id));
      toast.success('Study note deleted permanently');
      setNoteToDelete(null);
    } catch (err: unknown) {
      console.error('Error in delete process:', err);
      const errMsg = err instanceof Error ? err.message : 'Failed to delete note';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <BackgroundGrid variant="grid" />
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-200 pb-5">
          <div>
            <h1 className="text-3xl font-semibold text-zinc-950 tracking-tight">
              Study Notes
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Open-access lecture digests, unit summaries, and student study aids across universities and branches.
            </p>
          </div>
          <p className="text-xs text-zinc-500 font-medium shrink-0">
            {loading ? 'Loading...' : `${filteredNotes.length} notes available`}
          </p>
        </div>

        {/* Filter Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-3 rounded-xl shadow-sm border border-zinc-200 relative z-20 space-y-3"
        >
          <div className="flex flex-col md:flex-row gap-3 items-center">
            
            {/* Search Input */}
            <div className="w-full md:w-64">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <Search className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  placeholder="Search notes, subjects..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="block w-full pl-9 pr-3 py-2.5 text-xs border border-zinc-200 rounded-lg focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 bg-white text-zinc-900 font-medium placeholder:text-zinc-400"
                />
              </div>
            </div>

            <div className="w-full md:w-40">
              <label htmlFor="semester" className="sr-only">Semester</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <GraduationCap className="h-4 w-4 text-zinc-400" />
                </div>
                <select
                  id="semester"
                  name="semester"
                  value={filters.semester}
                  onChange={handleFilterChange}
                  className="block w-full pl-9 pr-8 py-2.5 text-xs border border-zinc-200 rounded-lg focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 bg-white text-zinc-800 font-medium"
                >
                  <option value="">All Semesters</option>
                  {SEMESTERS.map(sem => (
                    <option key={sem.value} value={sem.value}>{sem.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="w-full md:w-60">
              <label htmlFor="branch" className="sr-only">Branch</label>
              <SearchableSelect
                value={filters.branch}
                onChange={(val) => setFilters(prev => ({ ...prev, branch: val }))}
                groups={BRANCH_SELECT_GROUPS}
                placeholder="All Branches"
                allOptionLabel="All Engineering Branches"
                searchPlaceholder="Search branch..."
                clearable
                buttonClassName="py-2.5 bg-white text-zinc-800 font-medium"
              />
            </div>

            <div className="w-full md:flex-1">
              <label htmlFor="university" className="sr-only">University</label>
              <SearchableSelect
                value={filters.university}
                onChange={(val) => setFilters(prev => ({ ...prev, university: val }))}
                groups={UNIVERSITY_SELECT_GROUPS}
                placeholder="All Universities"
                allOptionLabel="All Maharashtra Universities"
                searchPlaceholder="Search university or institute..."
                clearable
                buttonClassName="py-2.5 bg-white text-zinc-800 font-medium"
              />
            </div>

            {hasActiveFilters && (
              <div className="w-full md:w-auto">
                <button
                  onClick={handleResetFilters}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 text-xs font-medium rounded-lg transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>
            )}
            
          </div>

          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-100 text-xs">
              <span className="text-[11px] text-zinc-400 font-mono">Filters:</span>
              {filters.search && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-800 text-[11px] font-medium border border-zinc-200">
                  Keyword: &ldquo;{filters.search}&rdquo;
                  <button onClick={() => setFilters(p => ({ ...p, search: '' }))} className="hover:text-rose-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.semester && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-800 text-[11px] font-medium border border-zinc-200">
                  Semester {filters.semester}
                  <button onClick={() => setFilters(p => ({ ...p, semester: '' }))} className="hover:text-rose-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.branch && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-800 text-[11px] font-medium border border-zinc-200">
                  Branch: {filters.branch}
                  <button onClick={() => setFilters(p => ({ ...p, branch: '' }))} className="hover:text-rose-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.university && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-800 text-[11px] font-medium border border-zinc-200 max-w-xs truncate">
                  Uni: {filters.university}
                  <button onClick={() => setFilters(p => ({ ...p, university: '' }))} className="hover:text-rose-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                onClick={handleResetFilters}
                className="text-[11px] text-zinc-500 hover:text-zinc-900 underline ml-auto"
              >
                Clear all
              </button>
            </div>
          )}
        </motion.div>

        {/* Error State */}
        {error && (
          <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-rose-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-rose-700 font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="mt-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filteredNotes.length === 0 ? (
            <EmptyState 
              title="No study notes found" 
              description="We couldn't find any notes matching your current filters. Try adjusting them or check back later."
              icon={<BookOpen className="w-8 h-8 text-indigo-400" />}
              action={{
                label: 'Clear all filters',
                onClick: handleResetFilters
              }}
              secondaryAction={{
                label: 'Request Material',
                onClick: () => {
                  toast.success('Request sent to admins! We will try to upload it soon.');
                }
              }}
            />
          ) : (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {filteredNotes.map((note) => (
                <motion.div
                  variants={itemVariants}
                  key={note.id}
                  className="bg-white rounded-xl border border-zinc-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-zinc-300 hover:shadow-[0_8px_20px_rgba(0,0,0,0.04)] transition-all overflow-hidden flex flex-col justify-between"
                >
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3
                        className="text-base font-semibold text-zinc-950 hover:text-blue-600 transition-colors cursor-pointer line-clamp-2 leading-snug"
                        onClick={() => setPreviewTarget(note)}
                        tabIndex={0}
                        role="button"
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPreviewTarget(note); } }}
                      >
                        {note.name || note.title}
                      </h3>
                      {note.subject && (
                        <span className="shrink-0 mono-chip">
                          {note.subject}
                        </span>
                      )}
                    </div>
                    
                    {note.description && (
                      <p className="text-zinc-500 text-xs line-clamp-2 mb-4 leading-relaxed">
                        {note.description}
                      </p>
                    )}

                    <div className="mt-auto space-y-2 pt-3 border-t border-zinc-100">
                      {note.semester && (
                        <div className="flex items-center text-xs text-zinc-500 font-mono">
                          <GraduationCap className="w-3.5 h-3.5 mr-2 text-zinc-400" />
                          <span>SEM {note.semester}</span>
                        </div>
                      )}
                      {note.university && (
                        <div className="flex items-center text-xs text-zinc-500">
                          <MapPin className="w-3.5 h-3.5 mr-2 text-zinc-400" />
                          <span className="truncate">{note.university}</span>
                        </div>
                      )}
                      {note.branch && (
                        <div className="flex items-center text-xs text-zinc-500">
                          <Library className="w-3.5 h-3.5 mr-2 text-zinc-400" />
                          <span className="truncate">{note.branch}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-50/80 border-t border-zinc-100 flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setPreviewTarget(note); }}
                      className="flex-1 inline-flex justify-center items-center gap-1.5 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-medium rounded-lg transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </button>
                    <a
                      href={user ? (note.fileUrl || note.downloadUrl) : '#'}
                      download={user ? true : undefined}
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex justify-center items-center gap-1.5 px-3 py-2 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium rounded-lg transition-colors shadow-sm cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!user) {
                          e.preventDefault();
                          setDownloadTarget(note);
                        }
                      }}
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </a>
                    <BookmarkButton materialId={note.id} />
                    {isAdmin && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setNoteToDelete(note); }}
                        className="inline-flex justify-center items-center p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete note"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Rare UI Minimal Delete Modal */}
      <Modal
        isOpen={!!noteToDelete}
        onClose={() => setNoteToDelete(null)}
        onConfirm={confirmDeleteNote}
        variant="danger"
        title="Delete Study Note"
        confirmText={isDeleting ? 'Deleting...' : 'Delete Note'}
        cancelText="Cancel"
      >
        <p className="text-zinc-700">
          Are you sure you want to permanently delete{' '}
          <strong className="text-zinc-950 font-semibold">&ldquo;{noteToDelete?.name || noteToDelete?.title}&rdquo;</strong>?
        </p>
        <p className="mt-2 text-zinc-500">
          This document will be permanently purged from the cloud storage repository. This action cannot be reversed.
        </p>
      </Modal>

      
      {/* Interactive In-App Document Viewer */}
      {previewTarget && (
        <DocumentViewer
          isOpen={!!previewTarget}
          onClose={() => {
            setPreviewTarget(null);
            // Optionally clear the URL without refreshing
            if (searchParams.has('v')) {
              window.history.replaceState({}, '', window.location.pathname);
            }
          }}
          title={previewTarget.name || previewTarget.title}
          fileUrl={previewTarget.fileUrl || previewTarget.downloadUrl}
          materialId={previewTarget.id}
          metadata={{
            subject: previewTarget.subject,
            semester: previewTarget.semester,
            university: previewTarget.university,
          }}
        />
      )}

      {/* Sign In Required Modal for Guests */}

      <SignInModal
        isOpen={Boolean(downloadTarget)}
        onClose={() => setDownloadTarget(null)}
        title={downloadTarget?.name || downloadTarget?.title}
        redirectUrl="/notes"
      />
    </div>
  );
}

export default function NotesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-950 rounded-full animate-spin" />
        </div>
      }
    >
      <NotesContent />
    </Suspense>
  );
}
'use client';

import React, { useEffect, useState, Suspense, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useAuthModal } from '@/context/AuthModalContext';
import { useDebounce } from '@/hooks/useDebounce';
import { supabase } from '@/lib/supabase';
import { useSearchParams } from 'next/navigation';
import { Spinner }
from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { motion } from 'framer-motion';
import { BackgroundGrid } from '@/components/ui/BackgroundGrid';
import { useToast } from '@/components/ui/Toast';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { SignInModal } from '@/components/ui/SignInModal';
import { RequestPaperModal } from '@/components/ui/RequestPaperModal';
import { DocumentViewer } from '@/components/ui/DocumentViewer';
import { BookmarkButton } from '@/components/ui/BookmarkButton';
import { 
  UNIVERSITY_SELECT_GROUPS, 
  BRANCH_SELECT_GROUPS, 
  SEMESTERS,
  getBranchSearchPattern,
} from '@/lib/constants/academic';
import { toSearchQuery } from '@/lib/search';
import { 
  FileText, 
  Search, 
  GraduationCap, 
  RotateCcw,
  X,
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';

export interface PYQ {
  id: string;
  title: string;
  name: string; // Material name
  description: string;
  subject: string;
  semester: string;
  university: string;
  branch?: string;
  year: string;
  examYear: string;
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

function PYQsContent({ initialPYQs = [] }: { initialPYQs?: PYQ[] }) {
  const { user: _user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [previewTarget, setPreviewTarget] = useState<PYQ | null>(null);
  const [downloadTarget, setDownloadTarget] = useState<PYQ | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const dismissedIdsRef = useRef<Set<string>>(new Set());
  const openedIdRef = useRef<string | null>(null);

  const handleRequestPaper = () => {
    if (!_user) {
      openAuthModal('signin', {
        contextMessage: 'Sign in to request question papers & get notified when uploaded',
        onSuccess: () => setIsRequestModalOpen(true),
      });
      return;
    }
    setIsRequestModalOpen(true);
  };

  const updateViewUrl = (id?: string) => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (id) {
      url.searchParams.set('v', id);
    } else {
      url.searchParams.delete('v');
    }
    window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
  };

  const handleOpenPreview = (pyq: PYQ) => {
    dismissedIdsRef.current.delete(pyq.id);
    openedIdRef.current = pyq.id;
    setPreviewTarget(pyq);
    updateViewUrl(pyq.id);
  };

  const handleClosePreview = () => {
    if (previewTarget) {
      dismissedIdsRef.current.add(previewTarget.id);
    }
    const currentParam = searchParams.get('v');
    if (currentParam) {
      dismissedIdsRef.current.add(currentParam);
    }
    openedIdRef.current = null;
    setPreviewTarget(null);
    updateViewUrl();
  };

  const handleDownload = (item: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => {
    if (!_user) {
      setDownloadTarget(item);
      return;
    }
    toast.success('Download starting...');
    const targetUrl = item.fileUrl || item.downloadUrl;
    if (targetUrl) window.open(targetUrl, '_blank');
  };

  const shareOnWhatsApp = (item: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.lastbench.online';
    const pyqUrl = `${origin}/pyqs?v=${item.id}`;
    const text = `📚 Check out ${item.title || item.name} on LastBench - free preview, no login needed!\n${pyqUrl}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const [filters, setFilters] = useState({
    search: searchParams.get('q') || searchParams.get('search') || '',
    semester: searchParams.get('sem') || '',
    branch: searchParams.get('branch') || '',
    university: searchParams.get('uni') || ''
  });

  // Keep filters in sync if user navigates with query parameters
  useEffect(() => {
    const qParam = searchParams.get('q') || searchParams.get('search');
    const semParam = searchParams.get('sem');
    const branchParam = searchParams.get('branch');
    const uniParam = searchParams.get('uni');

    setFilters(prev => ({
      ...prev,
      search: qParam !== null ? qParam : prev.search,
      semester: semParam !== null ? semParam : prev.semester,
      branch: branchParam !== null ? branchParam : prev.branch,
      university: uniParam !== null ? uniParam : prev.university,
    }));
  }, [searchParams]);

  const debouncedSearch = useDebounce(filters.search, 300);
  const PAGE_SIZE = 20;

  const fetchPage = async ({ pageParam = 0 }: { pageParam?: number }) => {
    let q = supabase
      .from('materials')
      .select('id, title, name, category, subject, university, university_short, branch, semester, year, exam_year, download_url, file_url, uploaded_by, uploaded_at')
      .eq('category', 'pyq');

    if (filters.semester) {
      q = q.eq('semester', String(filters.semester));
    }

    if (filters.university) {
      q = q.or(`university.eq.${JSON.stringify(filters.university)},university_short.eq.${JSON.stringify(filters.university)}`);
    }

    if (filters.branch) {
      q = q.ilike('branch', `%${getBranchSearchPattern(filters.branch)}%`);
    }

    if (debouncedSearch.trim()) {
      const formatted = toSearchQuery(debouncedSearch);
      if (formatted) {
        q = q.textSearch('search_vector', formatted);
      } else {
        const raw = debouncedSearch.trim();
        q = q.or(`title.ilike.%${raw}%,name.ilike.%${raw}%,subject.ilike.%${raw}%`);
      }
    }

    q = q.order('uploaded_at', { ascending: false });

    const from = pageParam * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    q = q.range(from, to);

    const { data: rows, error } = await q;
    if (error) {
      console.error('Failed to fetch PYQs from Supabase:', error);
      throw error;
    }

    const items: PYQ[] = (rows || []).map(row => ({
      id: row.id,
      title: row.title || row.name || '',
      name: row.name || row.title || '',
      description: '',
      subject: row.subject || '',
      semester: row.semester || '',
      university: row.university || '',
      branch: row.branch || '',
      year: row.year || row.exam_year || '',
      examYear: row.exam_year || row.year || '',
      downloadUrl: row.download_url || row.file_url || '',
      fileUrl: row.file_url || row.download_url || '',
      uploadedBy: row.uploaded_by || '',
      uploadedAt: row.uploaded_at || '',
    }));

    return {
      items,
      nextPage: items.length === PAGE_SIZE ? pageParam + 1 : undefined,
    };
  };

  const isDefaultFilters = !filters.semester && !filters.university && !filters.branch && !debouncedSearch.trim();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: loading,
    isError,
  } = useInfiniteQuery({
    queryKey: ['pyqs', filters.semester, filters.university, filters.branch, debouncedSearch],
    queryFn: fetchPage,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    initialData: (isDefaultFilters && initialPYQs.length > 0) ? {
      pages: [{
        items: initialPYQs,
        nextPage: initialPYQs.length >= PAGE_SIZE ? 1 : undefined,
      }],
      pageParams: [0],
    } : undefined,
  });

  const filteredPYQs = useMemo(() => data?.pages.flatMap(page => page.items) || [], [data]);

  // Auto-open document preview if ?v=<id> is in URL
  const viewId = searchParams.get('v');
  useEffect(() => {
    if (!viewId) return;
    if (dismissedIdsRef.current.has(viewId)) return;
    if (openedIdRef.current === viewId) return;

    // 1. If document is in loaded items, open it
    const existing = filteredPYQs.find(item => item.id === viewId);
    if (existing) {
      openedIdRef.current = viewId;
      setPreviewTarget(existing);
      return;
    }

    // 2. Otherwise fetch from Supabase by ID directly
    let isMounted = true;
    const fetchDoc = async () => {
      try {
        const { data: docData, error } = await supabase
          .from('materials')
          .select('id, title, name, category, subject, university, university_short, branch, semester, year, exam_year, download_url, file_url, uploaded_by, uploaded_at')
          .eq('id', viewId)
          .single();

        if (docData && isMounted && !dismissedIdsRef.current.has(viewId)) {
          openedIdRef.current = viewId;
          setPreviewTarget({
            id: docData.id,
            title: docData.title || docData.name || '',
            name: docData.name || docData.title || '',
            description: '',
            subject: docData.subject || '',
            semester: docData.semester || '',
            university: docData.university || '',
            branch: docData.branch || '',
            year: docData.year || docData.exam_year || '',
            examYear: docData.exam_year || docData.year || '',
            downloadUrl: docData.download_url || docData.file_url || '',
            fileUrl: docData.file_url || docData.download_url || '',
            uploadedBy: docData.uploaded_by || '',
            uploadedAt: docData.uploaded_at || '',
          });
        }
      } catch (err) {
        console.error('Failed to load shared PYQ:', err);
      }
    };

    fetchDoc();

    return () => {
      isMounted = false;
    };
  }, [viewId, filteredPYQs]);

  const loadingMore = isFetchingNextPage;
  const hasMore = hasNextPage;






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


  return (
    <div className="relative min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <BackgroundGrid variant="grid" />
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-200 pb-5">
          <div>
            <h1 className="text-3xl font-semibold text-zinc-950 tracking-tight">
              Previous Year Questions
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Community archive of university question papers shared for exam practice and revision.
            </p>
          </div>
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
                  placeholder="Search exam papers, subjects..."
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
        {isError && (
          <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-rose-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="mt-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 w-full">
              <Spinner size="lg" />
              <p className="mt-4 text-sm font-medium text-zinc-500">Loading resources...</p>
            </div>
          ) : filteredPYQs.length === 0 ? (
            <EmptyState 
              title="No previous year questions found" 
              description="We couldn't find any PYQs matching your current filters. Try adjusting them or check back later."
              icon={<FileText className="w-8 h-8 text-indigo-400" />}
              action={{
                label: 'Clear all filters',
                onClick: handleResetFilters
              }}
              secondaryAction={{
                label: 'Request this paper',
                onClick: handleRequestPaper
              }}
            />
          ) : (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
            >
              {filteredPYQs.map((pyq) => (
                <motion.div
                  variants={itemVariants}
                  key={pyq.id}
                  className="bg-white border border-zinc-200 rounded-lg p-5 sm:p-6 flex flex-col hover:border-zinc-300 transition-colors shadow-sm"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-sm sm:text-base font-semibold text-zinc-900 leading-tight line-clamp-2 pr-4">
                      <Link 
                        href={`/pyqs?v=${pyq.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          handleOpenPreview(pyq);
                        }}
                        className="hover:underline cursor-pointer"
                      >
                        {pyq.name || pyq.title}
                      </Link>
                    </h3>
                    {(pyq.examYear || pyq.year) && <span className="text-xs font-mono text-zinc-500 shrink-0">{pyq.examYear || pyq.year}</span>}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] sm:text-[11px] text-zinc-500 uppercase tracking-wide font-medium mb-6">
                    {pyq.subject && <span>{pyq.subject}</span>}
                    {pyq.subject && pyq.semester && <span className="text-zinc-300">•</span>}
                    {pyq.semester && <span>SEM {pyq.semester}</span>}
                    {(pyq.subject || pyq.semester) && pyq.university && <span className="text-zinc-300">•</span>}
                    {pyq.university && <span>{pyq.university}</span>}
                  </div>

                  <div className="mt-auto flex items-center justify-between border-t border-zinc-100 pt-4">
                    <div className="flex items-center gap-4">
                      <Link 
                        href={`/pyqs?v=${pyq.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          handleOpenPreview(pyq);
                        }}
                        className="text-[11px] font-bold text-zinc-500 hover:text-zinc-900 uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        View
                      </Link>
                      <button onClick={() => handleDownload(pyq)} className="text-[11px] font-bold text-zinc-500 hover:text-zinc-900 uppercase tracking-wider transition-colors cursor-pointer">
                        Download
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button onClick={() => shareOnWhatsApp(pyq)} className="text-zinc-400 hover:text-zinc-900 transition-colors cursor-pointer" title="Share to WhatsApp">
                        <FaWhatsapp className="w-4 h-4" />
                      </button>
                      <BookmarkButton materialId={pyq.id} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {!loading && filteredPYQs.length > 0 && hasMore && (
          <div className="flex justify-center pt-8 pb-12">
            <button
              onClick={() => fetchNextPage()}
              disabled={loadingMore}
              className="px-6 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-full hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              {loadingMore ? <span className="flex items-center justify-center gap-2"><Spinner size="sm" /> Loading...</span> : 'Load More'}
            </button>
          </div>
        )}
      </div>


      
      {/* Interactive In-App Document Viewer */}
      {previewTarget && (
        <DocumentViewer
          isOpen={!!previewTarget}
          onClose={handleClosePreview}
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
        redirectUrl="/pyqs"
      />

      {/* Request Paper Modal */}
      <RequestPaperModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        source="pyqs"
        initialQuery={filters.search}
      />
    </div>
  );
}

export default function PYQsPage({ initialPYQs = [] }: { initialPYQs?: PYQ[] }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Spinner size="sm" />
        </div>
      }
    >
      <PYQsContent initialPYQs={initialPYQs} />
    </Suspense>
  );
}
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Form from 'next/form';
import { User } from 'firebase/auth';
import { collection, query, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion } from 'framer-motion';
import { BackgroundGrid } from '@/components/ui/BackgroundGrid';
import { DocumentViewer } from '@/components/ui/DocumentViewer';
import { BookmarkButton } from '@/components/ui/BookmarkButton';
import { useBookmarks } from '@/context/BookmarkContext';
import { trackDocumentDownload } from '@/lib/analytics';
import { 
  Search, 
  Plus, 
  BookOpen, 
  FileText, 
  ArrowRight, 
  Eye, 
  Download, 
  GraduationCap, 
  MapPin,
  Calendar,
  Sparkles,
  Flame,
  ArrowUpRight,
  School,
  Bookmark,
  Scissors
} from 'lucide-react';

interface Material {
  id: string;
  title: string;
  name?: string;
  description?: string;
  category: string;
  subject: string;
  semester?: string;
  university?: string;
  branch?: string;
  year?: string;
  examYear?: string;
  downloadUrl?: string;
  fileUrl: string;
  uploadedBy?: string;
  uploadedAt?: string;
}

interface StudentDashboardProps {
  user: User;
}

export function StudentDashboard({ user }: StudentDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [recentMaterials, setRecentMaterials] = useState<Material[]>([]);
  const [feedCategory, setFeedCategory] = useState<'all' | 'note' | 'pyq' | 'saved'>('all');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'saved') {
      setFeedCategory('saved');
    }
  }, [searchParams]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [trendingTopics, setTrendingTopics] = useState<{ label: string; query: string }[]>([]);
  const [userProfile, setUserProfile] = useState<{
    university?: string;
    branch?: string;
    semester?: string;
    isFoundingMember?: boolean;
  } | null>(null);

  const [savedMaterials, setSavedMaterials] = useState<Material[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  const [previewDoc, setPreviewDoc] = useState<{
    id?: string;
    title: string;
    fileUrl: string;
    metadata?: {
      subject?: string;
      semester?: string;
      university?: string;
      year?: string;
    };
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch recent materials
        const q = query(
          collection(db, 'materials'),
          orderBy('uploadedAt', 'desc'),
          limit(40)
        );
        const snapshot = await getDocs(q);
        const items = snapshot.docs.map(doc => {
          const safeData = { ...doc.data() };
          delete safeData.uploadedBy;
          return {
            id: doc.id,
            ...safeData
          };
        }) as Material[];
        setRecentMaterials(items.slice(0, 9));

        // Dynamically compute trending topics based on real uploaded materials in Firestore
        const subjectCounts = new Map<string, number>();
        items.forEach(item => {
          const sub = (item.subject || '').trim();
          if (sub) {
            subjectCounts.set(sub, (subjectCounts.get(sub) || 0) + 1);
          }
        });
        const dynamicTrending = Array.from(subjectCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([subj]) => ({ label: subj, query: subj }));
        setTrendingTopics(dynamicTrending);

        // Fetch user academic profile
        if (user.uid) {
          const userSnap = await getDoc(doc(db, 'users', user.uid));
          if (userSnap.exists()) {
            const data = userSnap.data();
            setUserProfile({
              university: data.university,
              branch: data.branch,
              semester: data.semester,
              isFoundingMember: Boolean(data.isFoundingMember),
            });
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user.uid]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/notes?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const displayName = user.displayName || user.email?.split('@')[0] || 'Student';

  const { bookmarks, isBookmarked } = useBookmarks();

  useEffect(() => {
    if (feedCategory !== 'saved') return;
    if (bookmarks.length === 0) {
      setSavedMaterials([]);
      setLoadingSaved(false);
      return;
    }

    let isMounted = true;
    const fetchSaved = async () => {
      setLoadingSaved(true);
      try {
        const docs = await Promise.all(
          bookmarks.map(async (id) => {
            try {
              const snap = await getDoc(doc(db, 'materials', id));
              if (!snap.exists()) return null;
              const safeData = { ...snap.data() };
              delete safeData.uploadedBy;
              return { id: snap.id, ...safeData } as Material;
            } catch {
              return null;
            }
          })
        );
        if (isMounted) {
          setSavedMaterials(docs.filter(Boolean) as Material[]);
        }
      } catch (err) {
        console.error('Failed to load saved materials:', err);
      } finally {
        if (isMounted) setLoadingSaved(false);
      }
    };

    fetchSaved();
    return () => {
      isMounted = false;
    };
  }, [feedCategory, bookmarks]);

  const filteredMaterials = feedCategory === 'saved'
    ? savedMaterials.filter(item => isBookmarked(item.id))
    : recentMaterials.filter(item => {
        if (feedCategory === 'all') return true;
        return item.category === feedCategory;
      });

  return (
    <div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-zinc-50/40">
      <BackgroundGrid variant="grid" />
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 pt-10 pb-20 space-y-10">
        
        {/* ========================================================================= */}
        {/* Welcome Header + Academic Profile Badge                                   */}
        {/* ========================================================================= */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="border-b border-zinc-200 pb-8"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              {/* <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                  Academic Session Active
                </span>
              </div> */}
              <h1 className="text-3xl sm:text-4xl font-semibold text-zinc-950 tracking-tight">
                Welcome back, {displayName}.
              </h1>
              <p className="text-xs sm:text-sm text-zinc-600 mt-1 max-w-xl">
                Access your verified syllabus resources, lecture notes, and university question banks.
              </p>
            </div>

            {/* Action Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href="/micros"
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-amber-300 bg-amber-50/80 text-amber-950 text-xs font-medium hover:bg-amber-100 transition-colors shadow-xs"
              >
                <Scissors className="w-3.5 h-3.5 text-amber-700" />
                <span>Micro Xerox (4-up)</span>
              </Link>
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-950 text-white text-xs font-medium hover:bg-zinc-800 transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Share Material</span>
              </Link>
              <Link
                href="/profile"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-700 text-xs font-medium hover:bg-zinc-50 transition-colors shadow-sm"
              >
                <span>My Profile</span>
              </Link>
            </div>
          </div>

          {/* Personalized Academic Banner (if profile has university or branch) */}
          {userProfile && (userProfile.university || userProfile.branch) ? (
            <div className="mt-6 p-4 rounded-2xl bg-white border border-zinc-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-800 shrink-0">
                  <School className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-950">
                    {userProfile.university || 'Maharashtra Engineering'}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    {userProfile.branch || 'Engineering Stream'}
                    {userProfile.semester ? ` • Semester ${userProfile.semester}` : ''}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {userProfile.branch && (
                  <Link
                    href={`/notes?branch=${encodeURIComponent(userProfile.branch)}${userProfile.semester ? `&semester=${userProfile.semester}` : ''}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium transition-colors"
                  >
                    <span>My Branch Vault</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          ) : (
            !loading && (
              <div className="mt-6 p-4 rounded-2xl bg-white border border-zinc-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3">
                  <div>
                    <div className="text-xs font-semibold text-zinc-950 tracking-tight">
                      Complete your academic profile
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5 max-w-lg leading-relaxed">
                      Add your University and Branch to instantly filter PYQs and notes tailored perfectly to your curriculum.
                    </div>
                  </div>
                </div>
                
                <Link
                  href="/profile"
                  className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium transition-colors shadow-sm"
                >
                  <span>Update Profile</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )
          )}
        </motion.div>

        {/* ========================================================================= */}
        {/* Instant Search Bar + Trending Subjects + Quick Semester Jump              */}
        {/* ========================================================================= */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="space-y-3"
        >
          <Form 
            action="/notes" 
            className="relative"
            {...({
              toolname: "search_materials",
              tooldescription: "Search across all engineering subjects, semester notes, and past exam papers"
            } as Record<string, string>)}
            data-mcp-tool="search_materials"
            data-mcp-description="Search across all engineering subjects, semester notes, and past exam papers"
          >
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              name="q"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search across all subjects, semester notes, and past exam papers..."
              className="w-full pl-11 pr-28 py-3.5 bg-white border border-zinc-200/90 rounded-2xl text-xs sm:text-sm text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950/10 focus:border-zinc-950 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all"
              data-mcp-input="q"
              aria-label="Search study materials"
            />
            <div className="absolute inset-y-1.5 right-1.5 flex items-center">
              <button
                type="submit"
                className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium rounded-xl transition-colors shadow-sm"
              >
                Search
              </button>
            </div>
          </Form>

          {/* Dynamic Trending Subject Chips */}
          {trendingTopics.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="inline-flex items-center gap-1 text-[11px] text-zinc-600 font-medium">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Trending:</span>
              </span>
              {trendingTopics.map((topic) => (
                <Link
                  key={topic.label}
                  href={`/notes?q=${encodeURIComponent(topic.query)}`}
                  className="px-2.5 py-1 rounded-lg border border-zinc-200/80 bg-white hover:bg-zinc-100 text-zinc-700 text-[11px] font-medium transition-colors"
                >
                  {topic.label}
                </Link>
              ))}
            </div>
          )}

          {/* Quick Semester Navigation Pills (with direct semester filter routing) */}
          <div className="flex items-center gap-2 pt-1 overflow-x-auto pb-1 scrollbar-none">
            <span className="font-mono text-[10px] uppercase text-zinc-400 mr-1 flex-shrink-0">
              Quick Jump:
            </span>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
              <Link
                key={sem}
                href={`/notes?semester=${sem}`}
                className="px-2.5 py-1 rounded-lg border border-zinc-200/80 bg-white hover:border-zinc-400 hover:text-zinc-950 text-zinc-600 text-xs font-mono transition-colors flex-shrink-0"
              >
                Sem {sem}
              </Link>
            ))}
          </div>
        </motion.div>

        {/* ========================================================================= */}
        {/* Asymmetric Workspace Hub (Breaks Repetitive Box Look)                     */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Primary Featured Card (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200/60">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Syllabus Vault</span>
                </span>
                <span className="text-[11px] font-mono text-zinc-400">
                  Semesters 1 to 8
                </span>
              </div>

              <h2 className="text-xl font-semibold text-zinc-950 tracking-tight mb-2">
                Curated Lecture Notes &amp; Unit Digests
              </h2>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed mb-6">
                Explore chapter-wise typed notes, verified topper handwritten copies, and unit summaries optimized for quick revision.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <Link
                  href="/notes?search=Mathematics"
                  className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/70 hover:bg-zinc-100 hover:border-zinc-300 transition-colors"
                >
                  <div className="text-xs font-semibold text-zinc-900">Engineering Maths</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">Calculus, Linear Alg, M3</div>
                </Link>
                <Link
                  href="/notes?search=Data%20Structures"
                  className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/70 hover:bg-zinc-100 hover:border-zinc-300 transition-colors"
                >
                  <div className="text-xs font-semibold text-zinc-900">Core Computing</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">DSA, OS, DBMS, Networks</div>
                </Link>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
              <Link
                href="/notes"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-950 hover:text-zinc-700 transition-colors"
              >
                <span>Browse All Study Notes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <span className="text-xs text-zinc-400 font-mono">100% Free Online</span>
            </div>
          </div>

          {/* Secondary Exam PYQ Vault (5 cols) */}
          <div className="lg:col-span-5 bg-zinc-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-zinc-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 text-blue-400 text-xs font-medium border border-zinc-800">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Exam PYQs</span>
                </span>
                <span className="text-[10px] font-mono text-zinc-400">
                  5-Year Archive
                </span>
              </div>

              <h2 className="text-xl font-semibold tracking-tight mb-2">
                University Past Papers
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                In-sem midterms, winter/summer end-sem question banks, and answer keys across SPPU, Mumbai University, DBATU, and autonomous colleges.
              </p>

              <div className="space-y-2 mb-6">
                <Link
                  href="/pyqs?university=SPPU"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 hover:text-white transition-colors"
                >
                  <span>SPPU Pune Exam Papers</span>
                  <ArrowRight className="w-3 h-3 text-zinc-500" />
                </Link>
                <Link
                  href="/pyqs?university=Mumbai"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 hover:text-white transition-colors"
                >
                  <span>Mumbai University Papers</span>
                  <ArrowRight className="w-3 h-3 text-zinc-500" />
                </Link>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
              <Link
                href="/pyqs"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-white hover:text-zinc-300 transition-colors"
              >
                <span>Access All Exam Papers</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <span className="text-[11px] text-zinc-500 font-mono">Verified PDF scans</span>
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* Recent Community Uploads Feed with Category Filter Tabs                   */}
        {/* ========================================================================= */}
        <section className="pt-6 border-t border-zinc-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-zinc-500" />
                <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-500 font-medium">
                  COMMUNITY STUDY POOL
                </span>
              </div>
              <h2 className="text-xl font-semibold text-zinc-950 tracking-tight">
                Latest Shared Materials
              </h2>
            </div>

            {/* In-feed Category Switcher */}
            <div className="flex items-center gap-1.5 p-1 bg-white border border-zinc-200 rounded-xl shadow-xs">
              <button
                onClick={() => setFeedCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  feedCategory === 'all'
                    ? 'bg-zinc-950 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                All Materials
              </button>
              <button
                onClick={() => setFeedCategory('note')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  feedCategory === 'note'
                    ? 'bg-zinc-950 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                Notes
              </button>
              <button
                onClick={() => setFeedCategory('pyq')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  feedCategory === 'pyq'
                    ? 'bg-zinc-950 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                PYQs
              </button>
              <button
                onClick={() => setFeedCategory('saved')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all inline-flex items-center gap-1.5 ${
                  feedCategory === 'saved'
                    ? 'bg-zinc-950 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                <Bookmark className={`w-3 h-3 ${feedCategory === 'saved' ? 'fill-white' : ''}`} />
                Saved
                {bookmarks.length > 0 && (
                  <span className={`text-[10px] font-mono px-1 rounded ${
                    feedCategory === 'saved' ? 'bg-white/20' : 'bg-zinc-200/80 text-zinc-700'
                  }`}>
                    {bookmarks.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {(loading || (feedCategory === 'saved' && loadingSaved)) ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-44 bg-white border border-zinc-200 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="bg-white border border-dashed border-zinc-200 rounded-2xl p-10 text-center">
              {feedCategory === 'saved' ? (
                <>
                  <Bookmark className="w-8 h-8 mx-auto text-zinc-300 mb-3" />
                  <p className="text-xs text-zinc-500 mb-1">No bookmarked materials yet.</p>
                  <p className="text-[11px] text-zinc-400">Click the bookmark icon on any study material to save it here for quick access.</p>
                </>
              ) : (
                <>
                  <p className="text-xs text-zinc-500 mb-3">No study materials found in this category yet.</p>
                  <Link
                    href="/upload"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-950 text-white rounded-lg text-xs font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload First Material</span>
                  </Link>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMaterials.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:border-zinc-300 hover:shadow-sm transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 font-medium border border-zinc-200/80">
                        {item.category === 'pyq' ? 'PYQ' : 'NOTE'}
                      </span>
                      {item.semester && (
                        <span className="font-mono text-[10px] text-zinc-500">
                          SEM {item.semester}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-semibold text-zinc-950 line-clamp-1 mb-1">
                      {item.name || item.title}
                    </h3>

                    <div className="space-y-1 mt-3 pt-3 border-t border-zinc-100 text-xs text-zinc-500 font-mono">
                      {item.subject && (
                        <div className="flex items-center gap-1.5 truncate">
                          <GraduationCap className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                          <span className="truncate">{item.subject}</span>
                        </div>
                      )}
                      {item.university && (
                        <div className="flex items-center gap-1.5 truncate text-[11px]">
                          <MapPin className="w-3 h-3 text-zinc-400 flex-shrink-0" />
                          <span className="truncate">{item.university}</span>
                        </div>
                      )}
                      {item.examYear && (
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <Calendar className="w-3 h-3 text-zinc-400 flex-shrink-0" />
                          <span>Exam: {item.examYear}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center gap-2">
                    <button
                      onClick={() => {
                        const targetUrl = item.fileUrl || item.downloadUrl;
                        if (targetUrl) {
                          setPreviewDoc({
                            id: item.id,
                            title: item.name || item.title,
                            fileUrl: targetUrl,
                            metadata: {
                              subject: item.subject,
                              semester: item.semester,
                              university: item.university,
                            },
                          });
                        }
                      }}
                      className="flex-1 inline-flex justify-center items-center gap-1 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-medium rounded-lg transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>
                    <a
                      href={item.fileUrl || item.downloadUrl}
                      download
                      rel="noopener noreferrer"
                      onClick={() => {
                        trackDocumentDownload({
                          id: item.id,
                          title: item.name || item.title,
                          subject: item.subject,
                          semester: item.semester,
                          university: item.university,
                          category: item.category,
                          examYear: item.examYear,
                        });
                      }}
                      className="flex-1 inline-flex justify-center items-center gap-1 px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                    <BookmarkButton materialId={item.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* Document Viewer Modal                                                     */}
        {/* ========================================================================= */}
        <DocumentViewer
          isOpen={Boolean(previewDoc)}
          onClose={() => setPreviewDoc(null)}
          title={previewDoc?.title || ''}
          fileUrl={previewDoc?.fileUrl || ''}
          materialId={previewDoc?.id}
          metadata={previewDoc?.metadata}
        />

      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { BackgroundGrid } from '@/components/ui/BackgroundGrid';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { SearchableMultiSelect } from '@/components/ui/SearchableMultiSelect';
import { useToast } from '@/components/ui/Toast';
import { 
  UNIVERSITY_SELECT_GROUPS, 
  BRANCH_SELECT_GROUPS 
} from '@/lib/constants/academic';
import { 
  BookOpen, 
  FileText, 
  UploadCloud, 
  CheckCircle, 
  AlertCircle, 
  Sparkles,
  Building2,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  FileCheck,
  RotateCcw
} from 'lucide-react';

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

const SEMESTER_OPTIONS = ['1', '2', '3', '4', '5', '6', '7', '8'];

const RECENT_YEARS = Array.from({ length: 6 }, (_, i) => String(new Date().getFullYear() - i));

export default function UploadPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form inputs
  const [category, setCategory] = useState<'note' | 'pyq'>('note');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [semester, setSemester] = useState('');
  const [year, setYear] = useState(RECENT_YEARS[0]);
  const [university, setUniversity] = useState('');
  const [branch, setBranch] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  
  // Controls expanding the University & Branch section
  const [isAudienceExpanded, setIsAudienceExpanded] = useState(false);

  // File validation state
  const [fileValidation, setFileValidation] = useState<{
    isValid: boolean;
    error?: string;
    size?: string;
  }>({ isValid: false });

  // Load user academic profile to prefill target audience
  useEffect(() => {
    if (!user) {
      router.replace('/?auth=login&redirect=%2Fupload');
      return;
    }

    const loadProfile = async () => {
      try {
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        if (userSnap.exists()) {
          const data = userSnap.data();
          if (data.university) setUniversity(data.university);
          if (data.branch) setBranch(data.branch.split(',').map((b: string) => b.trim()));
          if (data.semester) setSemester(String(data.semester));
          
          // If university and branch exist, keep audience collapsed to save space
          if (data.university && data.branch) {
            setIsAudienceExpanded(false);
          } else {
            setIsAudienceExpanded(true);
          }
        } else {
          setIsAudienceExpanded(true);
        }
      } catch (err) {
        console.error('Failed to load profile for upload prefill:', err);
        setIsAudienceExpanded(true);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, router]);

  // Derived professional document title
  const computedTitle = useMemo(() => {
    if (isEditingTitle && customTitle.trim()) {
      return customTitle.trim();
    }
    const cleanSub = subject.trim();
    const cleanTopic = topic.trim();

    if (!cleanSub) return '';

    if (category === 'pyq') {
      const yearPart = year ? `(${year})` : '';
      return cleanTopic 
        ? `${cleanSub}: ${cleanTopic} Paper ${yearPart}`.trim()
        : `${cleanSub} Question Paper ${yearPart}`.trim();
    }

    // Category === 'note'
    return cleanTopic 
      ? `${cleanSub}: ${cleanTopic}`.trim()
      : `${cleanSub} Comprehensive Notes`;
  }, [isEditingTitle, customTitle, subject, topic, category, year]);

  const validateFile = (targetFile: File) => {
    const errors: string[] = [];
    if (targetFile.size > CLIENT_VALIDATION.maxSizeBytes) {
      errors.push(`File size (${(targetFile.size / 1024 / 1024).toFixed(2)}MB) exceeds 100MB limit`);
    }
    const ext = targetFile.name.toLowerCase().substring(targetFile.name.lastIndexOf('.'));
    if (!CLIENT_VALIDATION.allowedExtensions.includes(ext)) {
      errors.push(`File extension "${ext}" is not supported`);
    }
    if (!CLIENT_VALIDATION.allowedMimeTypes.includes(targetFile.type) && targetFile.type !== '') {
      errors.push(`Unsupported file type: ${targetFile.type}`);
    }
    if (targetFile.name.length > 255) {
      errors.push('Filename is too long (maximum 255 characters)');
    }

    return {
      isValid: errors.length === 0,
      error: errors.join('; '),
      size: `${(targetFile.size / 1024 / 1024).toFixed(2)} MB`,
    };
  };

  const handleFileChange = (pickedFile: File | null) => {
    if (!pickedFile) {
      setFile(null);
      setFileValidation({ isValid: false });
      return;
    }
    const validation = validateFile(pickedFile);
    setFileValidation(validation);
    setFile(pickedFile);

    // If subject is empty, give a clean suggestion based on filename if helpful
    if (!subject) {
      const baseName = pickedFile.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      // If filename looks like a readable title (not random scanner garbage), set as topic or customTitle
      if (!/^(IMG|SCAN|DOC|WhatsApp|CamScanner|File)/i.test(baseName) && baseName.length > 3) {
        setTopic(baseName);
      }
    }
  };

  const handleSetCommonFirstYear = () => {
    setBranch(['First Year Engineering (Common)']);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!file) {
      setError('Please select or drop a study document');
      toast.error('Please attach a document file');
      return;
    }

    if (!fileValidation.isValid) {
      setError(fileValidation.error || 'Invalid file');
      toast.error(fileValidation.error || 'Invalid file');
      return;
    }

    if (!subject.trim()) {
      setError('Subject Name is required to index the material');
      toast.error('Please enter the Subject Name');
      return;
    }

    if (!semester) {
      setError('Please select the Semester (1 to 8)');
      toast.error('Please select the Semester');
      return;
    }

    if (!university) {
      setIsAudienceExpanded(true);
      setError('Please select the Target University');
      toast.error('Please select a University');
      return;
    }

    if (!branch || branch.length === 0) {
      setIsAudienceExpanded(true);
      setError('Please select the Engineering Branch');
      toast.error('Please select a Branch');
      return;
    }

    const finalName = computedTitle || subject.trim();

    setUploading(true);

    try {
      // 1. Get presigned URL
      const presignRes = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          size: file.size
        })
      });
      
      const presignData = await presignRes.json();
      if (!presignRes.ok) throw new Error(presignData.error || 'Failed to get upload URL');

      // 2. Upload directly to S3 (Bypasses Vercel 4.5MB limit)
      const uploadRes = await fetch(presignData.presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
          'Content-Disposition': 'inline'
        }
      });

      if (!uploadRes.ok) throw new Error('Failed to upload file to storage');

      // 3. Confirm and save metadata
      const confirmRes = await fetch('/api/upload/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata: {
            name: finalName,
            subject: subject.trim(),
            category,
            semester,
            university,
            branch: branch.join(', '),
            year: category === 'pyq' ? year : '',
            uploadedBy: user ? (user.email || user.uid) : 'student'
          },
          fileDetails: {
            fileUrl: presignData.fileUrl,
            filename: presignData.secureFilename,
            originalName: presignData.sanitizedFilename,
            size: file.size,
            type: file.type
          }
        })
      });

      const confirmData = await confirmRes.json();
      if (!confirmRes.ok) throw new Error(confirmData.error || 'Failed to save metadata');

      toast.success('Document uploaded and indexed successfully!');
      setSuccess(true);

      // Reset form
      setFile(null);
      setSubject('');
      setTopic('');
      setCustomTitle('');
      setIsEditingTitle(false);
      setFileValidation({ isValid: false });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setTimeout(() => {
        setSuccess(false);
        router.push(category === 'pyq' ? '/pyqs' : '/notes');
      }, 1500);

    } catch (err) {
      console.error('Error uploading material:', err);
      const msg = err instanceof Error ? err.message : 'Failed to upload material';
      setError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="w-7 h-7 border-2 border-zinc-200 border-t-zinc-950 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <BackgroundGrid variant="grid" />
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Page Header */}
        <div className="border-b border-zinc-200 pb-5">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-500 font-medium">
              PEER ACADEMIC EXCHANGE
            </span>
          </div>
          <h1 className="text-3xl font-semibold text-zinc-950 tracking-tight">
            Contribute Study Resources
          </h1>
          <p className="text-xs text-zinc-500 mt-1 max-w-xl">
            Share past university exam papers, lecture notes, or syllabus digests with fellow students. All resources are peer-shared for non-commercial educational reference and exam prep.
          </p>
        </div>

        {/* Community Fair-Use & Educational Scope Banner */}
        <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-zinc-500 mt-0.5 shrink-0" />
          <div className="text-xs text-zinc-600 leading-relaxed">
            <strong className="text-zinc-900 font-medium">Community Study Archive:</strong> LastBench is an open peer repository. Students share syllabus question banks, lecture summaries, and handwritten notes to help each other prepare for exams with zero paywalls.
          </div>
        </div>

        {/* Upload Form Card */}
        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-zinc-200/90 p-6 sm:p-8 relative">
          
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800"
              >
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="text-xs">
                  <p className="font-semibold text-emerald-950">Material uploaded successfully!</p>
                  <p className="text-emerald-700 mt-0.5">Redirecting to repository archive...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-semibold text-rose-950">Submission Error</p>
                <p className="text-rose-700 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-7">

            {/* ========================================================================= */}
            {/* STEP 1: Drag & Drop File Upload Zone                                      */}
            {/* ========================================================================= */}
            <div>
              <label className="block text-xs font-semibold text-zinc-900 mb-2">
                1. Select or Drop Document File <span className="text-rose-500">*</span>
              </label>

              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (e.dataTransfer.files[0]) handleFileChange(e.dataTransfer.files[0]);
                }}
                className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center ${
                  isDragOver
                    ? 'border-zinc-950 bg-zinc-100/60'
                    : file && fileValidation.isValid
                      ? 'border-emerald-400 bg-emerald-50/40'
                      : file && !fileValidation.isValid
                        ? 'border-rose-400 bg-rose-50/40'
                        : 'border-zinc-200 hover:border-zinc-400 bg-zinc-50/50 hover:bg-zinc-50'
                }`}
              >
                {file ? (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3.5 rounded-xl border border-zinc-200">
                    <div className="flex items-center gap-3 truncate text-left w-full sm:w-auto">
                      <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-800 shrink-0">
                        <FileCheck className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-semibold text-zinc-950 truncate max-w-sm">
                          {file.name}
                        </p>
                        <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                          {fileValidation.size}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        setFileValidation({ isValid: false });
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="px-3 py-1.5 text-xs text-zinc-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-zinc-200"
                    >
                      Change File
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-700">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-semibold text-zinc-900">
                      Click to browse or drop your document here
                    </p>
                    <p className="text-[11px] text-zinc-400 font-mono">
                      PDF, DOCX, PPTX up to 100MB
                    </p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.webp"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
                  }}
                  className="hidden"
                />
              </div>
            </div>

            {/* ========================================================================= */}
            {/* STEP 2: Document Type (1-Tap Segmented Switch)                            */}
            {/* ========================================================================= */}
            <div>
              <label className="block text-xs font-semibold text-zinc-900 mb-2">
                2. Category
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCategory('note')}
                  className={`py-3 px-4 rounded-xl border text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    category === 'note'
                      ? 'bg-zinc-950 text-white border-zinc-950 shadow-sm'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-white hover:border-zinc-300'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Study Notes / Class Digest</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCategory('pyq')}
                  className={`py-3 px-4 rounded-xl border text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    category === 'pyq'
                      ? 'bg-zinc-950 text-white border-zinc-950 shadow-sm'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-white hover:border-zinc-300'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Past Exam Paper (PYQ)</span>
                </button>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* STEP 3: Unified Subject & Topic (No Redundant Typing)                     */}
            {/* ========================================================================= */}
            <div className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-zinc-900 mb-1.5">
                  3. Subject Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Operating Systems, Data Structures, Engineering Maths-3"
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-950 transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-zinc-900">
                    Topic or Unit Details <span className="text-zinc-400 font-normal">(Optional)</span>
                  </label>
                  {!isEditingTitle ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingTitle(true);
                        setCustomTitle(computedTitle);
                      }}
                      className="text-[11px] text-zinc-500 hover:text-zinc-950 underline transition-colors"
                    >
                      Customize Full Title
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditingTitle(false)}
                      className="text-[11px] text-zinc-500 hover:text-zinc-950 underline transition-colors flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Auto Title
                    </button>
                  )}
                </div>

                {!isEditingTitle ? (
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Unit 1 CPU Scheduling, Complete Insem Revision, Handwritten"
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-950 transition-colors"
                  />
                ) : (
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Enter custom full document title"
                    className="w-full px-4 py-2.5 bg-white border border-zinc-950 rounded-xl text-xs text-zinc-950 focus:outline-none transition-colors"
                  />
                )}

                {/* Auto Title Live Preview Pill */}
                {computedTitle && (
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-zinc-500 bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-200/80">
                    <Sparkles className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="font-mono text-zinc-400">Indexed Title:</span>
                    <strong className="text-zinc-800 font-medium truncate">{computedTitle}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* ========================================================================= */}
            {/* STEP 4: 1-Tap Semester & Exam Year Selection (Zero-Scroll Pills)           */}
            {/* ========================================================================= */}
            <div className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-zinc-900 mb-2">
                  4. Semester <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {SEMESTER_OPTIONS.map((semNum) => {
                    const active = semester === semNum;
                    return (
                      <button
                        key={semNum}
                        type="button"
                        onClick={() => setSemester(semNum)}
                        className={`py-2 px-1 text-center rounded-xl border text-xs font-mono font-medium transition-all cursor-pointer ${
                          active
                            ? 'bg-zinc-950 text-white border-zinc-950 shadow-sm'
                            : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-white hover:border-zinc-300'
                        }`}
                      >
                        Sem {semNum}
                      </button>
                    );
                  })}
                </div>
              </div>

              {category === 'pyq' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 pt-2 border-t border-zinc-100"
                >
                  <label className="block text-xs font-semibold text-zinc-900">
                    Exam Year <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {RECENT_YEARS.map((yr) => {
                      const active = year === yr;
                      return (
                        <button
                          key={yr}
                          type="button"
                          onClick={() => setYear(yr)}
                          className={`py-2 px-2 text-center rounded-xl border text-xs font-mono font-medium transition-all cursor-pointer ${
                            active
                              ? 'bg-zinc-950 text-white border-zinc-950 shadow-sm'
                              : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-white hover:border-zinc-300'
                          }`}
                        >
                          {yr}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </div>

            {/* ========================================================================= */}
            {/* STEP 5: Target University & Branch (Profile-Anchored with 1-Tap Override) */}
            {/* ========================================================================= */}
            <div className="pt-2 border-t border-zinc-100">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-900">
                    5. Academic Scope &amp; Target Audience
                  </label>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Controls branch vaults and syllabus feeds for students.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAudienceExpanded(!isAudienceExpanded)}
                  className="text-xs text-zinc-600 hover:text-zinc-950 font-medium inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors"
                >
                  <span>{isAudienceExpanded ? 'Hide' : 'Change Target'}</span>
                  {isAudienceExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Anchored Scope Summary Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 border border-zinc-200/80 text-xs font-medium text-zinc-800">
                  <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="truncate max-w-[240px]">
                    {university || 'Select University'}
                  </span>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 border border-zinc-200/80 text-xs font-medium text-zinc-800">
                  <GraduationCap className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="truncate max-w-[240px]">
                    {branch.length > 0 ? branch.join(', ') : 'Select Branch'}
                  </span>
                </div>

                {/* Quick 1-tap First Year Common Chip */}
                {!branch.includes('First Year Engineering (Common)') && (
                  <button
                    type="button"
                    onClick={handleSetCommonFirstYear}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-zinc-600 border border-dashed border-zinc-300 hover:border-zinc-950 hover:text-zinc-950 bg-white transition-colors"
                    title="Click if this material is common for all First Year students"
                  >
                    <span>+ Set First Year Common</span>
                  </button>
                )}
              </div>

              {/* Expandable Dropdowns for Custom University or Branch */}
              <AnimatePresence>
                {isAudienceExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-zinc-50/70 border border-zinc-200 mt-2"
                  >
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1">
                        University <span className="text-rose-500">*</span>
                      </label>
                      <SearchableSelect
                        required
                        value={university}
                        onChange={(val) => setUniversity(val)}
                        groups={UNIVERSITY_SELECT_GROUPS}
                        placeholder="Select University"
                        searchPlaceholder="Search Maharashtra university..."
                        buttonClassName="py-2.5 bg-white text-xs border-zinc-200"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1">
                        Engineering Branch <span className="text-rose-500">*</span>
                      </label>
                      <SearchableMultiSelect
                        required
                        value={branch}
                        onChange={(val: string[]) => setBranch(val)}
                        groups={BRANCH_SELECT_GROUPS}
                        placeholder="Select Engineering Branches"
                        searchPlaceholder="Search branch (CSE, IT, ENTC, etc.)..."
                        buttonClassName="py-2.5 bg-white text-xs border-zinc-200"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ========================================================================= */}
            {/* SUBMIT BUTTON                                                             */}
            {/* ========================================================================= */}
            <div className="pt-4 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-zinc-400">
                Peer academic exchange • 100% free open study access.
              </div>

              <button
                type="submit"
                disabled={uploading || !file || !subject.trim() || !semester}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-zinc-950 text-white font-medium text-xs hover:bg-zinc-800 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {uploading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Sharing &amp; Indexing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Share to Community Archive</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}
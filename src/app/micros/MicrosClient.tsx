'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { BackgroundGrid } from '@/components/ui/BackgroundGrid';
import { 
  FileUp, 
  FileText,
  Layers, 
  Scissors, 
  Sparkles, 
  Download, 
  Check, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { CURATED_MICRO_PACKS, CuratedMicroPack } from '@/lib/constants/microPacks';
import { generateMicroPdf, MicroOptions } from '@/lib/pdf/microEngine';
import { PDFDocument } from 'pdf-lib';

type TabType = 'upload' | 'curated';

interface UploadedFileInfo {
  name: string;
  size: number;
  bytes: Uint8Array;
  pageCount: number;
}

export default function MicrosClient() {
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [layout, setLayout] = useState<'4-in-1' | '8-in-1'>('4-in-1');
  const [imposition, setImposition] = useState<'sequential' | 'duplex-flip'>('sequential');
  const [showCutGuides, setShowCutGuides] = useState(true);
  const [showBorders, setShowBorders] = useState(true);

  // File Upload State
  const [uploadedFile, setUploadedFile] = useState<UploadedFileInfo | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Curated Packs State
  const [selectedPackId, setSelectedPackId] = useState<string>(CURATED_MICRO_PACKS[0].id);

  const searchParams = useSearchParams();

  // Preview & Generation State
  const [previewSheetIndex, setPreviewSheetIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [generatedPdfBlob, setGeneratedPdfBlob] = useState<Blob | null>(null);

  // Auto-load document if provided via ?src=...&title=...
  useEffect(() => {
    const src = searchParams.get('src');
    const title = searchParams.get('title');
    if (!src) return;

    let isMounted = true;
    const docUrl = `/api/preview?url=${encodeURIComponent(src)}`;
    
    // Defer state update slightly to avoid synchronous setState inside effect
    const timer = setTimeout(() => {
      setIsProcessing(true);
      fetch(docUrl)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch source document');
          return res.arrayBuffer();
        })
        .then(async (ab) => {
          if (!isMounted) return;
          const bytes = new Uint8Array(ab);
          const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
          setUploadedFile({
            name: title ? `${title}.pdf` : 'Selected_Notes.pdf',
            size: bytes.length,
            bytes,
            pageCount: pdfDoc.getPageCount(),
          });
        })
        .catch((err) => {
          console.error('Error auto-loading PDF from params:', err);
        })
        .finally(() => {
          if (isMounted) setIsProcessing(false);
        });
    }, 0);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchParams]);

  // Active Curated Pack
  const selectedPack = useMemo(() => {
    return CURATED_MICRO_PACKS.find((p) => p.id === selectedPackId) || CURATED_MICRO_PACKS[0];
  }, [selectedPackId]);

  // Total pages based on current mode
  const totalItemPages = useMemo(() => {
    return uploadedFile ? uploadedFile.pageCount : 0;
  }, [uploadedFile]);

  const perSheet = layout === '4-in-1' ? 4 : 8;
  const totalSheets = Math.max(1, Math.ceil(totalItemPages / perSheet));
  const safePreviewSheetIndex = Math.min(previewSheetIndex, Math.max(0, totalSheets - 1));

  // Paper savings calculation
  const paperSavings = useMemo(() => {
    if (totalItemPages === 0) return { sheets: 0, savedPercent: 0 };
    const saved = Math.max(0, totalItemPages - totalSheets);
    const savedPercent = Math.round((saved / totalItemPages) * 100);
    return { sheets: totalSheets, savedPercent };
  }, [totalItemPages, totalSheets]);

  // File Upload Handlers
  const processUploadedFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setFileError('Please select a valid PDF file.');
      return;
    }

    setFileError(null);
    setIsProcessing(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const pageCount = pdfDoc.getPageCount();

      if (pageCount === 0) {
        setFileError('The selected PDF contains no pages.');
        setIsProcessing(false);
        return;
      }

      setUploadedFile({
        name: file.name,
        size: file.size,
        bytes,
        pageCount,
      });
      setPreviewSheetIndex(0);
      setGeneratedPdfBlob(null);
      setDownloadSuccess(false);
    } catch (err) {
      console.error('Failed to parse PDF:', err);
      setFileError('Could not process this PDF. Make sure it is not password protected.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processUploadedFile(e.target.files[0]);
    }
  };

  // Generate & Download Handler
  const handleGenerateAndDownload = async () => {
    if (!uploadedFile) {
      setFileError('Please upload a PDF first.');
      return;
    }

    setIsProcessing(true);
    setDownloadSuccess(false);

    try {
      const opts: MicroOptions = {
        layout,
        imposition,
        showCutGuides,
        showBorders,
      };

      const outputBytes = await generateMicroPdf(uploadedFile.bytes, opts);

      // Convert to blob and trigger download
      const blob = new Blob([outputBytes as unknown as BlobPart], { type: 'application/pdf' });
      setGeneratedPdfBlob(blob);

      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const filePrefix = uploadedFile.name.replace(/\.pdf$/i, '');
      a.download = `Micro_${layout}_${filePrefix}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Error generating micro PDF:', err);
      setFileError('Failed to generate micro PDF. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 pb-24 relative overflow-hidden">
      <BackgroundGrid variant="grid" />

      {/* Hero Section */}
      <section className="pt-12 pb-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/5 border border-zinc-900/10 text-xs font-medium text-zinc-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>The 15-Minute Exam Revision Weapon</span>
            <span className="text-zinc-400">|</span>
            <span className="font-mono text-zinc-600">4-in-1 & 8-in-1 Pocket Sheets</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-zinc-950 font-sans">
            LastBench Micros
          </h1>

          <p className="text-sm sm:text-base text-zinc-600 leading-relaxed max-w-2xl mx-auto">
            Transform heavy syllabus PDFs, question banks, or notes into easy-to-read, 
            foldable pocket sheets. Super clean text, zero xerox smudges, and built-in cut lines.
          </p>

          {/* Quick Value Metrics */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs text-zinc-600 font-mono">
            <div className="px-3 py-1 rounded-md bg-white border border-zinc-200/80 shadow-xs flex items-center gap-1.5">
              <Scissors className="w-3.5 h-3.5 text-zinc-500" />
              <span>Dotted Fold & Cut Marks</span>
            </div>
            <div className="px-3 py-1 rounded-md bg-white border border-zinc-200/80 shadow-xs flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-zinc-500" />
              <span>Double-Sided Print Ready</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Interactive Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Tabs (Upload vs Curated Packs) */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1.5 bg-zinc-200/60 rounded-xl border border-zinc-300/50 shadow-inner max-w-full overflow-x-auto">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'upload'
                  ? 'bg-white text-zinc-950 shadow-xs font-semibold'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              <FileUp className="w-4 h-4" />
              <span>Upload Custom PDF</span>
            </button>

            <button
              onClick={() => setActiveTab('curated')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'curated'
                  ? 'bg-white text-zinc-950 shadow-xs font-semibold'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>LastBench Cram-Packs</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                Coming Soon
              </span>
            </button>
          </div>
        </div>

        {/* Workspace 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Input Source & Configuration (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* TAB 1: FILE UPLOAD ZONE */}
            {activeTab === 'upload' && (
              <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 sm:p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-semibold text-zinc-950">Upload Your Document</h2>
                    <p className="text-xs text-zinc-500">Any notes, university course pack, or exam question bank</p>
                  </div>
                  {uploadedFile && (
                    <button
                      onClick={() => {
                        setUploadedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                {!uploadedFile ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                      isDragging
                        ? 'border-zinc-950 bg-zinc-50'
                        : 'border-zinc-300 hover:border-zinc-400 bg-zinc-50/50 hover:bg-zinc-50'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                    <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-3 border border-zinc-200">
                      <FileUp className="w-6 h-6 text-zinc-700" />
                    </div>
                    <p className="text-sm font-medium text-zinc-800">
                      Click to upload or drag & drop PDF here
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-zinc-900 text-white flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-900 truncate">{uploadedFile.name}</p>
                        <p className="text-xs text-zinc-500 font-mono">
                          {uploadedFile.pageCount} pages • {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium shrink-0">
                      <Check className="w-3.5 h-3.5" />
                      Ready
                    </span>
                  </div>
                )}

                {fileError && (
                  <div className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{fileError}</span>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: CURATED CRAM-PACKS (COMING SOON) */}
            {activeTab === 'curated' && (
              <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 sm:p-6 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
                  <div>
                    <h2 className="text-base font-semibold text-zinc-950">Subject Cram-Packs</h2>
                    <p className="text-xs text-zinc-500">
                      Summary sheets, key formulas, diagrams & exam tables
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {CURATED_MICRO_PACKS.map((pack) => {
                    const isSelected = pack.id === selectedPackId;
                    return (
                      <div
                        key={pack.id}
                        onClick={() => setSelectedPackId(pack.id)}
                        className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'border-zinc-950 bg-zinc-950 text-white shadow-sm'
                            : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50/60 hover:bg-zinc-50 text-zinc-900'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              isSelected
                                ? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                                : 'bg-zinc-200/80 text-zinc-700 border border-zinc-300'
                            }`}
                          >
                            {pack.code}
                          </span>
                          <span
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                              isSelected ? 'bg-amber-400/20 text-amber-300' : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            Coming Soon
                          </span>
                        </div>

                        <h3 className="text-sm font-semibold leading-snug mb-1">{pack.subject}</h3>
                        <p
                          className={`text-xs line-clamp-2 leading-relaxed ${
                            isSelected ? 'text-zinc-400' : 'text-zinc-500'
                          }`}
                        >
                          {pack.description}
                        </p>

                        <div className="mt-3 pt-2.5 border-t border-zinc-200/40 flex items-center justify-between text-[11px] font-mono">
                          <span className={isSelected ? 'text-zinc-400' : 'text-zinc-500'}>
                            {pack.topicsPlanned.length} Micro Topics
                          </span>
                          <span className={isSelected ? 'text-zinc-300' : 'text-zinc-700 font-medium'}>
                            {pack.semester}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* MICRO LAYOUT & IMPOSITION CONFIGURATION */}
            {activeTab === 'upload' && (
              <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 sm:p-6 shadow-xs space-y-6">
                <div>
                  <h2 className="text-base font-semibold text-zinc-950">Pocket Sheet Format & Layout</h2>
                  <p className="text-xs text-zinc-500">Choose how many pages to fit on one sheet</p>
                </div>

                {/* 4-in-1 vs 8-in-1 Selection Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* 4-in-1 Option */}
                  <div
                    onClick={() => setLayout('4-in-1')}
                    className={`p-4 rounded-xl border-2 text-left cursor-pointer transition-all ${
                      layout === '4-in-1'
                        ? 'border-zinc-950 bg-zinc-900 text-white shadow-md'
                        : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50/50 text-zinc-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold font-mono tracking-tight">4-IN-1 QUAD</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                          layout === '4-in-1'
                            ? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                            : 'bg-zinc-200 text-zinc-700'
                        }`}
                      >
                        A6 Palm Size
                      </span>
                    </div>

                    {/* 2x2 Grid Schematic */}
                    <div className="my-3 flex items-center justify-center">
                      <div className="w-20 h-28 border border-dashed border-current rounded p-1 grid grid-cols-2 grid-rows-2 gap-1 opacity-90">
                        <div className="border border-current rounded-xs flex items-center justify-center text-[9px] font-mono">1</div>
                        <div className="border border-current rounded-xs flex items-center justify-center text-[9px] font-mono">2</div>
                        <div className="border border-current rounded-xs flex items-center justify-center text-[9px] font-mono">3</div>
                        <div className="border border-current rounded-xs flex items-center justify-center text-[9px] font-mono">4</div>
                      </div>
                    </div>

                    <p className="text-xs font-medium text-center mb-1">2 Columns × 2 Rows (A4 Portrait)</p>
                    <p
                      className={`text-[11px] text-center leading-normal ${
                        layout === '4-in-1' ? 'text-zinc-300' : 'text-zinc-500'
                      }`}
                    >
                      Optimal balance of razor-sharp readability and compact palm size. Best for derivations & diagrams.
                    </p>
                  </div>

                  {/* 8-in-1 Option */}
                  <div
                    onClick={() => setLayout('8-in-1')}
                    className={`p-4 rounded-xl border-2 text-left cursor-pointer transition-all ${
                      layout === '8-in-1'
                        ? 'border-zinc-950 bg-zinc-900 text-white shadow-md'
                        : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50/50 text-zinc-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold font-mono tracking-tight">8-IN-1 ULTRA MICRO</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                          layout === '8-in-1'
                            ? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                            : 'bg-zinc-200 text-zinc-700'
                        }`}
                      >
                        A7 Pocket Size
                      </span>
                    </div>

                    {/* 4x2 Grid Schematic */}
                    <div className="my-3 flex items-center justify-center">
                      <div className="w-32 h-20 border border-dashed border-current rounded p-1 grid grid-cols-4 grid-rows-2 gap-0.5 opacity-90">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                          <div key={n} className="border border-current rounded-xs flex items-center justify-center text-[8px] font-mono">
                            {n}
                          </div>
                        ))}
                      </div>
                    </div>

                    <p className="text-xs font-medium text-center mb-1">4 Columns × 2 Rows (A4 Landscape)</p>
                    <p
                      className={`text-[11px] text-center leading-normal ${
                        layout === '8-in-1' ? 'text-zinc-300' : 'text-zinc-500'
                      }`}
                    >
                      The legendary xerox-shop replacement. Fits 8 full pages per sheet side. Maximum compression.
                    </p>
                  </div>
                </div>

                {/* Printing Mode & Folding Alignment */}
                <div className="pt-2 border-t border-zinc-100 space-y-3">
                  <label className="text-xs font-semibold text-zinc-900 uppercase tracking-wider font-mono">
                    Page Order & Double-Sided Folding
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setImposition('sequential')}
                      className={`p-3 rounded-xl border text-left text-xs transition-colors ${
                        imposition === 'sequential'
                          ? 'border-zinc-950 bg-zinc-100 text-zinc-950 font-medium'
                          : 'border-zinc-200 text-zinc-600 hover:border-zinc-300'
                      }`}
                    >
                      <p className="font-semibold text-zinc-900 mb-0.5">Normal Order (1, 2, 3...)</p>
                      <p className="text-[11px] text-zinc-500 leading-normal">
                        Pages ordered 1, 2, 3, 4 sequentially. Great for cutting into separate pocket flashcards.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setImposition('duplex-flip')}
                      className={`p-3 rounded-xl border text-left text-xs transition-colors ${
                        imposition === 'duplex-flip'
                          ? 'border-zinc-950 bg-zinc-100 text-zinc-950 font-medium'
                          : 'border-zinc-200 text-zinc-600 hover:border-zinc-300'
                      }`}
                    >
                      <p className="font-semibold text-zinc-900 mb-0.5">Double-Sided Book Fold</p>
                      <p className="text-[11px] text-zinc-500 leading-normal">
                        Mirrors back-side columns so front and back pages match when folded.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Toggles (Cut guides, borders) */}
                <div className="pt-2 border-t border-zinc-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 text-xs text-zinc-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showCutGuides}
                      onChange={(e) => setShowCutGuides(e.target.checked)}
                      className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-950"
                    />
                    <span>Dotted Cut Guides</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-zinc-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showBorders}
                      onChange={(e) => setShowBorders(e.target.checked)}
                      className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-950"
                    />
                    <span>Card Outlines</span>
                  </label>
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Live Sheet Preview or Curated Pack Roadmap (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {activeTab === 'curated' ? (
              /* Curated Pack Information Card */
              <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 sm:p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <h3 className="text-xs font-semibold text-zinc-950 uppercase tracking-wider font-mono">
                      Selected Pack Preview
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    Coming Soon
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
                      {selectedPack.code}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-500">
                      {selectedPack.semester}
                    </span>
                  </div>
                  <h4 className="text-base font-semibold text-zinc-950">{selectedPack.subject}</h4>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{selectedPack.description}</p>
                </div>

                <div className="space-y-2 pt-1">
                  <p className="text-xs font-semibold text-zinc-900 uppercase font-mono tracking-wider">
                    Topics Included in This Pack:
                  </p>
                  <div className="space-y-1.5">
                    {selectedPack.topicsPlanned.map((t, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 p-2 rounded-xl bg-zinc-50 border border-zinc-200/60 text-xs text-zinc-700">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        <span>{t}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/70 text-xs text-amber-900 space-y-1.5">
                  <p className="font-semibold text-zinc-950 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Official Subject Micro Notes
                  </p>
                  <p className="text-[11px] text-zinc-600 leading-relaxed">
                    Curated revision sheets designed specifically for fast exam revision and easy pocket folding.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className="w-full py-3 px-4 bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-xs sm:text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
                >
                  <span>Need an instant micro? Upload your own PDF</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Live Sheet Preview & Download Action for Uploaded PDF */
              <>
                {/* Real-time Paper Savings Badge */}
                <div className="p-4 rounded-2xl bg-zinc-950 text-white shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">Yield Summary</span>
                    </div>
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {layout}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-center pt-2 border-t border-zinc-800">
                    <div>
                      <p className="text-[11px] text-zinc-400">Original</p>
                      <p className="text-lg font-bold font-mono text-white">{totalItemPages} <span className="text-xs font-normal text-zinc-400">pg</span></p>
                    </div>
                    <div>
                      <p className="text-[11px] text-zinc-400">Micro Sheets</p>
                      <p className="text-lg font-bold font-mono text-emerald-400">{totalSheets} <span className="text-xs font-normal text-zinc-400">A4</span></p>
                    </div>
                    <div>
                      <p className="text-[11px] text-zinc-400">Paper Saved</p>
                      <p className="text-lg font-bold font-mono text-amber-400">{paperSavings.savedPercent}%</p>
                    </div>
                  </div>
                </div>

                {/* Interactive Sheet Preview Card */}
                <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-zinc-600" />
                      <h3 className="text-xs font-semibold text-zinc-950 uppercase tracking-wider font-mono">
                        Sheet Preview
                      </h3>
                    </div>

                    {/* Sheet Pagination */}
                    {totalSheets > 1 && (
                      <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-600">
                        <button
                          onClick={() => setPreviewSheetIndex(Math.max(0, safePreviewSheetIndex - 1))}
                          disabled={safePreviewSheetIndex === 0}
                          className="p-1 rounded hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <span>
                          {safePreviewSheetIndex + 1} / {totalSheets}
                        </span>
                        <button
                          onClick={() => setPreviewSheetIndex(Math.min(totalSheets - 1, safePreviewSheetIndex + 1))}
                          disabled={safePreviewSheetIndex >= totalSheets - 1}
                          className="p-1 rounded hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* True-to-Aspect Ratio A4 Canvas Container */}
                  <div className="flex items-center justify-center p-3 sm:p-4 bg-zinc-100/80 rounded-xl border border-zinc-200 overflow-hidden">
                    <div
                      className={`bg-white border border-zinc-300 shadow-sm rounded-sm p-2 flex flex-col transition-all duration-300 ${
                        layout === '4-in-1'
                          ? 'w-[260px] h-[368px]' // A4 Portrait Aspect Ratio (1 : 1.414)
                          : 'w-[340px] h-[240px]' // A4 Landscape Aspect Ratio (1.414 : 1)
                      }`}
                    >
                      {/* Grid Cells */}
                      <div
                        className={`flex-1 grid gap-1.5 relative ${
                          layout === '4-in-1' ? 'grid-cols-2 grid-rows-2' : 'grid-cols-4 grid-rows-2'
                        }`}
                      >
                        {/* Dotted Cut Lines Overlay */}
                        {showCutGuides && (
                          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                            <div className="w-full border-t border-dashed border-zinc-400" />
                            <div className="h-full border-l border-dashed border-zinc-400 absolute" />
                          </div>
                        )}

                        {/* Individual Slot Cards */}
                        {Array.from({ length: perSheet }).map((_, slotIdx) => {
                          const absolutePageIdx = safePreviewSheetIndex * perSheet + slotIdx;
                          const hasPage = absolutePageIdx < totalItemPages;

                          const cardTitle = `P.${absolutePageIdx + 1}`;
                          const cardSub = uploadedFile ? uploadedFile.name : 'PAGE';

                          return (
                            <div
                              key={slotIdx}
                              className={`rounded-xs p-1.5 flex flex-col justify-between text-[8px] transition-colors relative overflow-hidden ${
                                showBorders ? 'border border-zinc-200' : ''
                              } ${hasPage ? 'bg-zinc-50/80 text-zinc-800' : 'bg-zinc-100/40 text-zinc-300'}`}
                            >
                              {hasPage ? (
                                <>
                                  <div>
                                    <div className="flex items-center justify-between text-[6.5px] font-mono text-zinc-400 mb-0.5">
                                      <span className="truncate max-w-[50px]">{cardSub}</span>
                                      <span className="font-bold text-zinc-600">#{absolutePageIdx + 1}</span>
                                    </div>
                                    <p className="font-semibold text-[7.5px] leading-tight text-zinc-900 truncate">
                                      {cardTitle}
                                    </p>
                                  </div>
                                  <div className="pt-0.5 flex items-center justify-end text-[6px] text-zinc-400 font-mono">
                                    <span>P.{absolutePageIdx + 1}</span>
                                  </div>
                                </>
                              ) : (
                                <div className="h-full flex items-center justify-center text-[7px] font-mono text-zinc-300">
                                  [BLANK SLOT]
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleGenerateAndDownload}
                      disabled={isProcessing || totalItemPages === 0}
                      className="w-full py-3.5 px-4 bg-zinc-950 hover:bg-zinc-800 disabled:bg-zinc-300 text-white font-medium text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Preparing your pocket sheet...</span>
                        </>
                      ) : downloadSuccess ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span>Downloaded Successfully!</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>Download {layout} Micro PDF</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Pocket Folding Instructions Accordion */}
                <div className="p-4 rounded-xl border border-zinc-200 bg-white space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-zinc-900 font-semibold font-mono uppercase text-[11px]">
                    <Scissors className="w-3.5 h-3.5 text-zinc-700" />
                    <span>Double-Sided Folding Guide</span>
                  </div>
                  <p className="text-zinc-600 leading-relaxed text-[11px]">
                    1. Print on standard A4 paper with scale set to <strong>100%</strong> or <strong>Fit</strong>.<br />
                    2. Fold horizontally along the center dashed line.<br />
                    3. Fold vertically in half (for 4-in-1) or accordion-fold (for 8-in-1) to create an ultra-compact pocket booklet that fits comfortably into your palm or shirt pocket.
                  </p>
                </div>
              </>
            )}

          </div>

        </div>
      </main>
    </div>
  );
}

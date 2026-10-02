'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthModal } from '@/context/AuthModalContext';
import { BackgroundGrid } from '@/components/ui/BackgroundGrid';
import { Folder } from '@/components/ui/Folder';
import { 
  ArrowRight, 
  BookOpen, 
  FileText, 
  UploadCloud, 
  Search, 
  CheckCircle2, 
  GraduationCap, 
  Flame, 
  ShieldCheck, 
  Layers, 
  ChevronRight,
  BookmarkCheck
} from 'lucide-react';

interface SubjectPill {
  id: string;
  name: string;
  semester: string;
  branch: string;
  topics: string;
}


const UniversityLogo = ({ uni }: { uni: { name: string, src: string, invert?: boolean } }) => {
  const [error, setError] = React.useState(false);
  return (
    <div 
      className="flex items-center justify-center opacity-40 hover:opacity-100 transition-all duration-300 grayscale hover:grayscale-0 cursor-pointer hover:scale-110 shrink-0"
      title={uni.name}
    >
      <div className="relative h-16 w-16 sm:h-24 sm:w-24 flex items-center justify-center shrink-0">
        {!error ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={uni.src}
            alt={uni.name} 
            className={`object-contain max-w-full max-h-full drop-shadow-sm ${uni.invert ? 'invert' : ''}`}
            onError={() => setError(true)}
          />
        ) : (
          <div className="h-full w-full rounded-full bg-zinc-100 border-2 border-zinc-200 flex items-center justify-center text-zinc-400 font-black text-2xl">
            {uni.name[0]}
          </div>
        )}
      </div>
    </div>
  );
};

export function GuestLanding() {
  const router = useRouter();
  const { openAuthModal } = useAuthModal();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBranchTab, setActiveBranchTab] = useState<'comp' | 'it' | 'aids' | 'entc' | 'mech' | 'fe'>('comp');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/notes?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const [trendingTopics, setTrendingTopics] = useState<{ label: string; query: string }[]>([]);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const q = query(
          collection(db, 'materials'),
          orderBy('uploadedAt', 'desc'),
          limit(40)
        );
        const snapshot = await getDocs(q);
        const subjectCounts = new Map<string, number>();
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const sub = (data.subject || '').trim();
          if (sub) {
            subjectCounts.set(sub, (subjectCounts.get(sub) || 0) + 1);
          }
        });
        const dynamicTrending = Array.from(subjectCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([subj]) => ({ label: subj, query: subj }));
        setTrendingTopics(dynamicTrending);
      } catch (err) {
        console.error('Failed to load dynamic trending subjects in GuestLanding:', err);
      }
    };

    fetchTrending();
  }, []);

  const premierUniversities = [
    { name: 'Savitribai Phule Pune University (SPPU)', short: 'SPPU Pune', filter: 'SPPU' },
    { name: 'University of Mumbai (MU)', short: 'Mumbai University', filter: 'Mumbai' },
    { name: 'Dr. Babasaheb Ambedkar Tech Univ', short: 'DBATU Lonere', filter: 'DBATU' },
    { name: 'COEP Technological University', short: 'COEP Tech', filter: 'COEP' },
    { name: 'Veermata Jijabai Tech Inst', short: 'VJTI Mumbai', filter: 'VJTI' },
    { name: 'RTM Nagpur University', short: 'RTMNU Nagpur', filter: 'Nagpur' },
    { name: 'Walchand College of Engineering', short: 'Walchand Sangli', filter: 'Walchand' },
    { name: 'ICT Mumbai', short: 'ICT Mumbai', filter: 'ICT' },
  ];

  const branchData: Record<string, {
    title: string;
    description: string;
    branchFilter: string;
    subjects: SubjectPill[];
  }> = {
    comp: {
      title: 'Computer Engineering',
      description: 'Core curriculum algorithms, software architecture, operating systems, and theory.',
      branchFilter: 'Computer Engineering',
      subjects: [
        { id: 'c1', name: 'Data Structures & Algorithms', semester: 'Sem 3', branch: 'Computer', topics: 'Arrays, Trees, Graphs, Sorting' },
        { id: 'c2', name: 'Operating Systems & Concurrency', semester: 'Sem 4', branch: 'Computer', topics: 'Processes, Memory, Deadlocks, Paging' },
        { id: 'c3', name: 'Database Management Systems', semester: 'Sem 4', branch: 'Computer', topics: 'SQL, Normalization, Transactions, ACID' },
        { id: 'c4', name: 'Theory of Computation (TOC)', semester: 'Sem 5', branch: 'Computer', topics: 'DFA/NFA, Grammars, Turing Machines' },
      ],
    },
    it: {
      title: 'Information Technology',
      description: 'Distributed networks, web architectures, information security, and cloud systems.',
      branchFilter: 'Information Technology (IT)',
      subjects: [
        { id: 'i1', name: 'Computer Networks & Security', semester: 'Sem 4', branch: 'IT', topics: 'TCP/IP, Routing, OSI Layers, Cryptography' },
        { id: 'i2', name: 'Web Application Development', semester: 'Sem 4', branch: 'IT', topics: 'REST APIs, Full-stack, Authentication' },
        { id: 'i3', name: 'Software Engineering & Agile', semester: 'Sem 5', branch: 'IT', topics: 'Design Patterns, SDLC, Testing Suites' },
        { id: 'i4', name: 'Cloud Computing & Virtualization', semester: 'Sem 6', branch: 'IT', topics: 'AWS, Microservices, Containers, Docker' },
      ],
    },
    aids: {
      title: 'Artificial Intelligence & Data Science',
      description: 'Machine learning fundamentals, deep learning, statistical modeling, and neural nets.',
      branchFilter: 'Artificial Intelligence & Data Science (AI & DS)',
      subjects: [
        { id: 'a1', name: 'Foundations of Machine Learning', semester: 'Sem 4', branch: 'AI & DS', topics: 'Regression, Classification, Clustering' },
        { id: 'a2', name: 'Probability & Statistics for AI', semester: 'Sem 3', branch: 'AI & DS', topics: 'Bayes Theorem, Random Variables, Distributions' },
        { id: 'a3', name: 'Deep Learning & Neural Networks', semester: 'Sem 6', branch: 'AI & DS', topics: 'Backprop, CNNs, RNNs, Transformers' },
        { id: 'a4', name: 'Big Data Analytics & Spark', semester: 'Sem 5', branch: 'AI & DS', topics: 'Hadoop, PySpark, MapReduce, Pipelines' },
      ],
    },
    entc: {
      title: 'Electronics & Telecommunication',
      description: 'Signal processing, microcontrollers, embedded systems, and RF communications.',
      branchFilter: 'Electronics & Telecommunication Engineering (ENTC)',
      subjects: [
        { id: 'e1', name: 'Signals & Systems Analysis', semester: 'Sem 3', branch: 'ENTC', topics: 'Fourier Transform, Laplace, Z-Transform' },
        { id: 'e2', name: 'Digital Signal Processing (DSP)', semester: 'Sem 5', branch: 'ENTC', topics: 'FIR/IIR Filters, DFT, FFT Algorithms' },
        { id: 'e3', name: 'Microcontroller Architecture', semester: 'Sem 4', branch: 'ENTC', topics: 'ARM Cortex, 8051, Timers, Interrupts' },
        { id: 'e4', name: 'Electromagnetics & Antennas', semester: 'Sem 4', branch: 'ENTC', topics: 'Maxwell Equations, Waveguides, Radiation' },
      ],
    },
    mech: {
      title: 'Mechanical & Automation',
      description: 'Thermal dynamics, fluid mechanics, CAD/CAM manufacturing, and robotics.',
      branchFilter: 'Mechanical Engineering',
      subjects: [
        { id: 'm1', name: 'Thermodynamics & Heat Transfer', semester: 'Sem 3', branch: 'Mechanical', topics: 'Carnot Cycles, Entropy, Conduction' },
        { id: 'm2', name: 'Strength of Materials (SOM)', semester: 'Sem 3', branch: 'Mechanical', topics: 'Stress-Strain, Bending Moment, Shear' },
        { id: 'm3', name: 'Fluid Mechanics & Machinery', semester: 'Sem 4', branch: 'Mechanical', topics: 'Bernoulli, Navier-Stokes, Turbines' },
        { id: 'm4', name: 'Theory of Machines & Kinematics', semester: 'Sem 4', branch: 'Mechanical', topics: 'Gears, Cams, Flywheels, Vibrations' },
      ],
    },
    fe: {
      title: 'First Year Engineering (Common)',
      description: 'Foundational mathematics, basic electrical, engineering mechanics, and chemistry.',
      branchFilter: 'First Year Engineering (Common)',
      subjects: [
        { id: 'f1', name: 'Engineering Mathematics I & II', semester: 'Sem 1-2', branch: 'First Year', topics: 'Calculus, Matrices, Differential Equations' },
        { id: 'f2', name: 'Engineering Mechanics', semester: 'Sem 1-2', branch: 'First Year', topics: 'Statics, Kinetics, Trusses, Friction' },
        { id: 'f3', name: 'Basic Electrical & Electronics', semester: 'Sem 1-2', branch: 'First Year', topics: 'Kirchhoff Laws, AC Circuits, Diodes' },
        { id: 'f4', name: 'Engineering Physics & Chemistry', semester: 'Sem 1-2', branch: 'First Year', topics: 'Quantum Basics, Lasers, Polymers' },
      ],
    },
  };

  const noteFolderItems = [
    { id: '1', title: 'Data Structures & Algorithms', subtitle: 'Sem 3 • Computer Engineering', tag: 'CSE' },
    { id: '2', title: 'Signals & Systems Analysis', subtitle: 'Sem 4 • Electronics & Telecom', tag: 'ENTC' },
    { id: '3', title: 'Thermodynamics & Heat Transfer', subtitle: 'Sem 3 • Mechanical Engineering', tag: 'MECH' },
  ];

  const pyqFolderItems = [
    { id: 'p1', title: 'End-Sem 2024 Question Paper', subtitle: 'Operating Systems • SPPU / MU', tag: '2024' },
    { id: 'p2', title: 'In-Sem 2023 Exam Paper', subtitle: 'Database Management Systems', tag: '2023' },
    { id: 'p3', title: 'Winter 2022 Question Bank', subtitle: 'Computer Networks & Security', tag: '2022' },
  ];

  const activeBranch = branchData[activeBranchTab];

  return (
    <div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-zinc-50/50">
      <BackgroundGrid variant="both" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-16 space-y-12 sm:space-y-16">
        
        {/* ========================================================================= */}
        {/* 1. HERO SECTION: Compact Headline, Search Bar, Trending Chips             */}
        {/* ========================================================================= */}
        <section className="text-center max-w-4xl mx-auto pt-2">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            {/* Live Indicator Chip */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-zinc-200/90 bg-white/95 shadow-[0_1px_3px_rgba(0,0,0,0.03)] mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] text-zinc-700 font-medium">
                Maharashtra Engineering Archive • 100% Free Online Preview
              </span>
            </div>

            {/* Architectural Headline */}
            <h1 className="text-3xl sm:text-5xl font-semibold text-zinc-950 tracking-tight leading-[1.15] mb-4">
              Engineering Notes &amp; PYQs, Built for Last-Night Prep.
            </h1>

            {/* Clear, Student-Friendly Subtitle */}
            <p className="text-sm sm:text-base text-zinc-600 mb-6 max-w-2xl mx-auto leading-relaxed">
              Concise lecture summaries, verified previous year question papers, and syllabus cheat-sheets across 30+ universities. Free in-browser reading with zero paywalls.
            </p>

            {/* Large Interactive Command Search Bar */}
            <div className="max-w-2xl mx-auto mb-4">
              <form onSubmit={handleSearchSubmit} className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-zinc-950 transition-colors">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by subject, code, or topic (e.g. Data Structures, M3, SPPU)..."
                  className="w-full pl-11 pr-28 py-3.5 bg-white border border-zinc-200/90 rounded-2xl text-xs sm:text-sm text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950/10 focus:border-zinc-950 shadow-[0_1px_4px_rgba(0,0,0,0.03)] transition-all"
                />
                <div className="absolute inset-y-1.5 right-1.5 flex items-center">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium rounded-xl transition-colors shadow-sm"
                  >
                    <span>Search</span>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-300" />
                  </button>
                </div>
              </form>
            </div>

            {/* Dynamic Trending / High-Yield Subject Chips */}
            {trendingTopics.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto text-xs">
                <span className="inline-flex items-center gap-1 text-[11px] text-zinc-600 font-medium">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <span>Trending:</span>
                </span>
                {trendingTopics.map((topic) => (
                  <Link
                    key={topic.label}
                    href={`/notes?search=${encodeURIComponent(topic.query)}`}
                    className="px-2.5 py-0.5 rounded-lg border border-zinc-200/80 bg-white/90 hover:bg-zinc-950 hover:text-white hover:border-zinc-950 text-zinc-600 text-[11px] font-medium transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                  >
                    {topic.label}
                  </Link>
                ))}
              </div>
            )}

            {/* Action Row */}
            <div className="mt-6 flex flex-wrap justify-center items-center gap-3">
              <Link
                href="/notes"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-950 text-white text-xs font-medium hover:bg-zinc-800 transition-colors shadow-sm"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Browse Lecture Notes</span>
              </Link>
              <Link
                href="/pyqs"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-800 text-xs font-medium hover:bg-zinc-50 transition-colors shadow-sm"
              >
                <FileText className="w-3.5 h-3.5 text-zinc-500" />
                <span>Question Papers</span>
              </Link>
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100/90 border border-zinc-200/60 text-zinc-700 text-xs font-medium hover:bg-zinc-200 transition-colors"
              >
                <UploadCloud className="w-3.5 h-3.5 text-zinc-500" />
                <span>Upload Material</span>
              </Link>
            </div>
          </motion.div>
        </section>


        {/* ========================================================================= */}
        {/* 1.5. UNIVERSITY MARQUEE HOOK (Added per request)                          */}
        {/* ========================================================================= */}
        <section className="w-full overflow-hidden py-4 sm:py-8 relative border-t border-b border-zinc-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.01)] my-8">
          <div className="absolute inset-y-0 left-0 w-16 sm:w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-16 sm:w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
          
          <div className="flex w-max animate-marquee items-center">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex gap-12 sm:gap-20 items-center px-6 sm:px-10 shrink-0">
                {[
                  { name: 'Pune University (SPPU)', src: '/logos/Pune.png' },
                  { name: 'Mumbai University', src: '/logos/Mumbai.png', invert: true },
                  { name: 'Shivaji University', src: '/logos/Shivaji.jpg' },
                  { name: 'DBATU', src: '/logos/DBATU.png' },
                  { name: 'Nagpur University', src: '/logos/Nagpur.png' },
                  { name: 'Amravati University', src: '/logos/Amravati.jpg' },
                  { name: 'BAMU', src: '/logos/BAMU.png' },
                ].map((uni, j) => (
                  <UniversityLogo key={`${i}-${j}`} uni={uni} />
                ))}
              </div>
            ))}
          </div>
          
          <style jsx>{`
            @keyframes marquee {
              0% { transform: translateX(0%); }
              100% { transform: translateX(-50%); }
            }
            .animate-marquee {
              animation: marquee 35s linear infinite;
            }
            .animate-marquee:hover {
              animation-play-state: paused;
            }
          `}</style>
        </section>

        {/* ========================================================================= */}
        {/* 2. CORE STUDY REPOSITORIES (Moved Up Right Under The Hero!)               */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-zinc-200 pb-3">
            <div>
              <div className="inline-flex items-center gap-1.5 text-zinc-600 text-xs font-medium mb-1">
                <BookmarkCheck className="w-3.5 h-3.5 text-zinc-600" />
                <span>STUDY ARCHIVES</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-zinc-950 tracking-tight">
                Interactive Study Repositories
              </h2>
            </div>
            <p className="text-xs text-zinc-500">
              Hover folders to preview internal documents. Free in-browser reading on desktop &amp; mobile.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto pt-2">
            <Folder
              title="Comprehensive Lecture Notes"
              count={48}
              category="Study Materials"
              href="/notes"
              items={noteFolderItems}
            />

            <Folder
              title="University Previous Year Papers"
              count={32}
              category="Exam PYQs"
              href="/pyqs"
              items={pyqFolderItems}
            />
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. MAHARASHTRA UNIVERSITY QUICK-SELECTOR RIBBON (Hook 2 - Fluid Strip)    */}
        {/* ========================================================================= */}
        <section className="pt-1">
          <div className="border border-zinc-200/80 bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-zinc-700" />
                <h3 className="text-xs font-semibold text-zinc-950 tracking-tight">
                  Browse Resources by Maharashtra University
                </h3>
              </div>
              <Link
                href="/notes"
                className="text-[11px] font-medium text-zinc-500 hover:text-zinc-950 inline-flex items-center gap-1 transition-colors"
              >
                <span>View all 30+ universities</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {premierUniversities.map((univ) => (
                <Link
                  key={univ.short}
                  href={`/notes?university=${encodeURIComponent(univ.filter)}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:border-zinc-400 hover:bg-zinc-50 text-zinc-800 text-xs font-medium transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                  <span>{univ.short}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. INTERACTIVE CURRICULUM NAVIGATOR (Hook 3 - Breaks "Boxes Boxes")       */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 border-b border-zinc-200 pb-3">
            <div>
              <div className="inline-flex items-center gap-1.5 text-zinc-700 text-xs font-medium mb-1">
                <Layers className="w-3.5 h-3.5 text-zinc-600" />
                <span>CURRICULUM NAVIGATOR</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-zinc-950 tracking-tight">
                Explore Core Subjects by Branch
              </h2>
            </div>
            <p className="text-xs text-zinc-500 max-w-sm">
              Instant access to high-yield semester notes and university past questions for your specific engineering stream.
            </p>
          </div>

          {/* Interactive Branch Switcher Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {([
              { id: 'comp' as const, label: 'Computer Engineering' },
              { id: 'it' as const, label: 'Information Tech' },
              { id: 'aids' as const, label: 'AI & Data Science' },
              { id: 'entc' as const, label: 'Electronics & Telecom' },
              { id: 'mech' as const, label: 'Mechanical' },
              { id: 'fe' as const, label: 'First Year (FE)' },
            ]).map((tab) => {
              const active = activeBranchTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveBranchTab(tab.id)}
                  className={`relative px-4 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                    active
                      ? 'bg-zinc-950 text-white shadow-sm'
                      : 'bg-white border border-zinc-200/90 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Branch Content Showcase (Asymmetric Flow, NOT repetitive boxes) */}
          <div className="border border-zinc-200 rounded-3xl bg-white p-6 sm:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-zinc-100">
              <div>
                <h3 className="text-lg font-semibold text-zinc-950">
                  {activeBranch.title}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {activeBranch.description}
                </p>
              </div>
              <Link
                href={`/notes?branch=${encodeURIComponent(activeBranch.branchFilter)}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-medium transition-colors shrink-0"
              >
                <span>View Full Branch Vault</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* High-Yield Subject Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {activeBranch.subjects.map((sub) => (
                <div
                  key={sub.id}
                  className="rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-4 flex flex-col justify-between hover:bg-white hover:border-zinc-300 hover:shadow-sm transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-white text-zinc-700 font-medium border border-zinc-200/80">
                        {sub.semester}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/50">
                        High Yield
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-zinc-950 line-clamp-1">
                      {sub.name}
                    </h4>
                    <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                      Units: {sub.topics}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-200/60 flex items-center gap-2">
                    <Link
                      href={`/notes?search=${encodeURIComponent(sub.name)}&branch=${encodeURIComponent(activeBranch.branchFilter)}`}
                      className="flex-1 inline-flex justify-center items-center gap-1 px-2.5 py-1.5 bg-white border border-zinc-200 hover:border-zinc-400 text-zinc-800 text-[11px] font-medium rounded-lg transition-colors"
                    >
                      <BookOpen className="w-3 h-3 text-zinc-400" />
                      <span>Notes</span>
                    </Link>
                    <Link
                      href={`/pyqs?search=${encodeURIComponent(sub.name)}&branch=${encodeURIComponent(activeBranch.branchFilter)}`}
                      className="flex-1 inline-flex justify-center items-center gap-1 px-2.5 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-white text-[11px] font-medium rounded-lg transition-colors"
                    >
                      <FileText className="w-3 h-3 text-zinc-400" />
                      <span>PYQs</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. "THE 48-HOUR EXAM SURVIVAL BLUEPRINT" (Hook 4 - Deep Dark Section)     */}
        {/* ========================================================================= */}
        <section className="relative overflow-hidden rounded-3xl bg-zinc-950 text-white p-8 sm:p-12 shadow-2xl border border-zinc-800">
          <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-zinc-800/20 blur-3xl pointer-events-none" />
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left 7 Columns: Strategy Narrative */}
            <div className="lg:col-span-7 space-y-6">
              {/* <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>THE LAST-BENCH EXAM PROTOCOL</span>
              </div> */}

              <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight leading-tight">
                Why 80% of university exam marks come from past papers.
              </h2>

              <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
                Semester exams don&apos;t require reading 900-page foreign textbooks. In-sem and end-sem tests repeat core derivations, numerical templates, and 6-mark theory patterns across 5-year cycles.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80">
                  <div className="font-mono text-xs text-amber-400 font-semibold mb-1">01 / PYQ Patterns</div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Identify recurring 8-mark questions asked in previous winter &amp; summer papers.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80">
                  <div className="font-mono text-xs text-emerald-400 font-semibold mb-1">02 / Topper Summaries</div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    15-page concise unit digests instead of endless messy slides.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80">
                  <div className="font-mono text-xs text-blue-400 font-semibold mb-1">03 / One-Page Formulas</div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Instant morning formula and diagram revision before entering the hall.
                  </p>
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Quick Launch Kits */}
            <div className="lg:col-span-5 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <span className="text-xs font-semibold text-zinc-200">
                  Popular Exam Kits
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-full">
                  Updated for 2024-25
                </span>
              </div>

              <div className="space-y-2.5">
                {[
                  { name: 'SPPU 2024 End-Sem Solved Papers', desc: 'Computer & IT • Sem 3 & 4', url: '/pyqs?university=SPPU' },
                  { name: 'Mumbai University In-Sem Banks', desc: 'Mathematics & Mechanics • All Branches', url: '/pyqs?university=Mumbai' },
                  { name: 'DBATU Technical Exam Sets', desc: 'Electronics & Mechanical • Sem 3 to 6', url: '/pyqs?university=DBATU' },
                  { name: 'Topper Handwritten Formula Compendiums', desc: 'M1, M2, M3, Network Theory, Signals', url: '/notes?search=Mathematics' },
                ].map((kit) => (
                  <Link
                    key={kit.name}
                    href={kit.url}
                    className="group block p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-950 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-medium text-zinc-200 group-hover:text-white transition-colors">
                        {kit.name}
                      </h4>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      {kit.desc}
                    </p>
                  </Link>
                ))}
              </div>

              <div className="pt-2 text-center">
                <Link
                  href="/pyqs"
                  className="w-full inline-flex justify-center items-center gap-1.5 py-2 px-4 bg-white hover:bg-zinc-100 text-zinc-950 text-xs font-medium rounded-xl transition-colors shadow-sm"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Access All Question Papers</span>
                </Link>
              </div>
            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. COMMUNITY CONTRIBUTOR HOOK & SCALE METRICS (Hook 6)                    */}
        {/* ========================================================================= */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Contributor Card */}
          <div className="lg:col-span-7 border border-zinc-200 bg-white rounded-3xl p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 text-zinc-700 text-xs font-medium mb-2">
                <UploadCloud className="w-3.5 h-3.5 text-zinc-600" />
                <span>COMMUNITY DRIVEN</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-zinc-950 tracking-tight mb-2">
                Have class notes or previous exam papers?
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed mb-5">
                LastBench thrives as an open peer archive. Share lecture summaries, university question papers, or unit digests to help your peers prepare for exams with 100% free access.
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 mb-5">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Open Educational Reference</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>100% Free Peer Access</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-950 text-white font-medium text-xs hover:bg-zinc-800 transition-colors shadow-sm"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Contribute Study Resources</span>
              </Link>
              <button
                type="button"
                onClick={() => openAuthModal('signup')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-200 text-zinc-700 font-medium text-xs hover:bg-zinc-50 transition-colors cursor-pointer"
              >
                <span>Create Student Account</span>
              </button>
            </div>
          </div>

          {/* Trust & Scale Metrics Card */}
          <div className="lg:col-span-5 border border-zinc-200 bg-zinc-900 text-white rounded-3xl p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 text-zinc-400 text-xs font-medium mb-3">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>ACADEMIC VERIFICATION</span>
              </div>
              <h3 className="text-lg font-semibold tracking-tight text-white mb-5">
                Verified Resources Across Maharashtra
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-zinc-800/60 border border-zinc-700/60">
                  <div className="text-xl font-bold tracking-tight text-white">30+</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">Maharashtra Universities</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-zinc-800/60 border border-zinc-700/60">
                  <div className="text-xl font-bold tracking-tight text-white">500+</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">Lecture Notes &amp; PYQs</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-zinc-800/60 border border-zinc-700/60">
                  <div className="text-xl font-bold tracking-tight text-emerald-400">100%</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">Free In-Browser Reading</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-zinc-800/60 border border-zinc-700/60">
                  <div className="text-xl font-bold tracking-tight text-white">1 - 8</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">All Semesters Covered</div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-zinc-500 mt-5 pt-3 border-t border-zinc-800">
              No subscription charges. No document paywalls. Built for university engineering students.
            </p>
          </div>

        </section>

      </div>
    </div>
  );
}

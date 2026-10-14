'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Form from 'next/form';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthModal } from '@/context/AuthModalContext';
import { BackgroundGrid } from '@/components/ui/BackgroundGrid';
import { 
  ArrowRight, 
  BookOpen, 
  FileText, 
  UploadCloud, 
  Search, 
  TrendingUp, 
  ShieldCheck, 
  ChevronRight,
  Gift,
  Sparkles,
  Zap
} from 'lucide-react';


const UniversityLogo = ({ uni }: { uni: { name: string, src: string, invert?: boolean } }) => {
  const [error, setError] = React.useState(false);
  return (
    <div 
      className="flex-none w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center opacity-60 hover:opacity-100 transition-all duration-300 grayscale hover:grayscale-0 cursor-pointer hover:scale-105 mx-6 sm:mx-10"
      title={uni.name}
    >
      {!error ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img 
          src={uni.src}
          alt={uni.name} 
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          className={uni.invert ? 'invert' : ''}
          onError={() => setError(true)}
        />
      ) : (
        <div className="w-16 h-16 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-400 font-bold text-xl">
          {uni.name[0]}
        </div>
      )}
    </div>
  );
};

const FOUNDERS_LIMIT = 100;

function FoundersClubBanner({ onSignUp }: { onSignUp: () => void }) {
  const [claimedCount, setClaimedCount] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/founders-count');
        if (res.ok) {
          const data = await res.json();
          setClaimedCount(Math.min(data.count ?? 0, FOUNDERS_LIMIT));
        } else {
          setClaimedCount(0);
        }
      } catch {
        setClaimedCount(0);
      }
    };
    fetchCount();
  }, []);

  const spotsLeft = claimedCount !== null ? FOUNDERS_LIMIT - claimedCount : null;
  const isFull = spotsLeft !== null && spotsLeft <= 0;

  if (isFull) return null;

  return (
    <div className="mb-8">
      <button
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 border border-zinc-200 hover:border-zinc-300 transition-colors cursor-pointer"
      >
        <Gift className="w-3.5 h-3.5 text-zinc-600" />
        <span className="text-sm text-zinc-700 font-medium">
          Founders Club
        </span>
        {spotsLeft !== null && (
          <span className="text-xs text-zinc-400 font-mono">{spotsLeft} spots left</span>
        )}
        <ChevronRight className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {expanded && (
        <div className="mt-4 text-left max-w-md mx-auto border border-zinc-200 rounded-xl bg-white p-5">
          <p className="text-xs text-zinc-500 mb-3">Exclusive perks for the first 100 signups</p>
          <div className="space-y-2 mb-4 text-sm text-zinc-600">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>Lifetime ad-free access</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Zap className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>Priority PYQ & question paper request within 24hrs</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>High-frequency sure-shot exam question banks</span>
            </div>
          </div>
          <button
            onClick={onSignUp}
            className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Claim your spot
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

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
          .slice(0, 5)
          .map(([subj]) => ({ label: subj, query: subj }));
        
        // Fallback static trending if none loaded
        if (dynamicTrending.length === 0) {
            setTrendingTopics([
                { label: 'Data Structures', query: 'Data Structures' },
                { label: 'OS', query: 'OS' },
                { label: 'Mathematics III', query: 'Mathematics III' },
            ]);
        } else {
            setTrendingTopics(dynamicTrending);
        }
      } catch (err) {
        console.error('Failed to load trending subjects:', err);
      }
    };
    fetchTrending();
  }, []);

  

  const branchData: Record<string, { title: string; description: string; branchFilter: string; subjects: { name: string, topics: string }[] }> = {
    comp: {
      title: 'Computer Engineering',
      description: 'Core algorithms, software architecture, and systems.',
      branchFilter: 'Computer Engineering',
      subjects: [
        { name: 'Data Structures & Algorithms', topics: 'Arrays, Trees, Graphs, Sorting' },
        { name: 'Operating Systems', topics: 'Processes, Memory, Deadlocks' },
        { name: 'Database Management Systems', topics: 'SQL, Normalization, ACID' },
        { name: 'Theory of Computation', topics: 'DFA, Grammars, Turing Machines' },
      ],
    },
    it: {
      title: 'Information Technology',
      description: 'Web architecture, security, and cloud systems.',
      branchFilter: 'Information Technology (IT)',
      subjects: [
        { name: 'Computer Networks', topics: 'TCP/IP, Routing, Security' },
        { name: 'Web Application Development', topics: 'APIs, Full-stack, Auth' },
        { name: 'Software Engineering', topics: 'Design Patterns, SDLC' },
        { name: 'Cloud Computing', topics: 'AWS, Microservices, Docker' },
      ],
    },
    aids: {
      title: 'AI & Data Science',
      description: 'Machine learning fundamentals and neural networks.',
      branchFilter: 'Artificial Intelligence & Data Science (AI & DS)',
      subjects: [
        { name: 'Machine Learning', topics: 'Regression, Classification' },
        { name: 'Probability & Statistics', topics: 'Bayes, Distributions' },
        { name: 'Deep Learning', topics: 'CNNs, RNNs, Transformers' },
        { name: 'Big Data Analytics', topics: 'Hadoop, PySpark' },
      ],
    },
    entc: {
      title: 'Electronics & Telecom',
      description: 'Signal processing, microcontrollers, and embedded systems.',
      branchFilter: 'Electronics & Telecommunication Engineering (ENTC)',
      subjects: [
        { name: 'Signals & Systems', topics: 'Fourier, Laplace, Z-Transform' },
        { name: 'Digital Signal Processing', topics: 'FIR/IIR, DFT, FFT' },
        { name: 'Microcontrollers', topics: 'ARM, 8051, Timers' },
        { name: 'Electromagnetics', topics: 'Maxwell, Waveguides' },
      ],
    },
    mech: {
      title: 'Mechanical Engineering',
      description: 'Thermodynamics, fluid mechanics, and CAD/CAM.',
      branchFilter: 'Mechanical Engineering',
      subjects: [
        { name: 'Thermodynamics', topics: 'Carnot Cycles, Entropy' },
        { name: 'Strength of Materials', topics: 'Stress-Strain, Bending' },
        { name: 'Fluid Mechanics', topics: 'Bernoulli, Turbines' },
        { name: 'Theory of Machines', topics: 'Gears, Cams, Vibrations' },
      ],
    },
    fe: {
      title: 'First Year (Common)',
      description: 'Foundational mathematics and basic sciences.',
      branchFilter: 'First Year Engineering (Common)',
      subjects: [
        { name: 'Engineering Mathematics', topics: 'Calculus, Matrices' },
        { name: 'Engineering Mechanics', topics: 'Statics, Kinetics' },
        { name: 'Basic Electrical', topics: 'Kirchhoff Laws, AC' },
        { name: 'Engineering Physics', topics: 'Quantum, Lasers' },
      ],
    },
  };

  const activeBranch = branchData[activeBranchTab];

  return (
    <div className="relative min-h-screen bg-white">
      <BackgroundGrid variant="dots" className="opacity-40" />

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-20">
        <div className="text-center max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <FoundersClubBanner onSignUp={() => openAuthModal('signup')} />
            
            <h1 className="text-4xl sm:text-6xl font-bold text-zinc-900 tracking-tight mb-6 leading-[1.1]">
              The open archive for <br className="hidden sm:block" />
              <span className="text-zinc-500">engineering students.</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-zinc-600 mb-10 leading-relaxed max-w-2xl mx-auto">
              Access comprehensive lecture notes, verified past year question papers, and syllabus guides across top universities. Free and accessible anywhere.
            </p>

            {/* Omnibox Search */}
            <Form action="/notes" className="relative max-w-2xl mx-auto group mb-6">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
              </div>
              <input
                type="text"
                name="q"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for subjects, topics, or course codes..."
                className="w-full pl-14 pr-32 py-4 sm:py-5 bg-white border-2 border-zinc-200 rounded-2xl text-base text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5 transition-all shadow-sm"
              />
              <div className="absolute inset-y-2 right-2 flex items-center">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center px-6 py-2.5 sm:py-3 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
                >
                  Search
                </button>
              </div>
            </Form>

            {/* Trending */}
            {trendingTopics.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-zinc-500">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>Trending:</span>
                {trendingTopics.map((topic) => (
                  <Link
                    key={topic.label}
                    href={`/notes?q=${encodeURIComponent(topic.query)}`}
                    className="px-3 py-1 rounded-md bg-zinc-50 hover:bg-zinc-100 text-zinc-700 transition-colors"
                  >
                    {topic.label}
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* University Marquee */}
      <div className="border-y border-zinc-100 bg-zinc-50/50 py-10 overflow-hidden relative">
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-zinc-50/50 to-transparent z-10" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-zinc-50/50 to-transparent z-10" />
        <div className="flex w-max animate-marquee items-center">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center shrink-0">
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
            animation: marquee 40s linear infinite;
          }
          .animate-marquee:hover {
            animation-play-state: paused;
          }
        `}</style>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-32">
        
        {/* Core Value Props */}
        {/* Bento Grid Features */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
          
          {/* Card 1: Notes (spans 7 cols) */}
          <div className="hidden md:block col-span-1 md:col-span-7 bg-white border border-zinc-200/80 rounded-3xl p-6 sm:p-10 relative overflow-hidden group hover:border-zinc-300 transition-colors shadow-sm">
            <div className="relative z-10 max-w-sm mb-8 md:mb-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-5 border border-zinc-200/50">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-800" />
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-zinc-950 mb-2 sm:mb-3 tracking-tight">Topper-written summaries</h3>
              <p className="text-sm sm:text-base text-zinc-500 leading-relaxed">
                Skip the messy textbook chapters. Access precise, high-yield unit summaries designed specifically for last-minute revision.
              </p>
            </div>
            
            {/* Visual / Mockup inside the card (Visible on both mobile and desktop) */}
            <div className="relative md:absolute md:-right-4 md:top-1/2 md:-translate-y-1/2 w-full md:w-80 mt-auto flex justify-center md:block">
              <div className="w-64 sm:w-80 bg-white rounded-2xl border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4 sm:p-5 transform md:rotate-3 group-hover:-rotate-1 transition-transform duration-500 translate-y-4 md:translate-y-0">
                <div className="flex items-center justify-between mb-4 border-b border-zinc-100 pb-3 sm:pb-4">
                   <span className="text-[9px] sm:text-[10px] font-mono font-medium text-emerald-700 bg-emerald-50 px-2 sm:px-2.5 py-1 rounded-full border border-emerald-100">UNIT 4</span>
                   <span className="text-[9px] sm:text-[10px] font-mono text-zinc-400">PDF DOC</span>
                </div>
                <div className="h-3 sm:h-4 w-3/4 bg-zinc-100 rounded mb-2 sm:mb-3"></div>
                <div className="h-2 sm:h-2.5 w-full bg-zinc-50 rounded mb-2 sm:mb-2.5"></div>
                <div className="h-2 sm:h-2.5 w-5/6 bg-zinc-50 rounded mb-2 sm:mb-2.5"></div>
                <div className="h-2 sm:h-2.5 w-4/6 bg-zinc-50 rounded"></div>
              </div>
            </div>
          </div>

          {/* Card 2: PYQs (spans 5 cols) */}
          <div className="hidden md:flex col-span-1 md:col-span-5 bg-white border border-zinc-200/80 rounded-3xl p-6 sm:p-10 relative overflow-hidden hover:border-zinc-300 transition-colors shadow-sm flex-col justify-between">
            <div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-5 border border-zinc-200/50">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-800" />
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-zinc-950 mb-2 sm:mb-3 tracking-tight">Identify patterns</h3>
              <p className="text-sm sm:text-base text-zinc-500 leading-relaxed mb-6">
                Master your exams with our structured database of previous year question papers across 30+ universities.
              </p>
            </div>

            {/* Visual Tags - Horizontal Scroll on Mobile */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2 sm:mx-0 sm:px-0 sm:flex-wrap">
              {['2023', '2022', '2021', '2020'].map((year, i) => (
                <div key={year} className={`shrink-0 px-3 py-1.5 sm:px-4 sm:py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-[11px] sm:text-xs font-mono text-zinc-600 flex items-center gap-1.5 sm:gap-2 ${i === 0 ? 'ring-1 ring-zinc-950 bg-white shadow-sm' : ''}`}>
                  <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5 opacity-50" />
                  {year} PYQ
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Free / Community (spans 12 cols, wide) */}
          <div className="col-span-1 md:col-span-12 bg-zinc-950 rounded-3xl p-6 sm:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between group">
            <div className="max-w-2xl z-10 w-full text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-white text-[10px] sm:text-xs font-medium mb-4 sm:mb-6 backdrop-blur-sm">
                <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Open Educational Utility</span>
              </div>
              <h3 className="text-xl sm:text-3xl font-semibold text-white mb-3 sm:mb-4 tracking-tight">100% Free. No paywalls.</h3>
              <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                LastBench is built by students, for students. We believe educational resources should be universally accessible. No subscriptions, no hidden fees, ever.
              </p>
            </div>
            
            {/* Visual: Avatars */}
            <div className="mt-8 md:mt-0 flex items-center justify-center relative z-10 w-full md:w-auto">
              <div className="flex -space-x-3 sm:-space-x-4">
                {[
                  { initials: 'RK', color: 'from-blue-500 to-cyan-500' },
                  { initials: 'SJ', color: 'from-emerald-400 to-teal-500' },
                  { initials: 'AM', color: 'from-violet-500 to-purple-500' },
                  { initials: 'PR', color: 'from-orange-400 to-rose-500' }
                ].map((user, i) => (
                  <div key={i} className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-zinc-950 flex items-center justify-center transform transition-transform group-hover:-translate-y-1 overflow-hidden relative shadow-md`} style={{ transitionDelay: `${i * 50}ms` }}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${user.color} opacity-90`} />
                    <span className="relative z-10 text-[9px] sm:text-[11px] font-bold text-white tracking-wider">{user.initials}</span>
                  </div>
                ))}
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white text-zinc-950 border-2 border-zinc-950 flex items-center justify-center text-[10px] sm:text-xs font-bold z-20 shadow-xl group-hover:-translate-y-1 transition-transform" style={{ transitionDelay: '200ms' }}>
                  +1k
                </div>
              </div>
            </div>
            
            {/* Subtle grid background inside dark card */}
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
          </div>
        </div>

        {/* Curriculum Explorer */}
        <div className="bg-white rounded-[2rem] border border-zinc-200 overflow-hidden shadow-sm">
          <div className="p-8 sm:p-12 border-b border-zinc-100">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h2 className="text-3xl font-bold text-zinc-900 mb-4">Explore Curriculum</h2>
                <p className="text-lg text-zinc-600 max-w-xl">
                  Find the exact materials for your semester. Organized by branch and subject to save you time.
                </p>
              </div>
              <div className="flex gap-4">
                <Link href="/notes" className="inline-flex items-center justify-center px-6 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-sm font-semibold rounded-xl transition-colors">
                  View Notes
                </Link>
                <Link href="/pyqs" className="inline-flex items-center justify-center px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold rounded-xl transition-colors">
                  View PYQs
                </Link>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-4 border-r border-zinc-100 p-6 space-y-2 bg-zinc-50/50">
              {([
                { id: 'comp' as const, label: 'Computer Engineering' },
                { id: 'it' as const, label: 'Information Tech' },
                { id: 'aids' as const, label: 'AI & Data Science' },
                { id: 'entc' as const, label: 'Electronics & Telecom' },
                { id: 'mech' as const, label: 'Mechanical' },
                { id: 'fe' as const, label: 'First Year (FE)' },
              ]).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveBranchTab(tab.id)}
                  className={`w-full text-left px-5 py-4 rounded-xl text-sm font-medium transition-all flex items-center justify-between group ${
                    activeBranchTab === tab.id
                      ? 'bg-white shadow-sm border border-zinc-200/60 text-zinc-900'
                      : 'text-zinc-600 hover:bg-zinc-100/50'
                  }`}
                >
                  {tab.label}
                  <ChevronRight className={`w-4 h-4 ${activeBranchTab === tab.id ? 'text-zinc-900' : 'text-zinc-400 group-hover:text-zinc-600'}`} />
                </button>
              ))}
            </div>
            <div className="lg:col-span-8 p-8 sm:p-12">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-zinc-900 mb-2">{activeBranch.title}</h3>
                  <p className="text-zinc-600">{activeBranch.description}</p>
                </div>
                <Link
                  href={`/notes?branch=${encodeURIComponent(activeBranch.branchFilter)}`}
                  className="hidden sm:inline-flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700"
                >
                  View full branch <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeBranch.subjects.map((sub, idx) => (
                  <div key={idx} className="p-5 rounded-2xl border border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm transition-all group cursor-pointer">
                    <h4 className="font-semibold text-zinc-900 mb-2 group-hover:text-emerald-600 transition-colors">{sub.name}</h4>
                    <p className="text-sm text-zinc-500 line-clamp-2">Units: {sub.topics}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-zinc-900 rounded-[2rem] p-10 sm:p-16 text-center">
          <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6">Built by students, for students.</h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-10">
            Have high-quality notes or recent question papers? Contribute to the archive and help thousands of peers prepare for their exams.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => openAuthModal('signin', { redirectUrl: '/upload' })}
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-white text-zinc-900 text-base font-semibold rounded-xl hover:bg-zinc-100 transition-colors"
            >
              <UploadCloud className="w-5 h-5 mr-2" />
              Upload Material
            </button>
            <button
              onClick={() => openAuthModal('signup')}
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-zinc-800 text-white text-base font-semibold rounded-xl hover:bg-zinc-700 transition-colors border border-zinc-700"
            >
              Create Free Account
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

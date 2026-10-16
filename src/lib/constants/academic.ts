export interface UniversityOption {
  id: string;
  name: string;
  shortName: string;
}

export interface UniversityGroup {
  label: string;
  options: UniversityOption[];
}

export const MAHARASHTRA_UNIVERSITY_GROUPS: UniversityGroup[] = [
  {
    label: 'State Public Universities',
    options: [
      { id: 'sppu', name: 'Savitribai Phule Pune University (SPPU)', shortName: 'SPPU' },
      { id: 'mu', name: 'University of Mumbai (MU)', shortName: 'Mumbai University' },
      { id: 'dbatu', name: 'Dr. Babasaheb Ambedkar Technological University (DBATU)', shortName: 'DBATU' },
      { id: 'rtmnu', name: 'Rashtrasant Tukadoji Maharaj Nagpur University (RTMNU)', shortName: 'Nagpur University' },
      { id: 'sgbau', name: 'Sant Gadge Baba Amravati University (SGBAU)', shortName: 'Amravati University' },
      { id: 'bamu', name: 'Dr. Babasaheb Ambedkar Marathwada University (BAMU)', shortName: 'BAMU' },
      { id: 'srtmun', name: 'Swami Ramanand Teerth Marathwada University (SRTMUN)', shortName: 'SRTMUN Nanded' },
      { id: 'suk', name: 'Shivaji University, Kolhapur (SUK)', shortName: 'Shivaji University' },
      { id: 'kbcnmu', name: 'Kavayitri Bahinabai Chaudhari North Maharashtra University (KBCNMU)', shortName: 'NMU Jalgaon' },
      { id: 'pahsu', name: 'Punyashlok Ahilyadevi Holkar Solapur University (PAHSU)', shortName: 'Solapur University' },
      { id: 'gondwana', name: 'Gondwana University, Gadchiroli', shortName: 'Gondwana University' },
    ],
  },
  {
    label: 'Government & Premier Autonomous Institutes',
    options: [
      { id: 'coep', name: 'COEP Technological University, Pune', shortName: 'COEP' },
      { id: 'vjti', name: 'Veermata Jijabai Technological Institute (VJTI), Mumbai', shortName: 'VJTI' },
      { id: 'ict', name: 'Institute of Chemical Technology (ICT), Mumbai', shortName: 'ICT Mumbai' },
      { id: 'spit', name: 'Sardar Patel Institute of Technology / SPCE, Mumbai', shortName: 'SPIT / SPCE' },
      { id: 'wce', name: 'Walchand College of Engineering, Sangli (WCE)', shortName: 'Walchand Sangli' },
      { id: 'gcek', name: 'Government College of Engineering, Karad (GCEK)', shortName: 'GCE Karad' },
      { id: 'geca', name: 'Government College of Engineering, Chhatrapati Sambhajinagar', shortName: 'GCE Aurangabad' },
      { id: 'gcoea', name: 'Government College of Engineering, Amravati (GCOEA)', shortName: 'GCE Amravati' },
      { id: 'gcoej', name: 'Government College of Engineering, Jalgaon (GCOEJ)', shortName: 'GCE Jalgaon' },
      { id: 'gcoec', name: 'Government College of Engineering, Chandrapur (GCOEC)', shortName: 'GCE Chandrapur' },
      { id: 'sggs', name: 'Shri Guru Gobind Singhji Institute (SGGSIET), Nanded', shortName: 'SGGS Nanded' },
    ],
  },
  {
    label: 'Deemed & Private Universities',
    options: [
      { id: 'mit-wpu', name: 'MIT World Peace University (MIT-WPU), Pune', shortName: 'MIT-WPU' },
      { id: 'bvdu', name: 'Bharati Vidyapeeth Deemed University (BVDU), Pune', shortName: 'Bharati Vidyapeeth' },
      { id: 'sit', name: 'Symbiosis Institute of Technology (SIT / SIU), Pune', shortName: 'Symbiosis Pune' },
      { id: 'dypiu', name: 'D. Y. Patil International University (DYPIU), Akurdi', shortName: 'DYPIU Akurdi' },
      { id: 'dypu', name: 'D. Y. Patil Deemed University, Navi Mumbai', shortName: 'DY Patil Navi Mumbai' },
      { id: 'vu', name: 'Vishwakarma University (VU), Pune', shortName: 'Vishwakarma Univ' },
      { id: 'nmims', name: 'NMIMS Mukesh Patel School of Technology (MPSTME), Mumbai', shortName: 'NMIMS MPSTME' },
      { id: 'somaiya', name: 'Somaiya Vidyavihar University (KJSCE), Mumbai', shortName: 'KJ Somaiya' },
      { id: 'pcu', name: 'Pimpri Chinchwad University (PCU), Pune', shortName: 'PCU Pune' },
      { id: 'adypu', name: 'Ajeenkya DY Patil University (ADYPU), Pune', shortName: 'ADYPU Pune' },
      { id: 'sgu', name: 'Sanjay Ghodawat University (SGU), Kolhapur', shortName: 'Sanjay Ghodawat' },
      { id: 'sandip', name: 'Sandip University, Nashik', shortName: 'Sandip University' },
      { id: 'mgm', name: 'MGM University, Chhatrapati Sambhajinagar', shortName: 'MGM University' },
      { id: 'amity', name: 'Amity University, Mumbai', shortName: 'Amity Mumbai' },
    ],
  },
  {
    label: 'Other Institutions',
    options: [
      { id: 'autonomous-other', name: 'Other Autonomous Engineering College (Maharashtra)', shortName: 'Autonomous College' },
      { id: 'other-university', name: 'Other University (Outside Maharashtra)', shortName: 'Other University' },
    ],
  },
];

export interface BranchGroup {
  label: string;
  options: string[];
}

export const ENGINEERING_BRANCH_GROUPS: BranchGroup[] = [
  {
    label: 'Computer Science & IT',
    options: [
      'Computer Engineering',
      'Computer Science & Engineering (CSE)',
      'Information Technology (IT)',
      'Artificial Intelligence & Data Science (AI & DS)',
      'Artificial Intelligence & Machine Learning (AI & ML)',
      'Computer Science & Engineering (Data Science)',
      'Computer Science & Engineering (Cyber Security)',
      'Computer Science & Business Systems (CSBS)',
      'Software Engineering',
    ],
  },
  {
    label: 'Electronics & Electrical',
    options: [
      'Electronics & Telecommunication Engineering (ENTC)',
      'Electrical Engineering',
      'Electronics Engineering',
      'Electronics & Computer Engineering',
      'Instrumentation & Control Engineering',
    ],
  },
  {
    label: 'Mechanical, Civil & Automation',
    options: [
      'Mechanical Engineering',
      'Civil Engineering',
      'Automobile Engineering',
      'Robotics & Automation',
      'Mechatronics Engineering',
      'Production & Industrial Engineering',
    ],
  },
  {
    label: 'Chemical & Specialized Fields',
    options: [
      'Chemical Engineering',
      'Biotechnology / Biochemical Engineering',
      'Biomedical Engineering',
      'Aeronautical & Aerospace Engineering',
      'Metallurgical & Materials Engineering',
      'Environmental Engineering',
      'Textile Engineering',
    ],
  },
  {
    label: 'Foundation',
    options: [
      'First Year Engineering (Common)',
      'Other Engineering Stream',
    ],
  },
];

export const ALL_UNIVERSITIES = MAHARASHTRA_UNIVERSITY_GROUPS.flatMap(g => g.options.map(o => o.name));
export const ALL_BRANCHES = ENGINEERING_BRANCH_GROUPS.flatMap(g => g.options);

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

export interface SelectGroup {
  label: string;
  options: SelectOption[];
}

export const UNIVERSITY_SELECT_GROUPS: SelectGroup[] = MAHARASHTRA_UNIVERSITY_GROUPS.map(g => ({
  label: g.label,
  options: g.options.map(o => ({
    value: o.name,
    label: o.name,
    sublabel: o.shortName,
  })),
}));

export const BRANCH_SELECT_GROUPS: SelectGroup[] = ENGINEERING_BRANCH_GROUPS.map(g => ({
  label: g.label,
  options: g.options.map(b => ({
    value: b,
    label: b,
  })),
}));

export const SEMESTERS = [
  { value: '1', label: 'Semester 1' },
  { value: '2', label: 'Semester 2' },
  { value: '3', label: 'Semester 3' },
  { value: '4', label: 'Semester 4' },
  { value: '5', label: 'Semester 5' },
  { value: '6', label: 'Semester 6' },
  { value: '7', label: 'Semester 7' },
  { value: '8', label: 'Semester 8' },
];

export const ACADEMIC_YEARS = [
  { value: '1', label: 'First Year (FE) • Sem 1 & 2' },
  { value: '2', label: 'Second Year (SE) • Sem 3 & 4' },
  { value: '3', label: 'Third Year (TE) • Sem 5 & 6' },
  { value: '4', label: 'Final Year (BE) • Sem 7 & 8' },
];

/**
 * Intelligent fuzzy matching for universities that handles short codes,
 * acronyms, and full names (e.g. 'sppu' matches 'Savitribai Phule Pune University (SPPU)').
 */
export function matchesUniversity(documentUniversity: string | undefined, filterUniversity: string): boolean {
  if (!filterUniversity) return true;
  if (!documentUniversity) return false;

  const doc = documentUniversity.toLowerCase().trim();
  const filter = filterUniversity.toLowerCase().trim();

  if (doc === filter) return true;
  if (doc.includes(filter) || filter.includes(doc)) return true;

  // Check known acronym mappings
  const acronyms: Record<string, string[]> = {
    sppu: ['pune', 'savitribai', 'sppu'],
    mu: ['mumbai', 'mu', 'bombay'],
    dbatu: ['dbatu', 'batut', 'lonere', 'babasaheb ambedkar technological'],
    rtmnu: ['rtmnu', 'nagpur'],
    sgbau: ['sgbau', 'amravati'],
    bamu: ['bamu', 'marathwada', 'aurangabad', 'sambhajinagar'],
    srtmun: ['srtmun', 'nanded'],
    suk: ['suk', 'shivaji', 'kolhapur'],
    coep: ['coep'],
    vjti: ['vjti'],
    ict: ['ict'],
    mit: ['mit', 'mit-wpu'],
    wce: ['wce', 'walchand'],
  };

  for (const aliases of Object.values(acronyms)) {
    const docMatchesKey = aliases.some(alias => doc.includes(alias));
    const filterMatchesKey = aliases.some(alias => filter.includes(alias));
    if (docMatchesKey && filterMatchesKey) return true;
  }

  return false;
}

/**
 * Intelligent fuzzy matching for branches (e.g. 'Computer' matches 'Computer Engineering').
 */
export function matchesBranch(documentBranch: string | undefined, filterBranch: string): boolean {
  if (!filterBranch) return true;
  if (!documentBranch) return false;

  const doc = documentBranch.toLowerCase().trim();
  const filter = filterBranch.toLowerCase().trim();

  if (doc === filter) return true;
  if (doc.includes(filter) || filter.includes(doc)) return true;

  const branchAliases: Record<string, string[]> = {
    cs: ['computer', 'cse', 'computer science', 'cs'],
    it: ['information technology', 'it'],
    entc: ['entc', 'e&tc', 'telecom', 'electronics & telecommunication'],
    mech: ['mechanical', 'mech', 'automobile'],
    civil: ['civil'],
    electrical: ['electrical'],
    ai: ['ai', 'artificial intelligence', 'data science', 'ai & ds', 'ai & ml'],
  };

  for (const aliases of Object.values(branchAliases)) {
    const docMatches = aliases.some(alias => doc.includes(alias));
    const filterMatches = aliases.some(alias => filter.includes(alias));
    if (docMatches && filterMatches) return true;
  }

  return false;
}

/**
 * Resolves a selected branch option into a clean search root pattern for database matching.
 */
export function getBranchSearchPattern(filterBranch: string): string {
  if (!filterBranch) return '';
  const trimmed = filterBranch.trim();
  if (trimmed.startsWith('First Year') || trimmed.toLowerCase().startsWith('common')) {
    return 'First Year';
  }
  const root = trimmed.split(/[\s&/(]+/)[0];
  return root || trimmed;
}

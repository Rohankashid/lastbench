export interface CuratedMicroPack {
  id: string;
  subject: string;
  code: string;
  semester: string;
  branch: string;
  title: string;
  description: string;
  badge: string;
  topicsPlanned: string[];
}

export const CURATED_MICRO_PACKS: CuratedMicroPack[] = [
  {
    id: 'pack-bee-circuits',
    subject: 'Basic Electrical Engineering',
    code: 'BEE-101',
    semester: 'Semester 1 / 2',
    branch: 'First Year Engineering (All)',
    title: 'AC Circuits, Resonance & Machines Micro Pack',
    description: 'Precision formula tables, RLC phasor relations, 3-phase star-delta, transformer equivalent circuits & DC motor torque equations.',
    badge: 'Coming Soon',
    topicsPlanned: [
      'Series & Parallel R-L-C Resonance Matrix',
      '3-Phase Star vs Delta Conversion Table',
      'Single-Phase Transformer Equivalent Equations',
      'DC Shunt & Series Motor Operating Formulas'
    ]
  },
  {
    id: 'pack-bxe-electronics',
    subject: 'Basic Electronics Engineering',
    code: 'BXE-102',
    semester: 'Semester 1 / 2',
    branch: 'First Year Engineering (All)',
    title: 'Semiconductors, Op-Amps & Logic Micro Pack',
    description: 'Ultra-dense BJT configurations comparison, 741 Op-Amp circuit gains, diode rectifier filter parameters & Boolean logic theorems.',
    badge: 'Coming Soon',
    topicsPlanned: [
      'BJT CB, CE, CC Parameter Comparison Matrix',
      'Op-Amp 741 Inverting, Non-Inverting & Summing Gains',
      'Rectifier Ripple Factor & Efficiency Cheat Sheet',
      'Universal Logic Gates & De Morgan Theorems'
    ]
  },
  {
    id: 'pack-coa-core',
    subject: 'Computer Organization & Architecture',
    code: 'COA-301',
    semester: 'Semester 3 / 4',
    branch: 'Computer / IT / AI-DS',
    title: 'Processor Architecture & Memory Micro Pack',
    description: 'Booth multiplier execution traces, cache address mapping bits, pipeline hazard resolution & control unit comparison.',
    badge: 'Coming Soon',
    topicsPlanned: [
      'Booth Algorithm Step-by-Step Flowchart & Trace',
      'Cache Address Translation & Hit Ratio Equations',
      '5-Stage Pipeline Hazards & Ideal Speedup Formulas',
      'Hardwired vs Microprogrammed Control Matrix'
    ]
  },
  {
    id: 'pack-em-mechanics',
    subject: 'Engineering Mechanics',
    code: 'EM-103',
    semester: 'Semester 1 / 2',
    branch: 'First Year Engineering (All)',
    title: 'Statics, Centroids & Friction Micro Pack',
    description: 'Centroid & Moment of Inertia standard tables, Lami theorem, belt friction tension ratios & plane truss equilibrium.',
    badge: 'Coming Soon',
    topicsPlanned: [
      'Centroids (x_bar, y_bar) & MOI (I_xx, I_yy) Table',
      'Lami Theorem & 3-Force Coplanar Equilibrium',
      'Coulomb Dry Friction & Belt Ratio (T1/T2 = e^mu*theta)',
      'Method of Joints & Sections for Trusses'
    ]
  },
  {
    id: 'pack-chem-engineering',
    subject: 'Engineering Chemistry',
    code: 'CHEM-104',
    semester: 'Semester 1 / 2',
    branch: 'First Year Engineering (All)',
    title: 'Water Hardness, Polymers & Phase Rule Pack',
    description: 'EDTA complexometric titration equations, Phase Rule calculations, polymer synthesis reactions & corrosion protection.',
    badge: 'Coming Soon',
    topicsPlanned: [
      'Water Hardness & EDTA Titration Calculations',
      'One-Component Water System Phase Diagram',
      'Addition vs Condensation Polymer Comparison',
      'Galvanic & Differential Aeration Corrosion'
    ]
  }
];

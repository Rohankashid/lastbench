import { ENGINEERING_BRANCH_GROUPS, MAHARASHTRA_UNIVERSITY_GROUPS } from '@/lib/constants/academic';

export interface ExtractedMetadata {
  category: 'note' | 'pyq';
  subject: string;
  semester: string;
  branch: string[];
  university: string;
  unitsCovered: string;
  pattern?: string;
  examType?: string;
  examYear?: string;
  suggestedTitle: string;
  topic?: string;
  keyTopics: string[];
  confidence: 'high' | 'medium' | 'low';
  originalPageCount?: number;
  sampledPageCount?: number;
}

const ALL_VALID_BRANCHES: string[] = ENGINEERING_BRANCH_GROUPS.flatMap((g) => g.options);
const ALL_VALID_UNIVERSITIES = MAHARASHTRA_UNIVERSITY_GROUPS.flatMap((g) => g.options);

function normalizeBranches(extractedBranches: string[] = []): string[] {
  if (!Array.isArray(extractedBranches) || extractedBranches.length === 0) {
    return [];
  }

  const matched = new Set<string>();
  for (const raw of extractedBranches) {
    const rawLower = raw.toLowerCase().trim();
    if (rawLower.includes('first year') || rawLower.includes('fe') || rawLower.includes('common')) {
      matched.add('First Year Engineering (Common)');
      continue;
    }

    const exactMatch = ALL_VALID_BRANCHES.find(
      (b) => b.toLowerCase() === rawLower || b.toLowerCase().includes(rawLower) || rawLower.includes(b.toLowerCase())
    );
    if (exactMatch) {
      matched.add(exactMatch);
    }
  }

  return Array.from(matched);
}

function normalizeUniversity(rawUni?: string, hint?: string): string {
  const target = (rawUni || hint || '').toLowerCase().trim();
  if (!target) return '';

  if (target.includes('mumbai') || target === 'mu') return 'University of Mumbai (MU)';
  if (target.includes('pune') || target.includes('sppu') || target.includes('savitribai')) return 'Savitribai Phule Pune University (SPPU)';
  if (target.includes('dbatu') || target.includes('ambedkar tech') || target.includes('lonere') || target.includes('batu')) return 'Dr. Babasaheb Ambedkar Technological University (DBATU)';
  if (target.includes('nagpur') || target.includes('rtmnu')) return 'Rashtrasant Tukadoji Maharaj Nagpur University (RTMNU)';
  if (target.includes('amravati') || target.includes('sgbau')) return 'Sant Gadge Baba Amravati University (SGBAU)';
  if (target.includes('marathwada') || target.includes('bamu') || target.includes('aurangabad')) return 'Dr. Babasaheb Ambedkar Marathwada University (BAMU)';
  if (target.includes('nanded') || target.includes('srtmun')) return 'Swami Ramanand Teerth Marathwada University (SRTMUN)';
  if (target.includes('kolhapur') || target.includes('shivaji') || target.includes('suk')) return 'Shivaji University, Kolhapur (SUK)';
  if (target.includes('north maharashtra') || target.includes('kbcnmu') || target.includes('jalgaon') || target === 'nmu') return 'Kavayitri Bahinabai Chaudhari North Maharashtra University (KBCNMU)';
  if (target.includes('solapur') || target.includes('pahsu')) return 'Punyashlok Ahilyadevi Holkar Solapur University (PAHSU)';
  if (target.includes('gondwana') || target.includes('gadchiroli')) return 'Gondwana University, Gadchiroli';
  if (target.includes('coep')) return 'COEP Technological University, Pune';
  if (target.includes('vjti')) return 'Veermata Jijabai Technological Institute (VJTI), Mumbai';
  if (target.includes('ict')) return 'Institute of Chemical Technology (ICT), Mumbai';
  if (target.includes('spit') || target.includes('spce')) return 'Sardar Patel Institute of Technology / SPCE, Mumbai';
  if (target.includes('walchand') || target.includes('wce')) return 'Walchand College of Engineering, Sangli (WCE)';
  if (target.includes('mit-wpu') || target.includes('mit wpu') || target.includes('world peace')) return 'MIT World Peace University (MIT-WPU), Pune';
  if (target.includes('bharati') || target.includes('bvdu')) return 'Bharati Vidyapeeth Deemed University (BVDU), Pune';
  if (target.includes('symbiosis') || target.includes('sit')) return 'Symbiosis Institute of Technology (SIT / SIU), Pune';
  if (target.includes('dypiu')) return 'D. Y. Patil International University (DYPIU), Akurdi';
  if (target.includes('dypu') || target.includes('d y patil') || target.includes('dy patil')) return 'D. Y. Patil Deemed University, Navi Mumbai';
  if (target.includes('vishwakarma') || target.includes('vu')) return 'Vishwakarma University (VU), Pune';
  if (target.includes('nmims') || target.includes('mpstme')) return 'NMIMS Mukesh Patel School of Technology (MPSTME), Mumbai';
  if (target.includes('somaiya') || target.includes('kjsce')) return 'Somaiya Vidyavihar University (KJSCE), Mumbai';
  if (target.includes('pcu') || target.includes('pimpri chinchwad university')) return 'Pimpri Chinchwad University (PCU), Pune';
  if (target.includes('sandip')) return 'Sandip University, Nashik';
  if (target.includes('mgm')) return 'MGM University, Chhatrapati Sambhajinagar';
  if (target.includes('amity')) return 'Amity University, Mumbai';

  // Check against all options
  for (const uni of ALL_VALID_UNIVERSITIES) {
    if (
      uni.id.toLowerCase() === target ||
      uni.shortName.toLowerCase() === target ||
      uni.name.toLowerCase() === target ||
      uni.name.toLowerCase().includes(target) ||
      (target.length >= 3 && target.includes(uni.shortName.toLowerCase()))
    ) {
      return uni.name;
    }
  }

  return rawUni?.trim() || '';
}

export async function extractMetadataWithGemini({
  fileBase64,
  mimeType,
  fileName,
  universityHint,
  categoryHint,
  originalPageCount,
  sampledPageIndices,
}: {
  fileBase64: string;
  mimeType: string;
  fileName?: string;
  universityHint?: string;
  categoryHint?: 'note' | 'pyq';
  originalPageCount?: number;
  sampledPageIndices?: number[];
}): Promise<ExtractedMetadata> {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set. Please configure GEMINI_API_KEY in your environment or .env.local');
  }

  const pageInfoText = originalPageCount && originalPageCount > 1
    ? `The document has ${originalPageCount} total pages. You are examining ${sampledPageIndices?.length || 1} milestone pages sampled across the file (Pages: ${sampledPageIndices?.join(', ') || '1'}).`
    : 'You are analyzing the uploaded study document.';

  const prompt = `
You are an expert academic archivist for Indian Engineering Universities (specifically Maharashtra: SPPU, Mumbai University, DBATU, RTMNU, COEP, VJTI).
${pageInfoText}

${fileName ? `Original Uploaded Filename: "${fileName}".
CRITICAL FILENAME & UNIT RULES:
- Inspect the filename "${fileName}". If it mentions a unit (e.g. "unit 1", "unit 2", "unit1", "unit 3", "u1", "u2", "ch 1"), this document is strictly for that unit!
- Do NOT assume the document is "Complete Notes (Units 1 to 6)" if the filename or pages show a specific unit like Unit 1 or Unit 2!
- In "unitsCovered": Explicitly state the unit (e.g. "Unit 1", "Unit 2", "Unit 3", "Units 1 & 2", "Complete Notes").
- In "topic": Write the specific unit and core chapter/concept title (e.g. "Unit 1: Product Architecture & System Concepts" or "Unit 2: High-Speed PCB & Power Design"). If it is a PYQ, write the exam session and type (e.g. "In-Sem Oct 2023 Exam Paper").` : ''}

${universityHint ? `The student is from university context: "${universityHint}". Prioritize matching this university's syllabus, pattern, and subject codes if consistent.` : ''}
${categoryHint ? `User indicated category preference: "${categoryHint}".` : ''}

Task: Carefully inspect the document pages and extract structured academic metadata.
Even if the notes are rough handwritten notebook scans with NO cover page and NO index, analyze the topics, formulas, headings, or problem sets across the sampled pages.

Rules:
1. "category": 'note' (study notes, handwritten notes, lecture summaries, question banks, formula sheets) OR 'pyq' (official university question paper, in-sem paper, end-sem paper, model question paper, solved PYQ).
2. "subject": Canonical academic subject name (e.g. "Electronic Product Design", "Engineering Chemistry", "Database Management Systems", "Applied Mathematics-IV").
3. "topic": Specific unit and topic name (e.g. "Unit 1: Product Architecture & System Concepts" or "Unit 2: High-Speed PCB & Power Design"). Never leave this generic or blank!
4. "semester": Number '1' to '8' as a string. (FE = '1' or '2', SE = '3' or '4', TE = '5' or '6', BE = '7' or '8').
5. "branch": Array of applicable engineering branches. If it is a First Year common subject (Maths 1/2, Physics, Chemistry, BEE, Mechanics, PPS, FPL, SME), include "First Year Engineering (Common)". Otherwise, provide standard branch names (e.g. "Computer Engineering", "Information Technology (IT)", "Electronics & Telecommunication Engineering (ENTC)").
6. "university": Canonical university name or ID.
7. "unitsCovered": e.g. "Unit 1", "Unit 2", "Unit 3", "Complete Notes (Units 1 to 6)".
8. "pattern": Syllabus pattern if detectable (e.g. "2019 Pattern", "2024 NEP Pattern", "Rev-2019 C-Scheme").
9. "examType": If pyq, 'In-Sem', 'End-Sem', 'Mid-Sem', or null.
10. "examYear": If pyq, 4-digit year like "2023" or "2024", or null.
11. "suggestedTitle": Clean, high-yield academic title.
    - Example for notes: "Electronic Product Design: Unit 1 Architecture & System Concepts"
    - Example for PYQ: "SPPU FE FPL In-Sem Oct 2023 Question Paper"
12. "keyTopics": Array of 3 to 6 key engineering concepts or chapter names identified.
13. "confidence": 'high', 'medium', or 'low'.

Respond ONLY with valid JSON following this JSON Schema:
{
  "category": "note" | "pyq",
  "subject": string,
  "topic": string,
  "semester": string,
  "branch": string[],
  "university": string,
  "unitsCovered": string,
  "pattern": string | null,
  "examType": string | null,
  "examYear": string | null,
  "suggestedTitle": string,
  "keyTopics": string[],
  "confidence": "high" | "medium" | "low"
}
`;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType,
              data: fileBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1,
    },
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
  } catch (fetchErr: any) {
    if (fetchErr?.name === 'AbortError') {
      throw new Error('Gemini API call timed out after 25 seconds');
    }
    throw fetchErr;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Gemini API Error:', res.status, errorText);
    throw new Error(`Gemini API returned status ${res.status}: ${errorText.slice(0, 200)}`);
  }

  const data = await res.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Gemini API returned empty response');
  }

  try {
    const parsed = JSON.parse(rawText);
    const normalizedBranches = normalizeBranches(parsed.branch);
    const normalizedUni = normalizeUniversity(parsed.university, universityHint);

    // Filename-based unit detection fallback/reinforcement
    let detectedUnit = parsed.unitsCovered?.trim() || '';
    if (fileName) {
      let unitNum = null;
      const m1 = fileName.match(/(?:unit|u|chapter|ch)\s*([0-9]+(?:\s*(?:&|and|-)\s*[0-9]+)?)/i);
      if (m1 && m1[1]) unitNum = m1[1];
      const m2 = fileName.match(/([0-9]+(?:\s*(?:&|and|-)\s*[0-9]+)?)\s*(?:unit|units|ch|chapter)/i);
      if (m2 && m2[1]) unitNum = m2[1];

      if (unitNum) {
        const fileUnit = `Unit ${unitNum.replace(/\s+/g, ' ').toUpperCase()}`;
        if (!detectedUnit || detectedUnit.toLowerCase().includes('complete') || detectedUnit.toLowerCase().includes('all')) {
          detectedUnit = fileUnit;
        }
      }
    }

    // Resolve comprehensive topic
    let resolvedTopic = parsed.topic?.trim() || '';
    if (!resolvedTopic) {
      resolvedTopic = detectedUnit || (parsed.keyTopics ? parsed.keyTopics.slice(0, 3).join(', ') : '');
    } else if (
      detectedUnit &&
      !detectedUnit.toLowerCase().includes('complete') &&
      !resolvedTopic.toLowerCase().includes(detectedUnit.toLowerCase())
    ) {
      resolvedTopic = `${detectedUnit}: ${resolvedTopic}`;
    }

    // Resolve suggestedTitle
    let resolvedTitle = parsed.suggestedTitle?.trim() || '';
    if (
      !resolvedTitle ||
      (detectedUnit && detectedUnit.startsWith('Unit') && resolvedTitle.toLowerCase().includes('complete notes'))
    ) {
      const sub = parsed.subject?.trim() || 'Study Material';
      resolvedTitle = resolvedTopic ? `${sub}: ${resolvedTopic}` : `${sub} Notes`;
    }

    return {
      category: parsed.category === 'pyq' ? 'pyq' : 'note',
      subject: parsed.subject?.trim() || '',
      semester: String(parsed.semester || '1').replace(/\D/g, '') || '1',
      branch: normalizedBranches.length > 0 ? normalizedBranches : parsed.branch || [],
      university: normalizedUni,
      unitsCovered: detectedUnit,
      pattern: parsed.pattern || undefined,
      examType: parsed.examType || undefined,
      examYear: parsed.examYear || undefined,
      suggestedTitle: resolvedTitle,
      topic: resolvedTopic,
      keyTopics: Array.isArray(parsed.keyTopics) ? parsed.keyTopics : [],
      confidence: parsed.confidence || 'medium',
      originalPageCount,
      sampledPageCount: sampledPageIndices?.length,
    };
  } catch (err) {
    console.error('Failed to parse Gemini output:', rawText, err);
    throw new Error('Could not parse structured metadata from model response');
  }
}

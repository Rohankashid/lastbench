import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';

// Read .env.local if present
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...rest] = trimmed.split('=');
      const val = rest.join('=').trim().replace(/^["']|["']$/g, '');
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = val;
      }
    }
  }
}

const apiKey = process.argv[2] || process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

if (!apiKey) {
  console.log('\n❌ No Gemini API Key provided.');
  console.log('Usage: node scripts/test-ai-extractor.mjs <YOUR_GEMINI_API_KEY>');
  console.log('Or add GEMINI_API_KEY=your_key to .env.local\n');
  process.exit(1);
}

async function samplePdfMilestones(pdfBuffer, maxPages = 6) {
  const srcDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();

  if (totalPages <= maxPages) {
    return {
      sampledBuffer: pdfBuffer,
      originalPageCount: totalPages,
      sampledPageIndices: Array.from({ length: totalPages }, (_, i) => i + 1),
      isSampled: false,
    };
  }

  const step = (totalPages - 1) / (maxPages - 1);
  const pickedSet = new Set();
  for (let i = 0; i < maxPages; i++) {
    pickedSet.add(Math.round(i * step));
  }
  const pickedIndices = Array.from(pickedSet).sort((a, b) => a - b);

  const destDoc = await PDFDocument.create();
  const copiedPages = await destDoc.copyPages(srcDoc, pickedIndices);
  for (const page of copiedPages) {
    destDoc.addPage(page);
  }

  const sampledBytes = await destDoc.save();
  return {
    sampledBuffer: Buffer.from(sampledBytes),
    originalPageCount: totalPages,
    sampledPageIndices: pickedIndices.map((idx) => idx + 1),
    isSampled: true,
  };
}

async function testExtraction(filePath, universityHint = 'SPPU') {
  console.log(`\n============================================================`);
  console.log(`Testing: ${filePath}`);
  console.log(`============================================================`);

  const startTime = Date.now();
  const fileBuffer = fs.readFileSync(filePath);
  
  console.log(`📄 Original File Size: ${(fileBuffer.length / 1024).toFixed(1)} KB`);
  const sampleStart = Date.now();
  const sample = await samplePdfMilestones(fileBuffer, 6);
  console.log(`⚡ Milestone Sampling: ${sample.originalPageCount} pages -> ${sample.sampledPageIndices.length} milestone pages [${sample.sampledPageIndices.join(', ')}] in ${Date.now() - sampleStart}ms`);
  console.log(`📦 Sampled Payload Size: ${(sample.sampledBuffer.length / 1024).toFixed(1)} KB`);

  const base64Data = sample.sampledBuffer.toString('base64');

  const prompt = `
You are an expert academic archivist for Indian Engineering Universities (specifically Maharashtra: SPPU, Mumbai University, DBATU).
The document has ${sample.originalPageCount} total pages. You are examining ${sample.sampledPageIndices.length} milestone pages sampled across the file (Pages: ${sample.sampledPageIndices.join(', ')}).
University context hint: "${universityHint}".

Task: Inspect the document pages and extract structured academic metadata.
Even if rough notes or handwritten with no cover page/index, determine from topics across the milestones:
1. "category": 'note' OR 'pyq'.
2. "subject": Canonical engineering subject name.
3. "semester": Number '1' to '8' as string.
4. "branch": Array of applicable engineering branches.
5. "university": Canonical ID (e.g. 'sppu', 'mu', 'dbatu').
6. "unitsCovered": For notes, compare start and end milestones to detect if all units or specific units are covered (e.g. "Units 3 to 6", "Complete Notes (Units 1-6)", "Unit 3 Only"). For PYQ: e.g. "In-Sem Oct 2023", "End-Sem May 2024".
7. "pattern": e.g. "2019 Pattern", "2024 NEP Pattern".
8. "suggestedTitle": Clean, search-friendly academic title.
9. "keyTopics": Array of 3 to 6 engineering topics found.
10. "confidence": 'high', 'medium', or 'low'.

Respond ONLY with valid JSON.
`;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const aiStart = Date.now();

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`❌ Gemini API Error (${res.status}):`, errorText);
    return;
  }

  const data = await res.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  const aiElapsed = ((Date.now() - aiStart) / 1000).toFixed(2);

  console.log(`🤖 Gemini Flash Response in ${aiElapsed}s (Total: ${totalElapsed}s):`);
  try {
    const parsed = JSON.parse(rawText);
    console.dir(parsed, { depth: null, colors: true });
  } catch {
    console.log(rawText);
  }
}

async function runAll() {
  const testFiles = [
    'upload_content/Engineering Chemistry Model Answer Set Unit 3,4,5,6.pdf',
    'upload_content/chem unit 3 notes.pdf',
    'upload_content/Chem 60M Feb 2026.pdf',
  ];

  for (const f of testFiles) {
    if (fs.existsSync(f)) {
      await testExtraction(f, 'SPPU');
    }
  }
}

runAll();

import { PDFDocument } from 'pdf-lib';

export interface SampledPdfResult {
  sampledBytes: Uint8Array;
  sampledBuffer: Buffer;
  originalPageCount: number;
  sampledPageIndices: number[]; // 1-indexed for logging/prompting
  isSampled: boolean;
}

// Target payload threshold for Vercel Serverless Function request bodies (Vercel hard ceiling is 4.5MB)
export const TARGET_MAX_PAYLOAD_BYTES = 3.5 * 1024 * 1024; // 3.5 MB

/**
 * Extracts milestone pages across a PDF document with progressive adaptive payload reduction.
 * Works isomorphically in both client browsers and Node.js serverless functions.
 *
 * Strategy:
 * 1. If totalPages <= maxPages AND inputBytes <= targetMaxBytes:
 *    Returns original bytes untouched (zero copying overhead, instant).
 * 2. If totalPages > maxPages OR inputBytes > targetMaxBytes:
 *    Generates progressive candidate sampling plans:
 *    - Plan 1: Up to maxPages evenly spaced across the entire document
 *    - Plan 2: 3 key milestone pages (Start, Middle, End)
 *    - Plan 3: 2 pages (First page + Second page, containing syllabus/instructions)
 *    - Plan 4: Single Page 1 (university header, subject, pattern, semester, exam type)
 *    Picks the first plan that produces a payload <= targetMaxBytes.
 *    If even Plan 4 exceeds targetMaxBytes, returns Plan 4 as best effort.
 */
export async function samplePdfMilestones(
  pdfData: ArrayBuffer | Uint8Array,
  maxPages = 6,
  targetMaxBytes = TARGET_MAX_PAYLOAD_BYTES
): Promise<SampledPdfResult> {
  const inputBytes = pdfData instanceof Uint8Array ? pdfData : new Uint8Array(pdfData);
  const fallbackBuffer = typeof Buffer !== 'undefined' ? Buffer.from(inputBytes) : (inputBytes as unknown as Buffer);

  try {
    const srcDoc = await PDFDocument.load(inputBytes, { ignoreEncryption: true });
    const totalPages = srcDoc.getPageCount();

    // If document already fits within page count AND size threshold, return original untouched
    if (totalPages <= maxPages && inputBytes.byteLength <= targetMaxBytes) {
      return {
        sampledBytes: inputBytes,
        sampledBuffer: fallbackBuffer,
        originalPageCount: totalPages,
        sampledPageIndices: Array.from({ length: totalPages }, (_, i) => i + 1),
        isSampled: false,
      };
    }

    const isOverBudget = inputBytes.byteLength > targetMaxBytes;

    // Build progressive candidate plans (0-indexed)
    const candidatePlans: number[][] = [];

    // Plan 1: Evenly-spaced milestone pages across document (e.g. 6 pages)
    if (totalPages > maxPages) {
      const step = (totalPages - 1) / Math.max(1, maxPages - 1);
      const pickedSet = new Set<number>();
      for (let i = 0; i < maxPages; i++) {
        pickedSet.add(Math.round(i * step));
      }
      candidatePlans.push(Array.from(pickedSet).sort((a, b) => a - b));
    }

    // Plan 2: 3 key pages (Start, Middle, End)
    if (totalPages >= 3) {
      candidatePlans.push([0, Math.floor((totalPages - 1) / 2), totalPages - 1]);
    }

    // Plan 3: 2 pages (First 2 pages: covers syllabus, instructions, and unit 1/2)
    if (totalPages >= 2) {
      candidatePlans.push([0, 1]);
    }

    // Plan 4: Single Page 1 (Contains university header, subject, pattern, semester, paper title)
    candidatePlans.push([0]);

    // Deduplicate candidate plans and prune any plan that contains ALL pages when already over budget
    const uniquePlans: number[][] = [];
    const seenPlans = new Set<string>();
    for (const plan of candidatePlans) {
      if (isOverBudget && plan.length >= totalPages) continue;
      const key = plan.join(',');
      if (!seenPlans.has(key)) {
        seenPlans.add(key);
        uniquePlans.push(plan);
      }
    }

    // If no candidate plans remain (e.g., single page already over budget), default to [0]
    if (uniquePlans.length === 0) {
      uniquePlans.push([0]);
    }

    let lastSampledBytes: Uint8Array = inputBytes;
    let lastSampledIndices: number[] = [0];

    for (let pIdx = 0; pIdx < uniquePlans.length; pIdx++) {
      const planIndices = uniquePlans[pIdx];
      const destDoc = await PDFDocument.create();
      const copiedPages = await destDoc.copyPages(srcDoc, planIndices);
      for (const page of copiedPages) {
        destDoc.addPage(page);
      }

      const sampledBytes = await destDoc.save({ useObjectStreams: true });
      lastSampledBytes = sampledBytes;
      lastSampledIndices = planIndices;

      // If within size threshold, or if this is the most reduced plan (Page 1 alone), return it
      if (sampledBytes.byteLength <= targetMaxBytes || pIdx === uniquePlans.length - 1) {
        const sampledBuffer = typeof Buffer !== 'undefined' ? Buffer.from(sampledBytes) : (sampledBytes as unknown as Buffer);
        return {
          sampledBytes,
          sampledBuffer,
          originalPageCount: totalPages,
          sampledPageIndices: planIndices.map((idx) => idx + 1),
          isSampled: true,
        };
      }
    }

    // Fallback if loop finishes
    const sampledBuffer = typeof Buffer !== 'undefined' ? Buffer.from(lastSampledBytes) : (lastSampledBytes as unknown as Buffer);
    return {
      sampledBytes: lastSampledBytes,
      sampledBuffer,
      originalPageCount: totalPages,
      sampledPageIndices: lastSampledIndices.map((idx) => idx + 1),
      isSampled: true,
    };
  } catch (err) {
    console.warn('PDF milestone sampling failed, falling back to full data:', err);
    return {
      sampledBytes: inputBytes,
      sampledBuffer: fallbackBuffer,
      originalPageCount: 1,
      sampledPageIndices: [1],
      isSampled: false,
    };
  }
}

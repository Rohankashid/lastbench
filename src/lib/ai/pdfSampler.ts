import { PDFDocument } from 'pdf-lib';

export interface SampledPdfResult {
  sampledBytes: Uint8Array;
  sampledBuffer: Buffer;
  originalPageCount: number;
  sampledPageIndices: number[]; // 1-indexed for logging/prompting
  isSampled: boolean;
}

/**
 * Extracts milestone pages across a PDF document.
 * Works isomorphically in both client browsers and Node.js serverless functions.
 * If total pages <= maxPages, returns the original bytes untouched.
 * If total pages > maxPages (e.g. a 70-page notebook or 50-page compilation):
 * Picks evenly spaced milestone pages (e.g., start, 20%, 40%, 60%, 80%, end)
 * to verify start, middle progression, and syllabus termination.
 */
export async function samplePdfMilestones(
  pdfData: ArrayBuffer | Uint8Array,
  maxPages = 6
): Promise<SampledPdfResult> {
  const inputBytes = pdfData instanceof Uint8Array ? pdfData : new Uint8Array(pdfData);
  const fallbackBuffer = typeof Buffer !== 'undefined' ? Buffer.from(inputBytes) : (inputBytes as any);

  try {
    const srcDoc = await PDFDocument.load(inputBytes, { ignoreEncryption: true });
    const totalPages = srcDoc.getPageCount();

    if (totalPages <= maxPages) {
      return {
        sampledBytes: inputBytes,
        sampledBuffer: fallbackBuffer,
        originalPageCount: totalPages,
        sampledPageIndices: Array.from({ length: totalPages }, (_, i) => i + 1),
        isSampled: false,
      };
    }

    // Calculate milestone page indices (0-indexed)
    const step = (totalPages - 1) / (maxPages - 1);
    const pickedSet = new Set<number>();
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
    const sampledBuffer = typeof Buffer !== 'undefined' ? Buffer.from(sampledBytes) : (sampledBytes as any);

    return {
      sampledBytes,
      sampledBuffer,
      originalPageCount: totalPages,
      sampledPageIndices: pickedIndices.map((idx) => idx + 1),
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

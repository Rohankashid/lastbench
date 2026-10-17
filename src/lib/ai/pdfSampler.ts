import { PDFDocument } from 'pdf-lib';

export interface SampledPdfResult {
  sampledBuffer: Buffer;
  originalPageCount: number;
  sampledPageIndices: number[]; // 1-indexed for logging/prompting
  isSampled: boolean;
}

/**
 * Extracts milestone pages across a PDF document.
 * If total pages <= maxPages, returns the original buffer untouched.
 * If total pages > maxPages (e.g. a 70-page notebook or 50-page compilation):
 * Picks evenly spaced milestone pages (e.g., start, 20%, 40%, 60%, 80%, end)
 * to verify start, middle progression, and syllabus termination.
 */
export async function samplePdfMilestones(
  pdfBuffer: Buffer,
  maxPages = 6
): Promise<SampledPdfResult> {
  try {
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
    return {
      sampledBuffer: Buffer.from(sampledBytes),
      originalPageCount: totalPages,
      sampledPageIndices: pickedIndices.map((idx) => idx + 1),
      isSampled: true,
    };
  } catch (err) {
    console.warn('PDF milestone sampling failed, falling back to full buffer:', err);
    return {
      sampledBuffer: pdfBuffer,
      originalPageCount: 1,
      sampledPageIndices: [1],
      isSampled: false,
    };
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { samplePdfMilestones } from '@/lib/ai/pdfSampler';
import { extractMetadataWithGemini } from '@/lib/ai/geminiExtractor';
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rateLimit';
import { verifyAuth } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';
// Allow up to 30MB payload for analyzing large notes PDFs
export const maxDuration = 30; // Vercel 30s timeout

async function extractMetadataHandler(req: NextRequest) {
  try {
    // 1. Verify Authentication to prevent unauthorized/bot API usage
    const decodedToken = await verifyAuth(req);
    if (!decodedToken) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required to analyze documents' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const fileName = (formData.get('fileName') as string) || file?.name || '';
    const universityHint = (formData.get('university') as string) || '';
    const categoryHint = (formData.get('categoryHint') as 'note' | 'pyq' | null) || undefined;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const mimeType = file.type || 'application/pdf';
    const isPdf = mimeType === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = mimeType.startsWith('image/');

    if (!isPdf && !isImage) {
      return NextResponse.json(
        { error: 'AI analysis currently supports PDF and image formats' },
        { status: 400 }
      );
    }

    const fileArrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(fileArrayBuffer);

    let base64Data = fileBuffer.toString('base64');
    let originalPageCount = 1;
    let sampledPageIndices: number[] = [1];

    if (isPdf) {
      const sampleResult = await samplePdfMilestones(fileBuffer, 6);
      base64Data = sampleResult.sampledBuffer.toString('base64');
      originalPageCount = sampleResult.originalPageCount;
      sampledPageIndices = sampleResult.sampledPageIndices;
    }

    const metadata = await extractMetadataWithGemini({
      fileBase64: base64Data,
      mimeType: isPdf ? 'application/pdf' : mimeType,
      fileName,
      universityHint,
      categoryHint,
      originalPageCount,
      sampledPageIndices,
    });

    return NextResponse.json({
      success: true,
      metadata,
      stats: {
        originalPageCount,
        sampledPageCount: sampledPageIndices.length,
        sampledPageIndices,
      },
    });
  } catch (error: any) {
    console.error('Error in AI metadata extraction route:', error);

    const errorMessage = error?.message || 'Failed to extract metadata';
    const isConfigError = errorMessage.includes('GEMINI_API_KEY');

    return NextResponse.json(
      {
        error: isConfigError ? 'AI_KEY_MISSING' : 'ANALYSIS_FAILED',
        message: errorMessage,
      },
      { status: isConfigError ? 503 : 500 }
    );
  }
}

export const POST = withRateLimit(extractMetadataHandler, RATE_LIMIT_CONFIGS.aiExtract);


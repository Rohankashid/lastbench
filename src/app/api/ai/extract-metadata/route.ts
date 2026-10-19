import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { samplePdfMilestones } from '@/lib/ai/pdfSampler';
import { extractMetadataWithGemini } from '@/lib/ai/geminiExtractor';
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rateLimit';
import { verifyAuth } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';
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

    const contentType = req.headers.get('content-type') || '';
    let fileBuffer: Buffer | null = null;
    let fileName = '';
    let universityHint = '';
    let categoryHint: 'note' | 'pyq' | undefined;
    let mimeType = 'application/pdf';
    let originalPageCount = 1;
    let sampledPageIndices: number[] = [1];
    let isPdf = false;
    let isImage = false;
    let clientPreSampled = false;

    // Option A: Handle direct S3 key reference (bypasses Vercel 4.5MB HTTP request limit)
    if (contentType.includes('application/json')) {
      const body = await req.json().catch(() => ({}));
      const s3Key = body.s3Key as string | undefined;
      fileName = body.fileName || '';
      universityHint = body.university || '';
      categoryHint = body.categoryHint || undefined;

      if (!s3Key && fileName) {
        // Fast filename-based AI classification for Office formats (PPTX, DOCX, etc.)
        const metadata = await extractMetadataWithGemini({
          fileBase64: '',
          mimeType: '',
          fileName,
          universityHint,
          categoryHint,
          originalPageCount: 1,
          sampledPageIndices: [1],
        });

        return NextResponse.json({
          success: true,
          metadata,
          stats: {
            originalPageCount: 1,
            sampledPageCount: 1,
            sampledPageIndices: [1],
          },
        });
      }

      if (!s3Key || typeof s3Key !== 'string') {
        return NextResponse.json({ error: 'No file or s3Key provided' }, { status: 400 });
      }

      // Security safeguard: Only allow reading from temporary ai-temp/ folder
      if (!s3Key.startsWith('ai-temp/')) {
        return NextResponse.json({ error: 'Invalid temporary file key' }, { status: 400 });
      }

      const s3 = new S3Client({
        region: process.env.AWS_REGION!,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      });

      try {
        const getRes = await s3.send(
          new GetObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME!,
            Key: s3Key,
          })
        );

        const bytes = await getRes.Body?.transformToByteArray();
        if (!bytes || bytes.length === 0) {
          throw new Error('Retrieved empty document from storage');
        }
        fileBuffer = Buffer.from(bytes);
        mimeType = getRes.ContentType || (fileName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
      } finally {
        // Immediate cleanup: Delete temporary AI file from S3 to prevent storage bloat
        s3.send(
          new DeleteObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME!,
            Key: s3Key,
          })
        ).catch((delErr) => console.warn('Failed to delete temp AI file from S3:', delErr));
      }

      isPdf = mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
      isImage = mimeType.startsWith('image/');
    } else {
      // Standard multipart/form-data flow for small or client-sampled payloads
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      fileName = (formData.get('fileName') as string) || file?.name || '';
      universityHint = (formData.get('university') as string) || '';
      categoryHint = (formData.get('categoryHint') as 'note' | 'pyq' | null) || undefined;

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      mimeType = file.type || 'application/pdf';
      isPdf = mimeType === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      isImage = mimeType.startsWith('image/');

      if (!isPdf && !isImage) {
        // For non-PDF/image formats (e.g. PPTX, DOCX, TXT), extract metadata from filename
        const metadata = await extractMetadataWithGemini({
          fileBase64: '',
          mimeType: '',
          fileName: fileName || file.name,
          universityHint,
          categoryHint,
          originalPageCount: 1,
          sampledPageIndices: [1],
        });

        return NextResponse.json({
          success: true,
          metadata,
          stats: {
            originalPageCount: 1,
            sampledPageCount: 1,
            sampledPageIndices: [1],
          },
        });
      }

      const fileArrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(fileArrayBuffer);

      const originalPageCountParam = formData.get('originalPageCount');
      const sampledPageIndicesParam = formData.get('sampledPageIndices');

      if (originalPageCountParam) {
        originalPageCount = parseInt(originalPageCountParam as string, 10) || 1;
        clientPreSampled = true;
      }
      if (sampledPageIndicesParam) {
        try {
          sampledPageIndices = JSON.parse(sampledPageIndicesParam as string);
        } catch {}
      }
    }

    if (!fileBuffer) {
      return NextResponse.json({ error: 'Failed to read document data' }, { status: 400 });
    }

    let base64Data = fileBuffer.toString('base64');

    // Run milestone sampling on server if file is PDF and was not pre-sampled by client
    if (isPdf && !clientPreSampled) {
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
  } catch (error: unknown) {
    console.error('Error in AI metadata extraction route:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to extract metadata';
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

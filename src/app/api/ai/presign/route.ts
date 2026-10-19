import { NextRequest, NextResponse } from 'next/server';
import { S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { generateSecureFilename } from '@/lib/fileValidation';
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rateLimit';
import { verifyAuth } from '@/lib/auth-server';

// 50 MB max size for AI scan documents
const MAX_AI_FILE_SIZE = 50 * 1024 * 1024;

const ALLOWED_CONTENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

async function aiPresignHandler(req: NextRequest) {
  try {
    // 1. Verify Authentication
    const decodedToken = await verifyAuth(req);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { filename, contentType, size } = body;

    if (!filename || !contentType) {
      return NextResponse.json({ error: 'Filename and content type required' }, { status: 400 });
    }

    if (size && Number(size) > MAX_AI_FILE_SIZE) {
      return NextResponse.json(
        { error: `File exceeds maximum AI scan limit of ${MAX_AI_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    const normalizedType = contentType.toLowerCase();
    const isSupported = ALLOWED_CONTENT_TYPES.some(
      (type) => normalizedType === type || normalizedType.startsWith('image/')
    );

    if (!isSupported && !filename.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Only PDF and image formats are supported for AI scan' }, { status: 400 });
    }

    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const secureFilename = generateSecureFilename(sanitizedFilename);
    const tempKey = `ai-temp/${decodedToken.uid}_${secureFilename}`;

    const s3 = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const { url, fields } = await createPresignedPost(s3, {
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: tempKey,
      Conditions: [
        ['content-length-range', 0, MAX_AI_FILE_SIZE],
        ['starts-with', '$Content-Type', ''],
      ],
      Fields: {
        'Content-Type': contentType,
      },
      Expires: 900, // 15 minutes
    });

    return NextResponse.json({
      url,
      fields,
      key: tempKey,
    });
  } catch (error) {
    console.error('AI Presign error:', error);
    return NextResponse.json({ error: 'Failed to generate temporary upload URL' }, { status: 500 });
  }
}

export const POST = withRateLimit(aiPresignHandler, RATE_LIMIT_CONFIGS.aiExtract);

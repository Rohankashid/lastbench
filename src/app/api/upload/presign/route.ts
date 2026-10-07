import { NextRequest, NextResponse } from 'next/server';
import { S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { generateSecureFilename } from '@/lib/fileValidation';
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rateLimit';
import { verifyAuth } from '@/lib/auth-server';

// 100 MB max size
const MAX_FILE_SIZE = 100 * 1024 * 1024;

const ALLOWED_CONTENT_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/plain',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];

async function presignHandler(req: NextRequest) {
  try {
    // 1. Verify Authentication
    const decodedToken = await verifyAuth(req);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { filename, contentType, 'cf-turnstile-response': token } = await req.json();

    if (!filename || !contentType) {
      return NextResponse.json({ error: 'Filename and content type required' }, { status: 400 });
    }

    // 2. Turnstile siteverify
    const expectedAction = "upload_material";
    // Usually hostnames like "lastbench.online", "www.lastbench.online", or "localhost"
    // Since Vercel creates preview URLs, we fallback to a loose check if TURNSTILE_HOSTNAMES isn't strictly set.
    const expectedHostnames = new Set(
      (process.env.TURNSTILE_HOSTNAMES ?? "lastbench.online,www.lastbench.online,localhost,127.0.0.1")
        .split(",")
        .map((h) => h.trim())
        .filter(Boolean)
    );

    if (
      typeof token !== "string" ||
      token.length === 0 ||
      token.length > 2048 ||
      expectedHostnames.size === 0
    ) {
      return NextResponse.json({ error: 'Turnstile token missing or invalid' }, { status: 403 });
    }

    try {
      const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        // Use standard timeout via AbortController as AbortSignal.timeout isn't fully supported in all node versions
        signal: AbortSignal.timeout ? AbortSignal.timeout(10_000) : undefined,
        body: new URLSearchParams({
          secret: process.env.TURNSTILE_SECRET || '',
          response: token,
          remoteip: req.headers.get('x-forwarded-for') || '',
        }),
      });
      if (!r.ok) throw new Error(`siteverify ${r.status}`);
      const result = await r.json();
      
      if (!result.success || result.action !== expectedAction || !expectedHostnames.has(result.hostname)) {
        return NextResponse.json({ error: 'Failed security verification' }, { status: 403 });
      }
    } catch (e) {
      console.error('Turnstile verification error:', e);
      return NextResponse.json({ error: 'Security verification failed' }, { status: 403 });
    }

    // 3. Server-side type validation
    if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const secureFilename = generateSecureFilename(sanitizedFilename);
    const contentDisposition = `inline; filename="${filename.replace(/[^a-zA-Z0-9.\-_ ]/g, '')}"`;

    const s3 = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    // 3. Create a strict Presigned POST policy (Enforces size limits)
    const { url, fields } = await createPresignedPost(s3, {
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: secureFilename,
      Conditions: [
        ['content-length-range', 0, MAX_FILE_SIZE], // Strictly limit to 100MB
        ['eq', '$Content-Type', contentType],       // Strictly enforce content type
        ['eq', '$Content-Disposition', contentDisposition],
      ],
      Fields: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition,
      },
      Expires: 3600,
    });

    const fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${secureFilename}`;

    return NextResponse.json({
      url,
      fields,
      secureFilename,
      fileUrl,
      sanitizedFilename,
      contentDisposition
    });
  } catch (error) {
    console.error('Presign error:', error);
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
  }
}

export const POST = withRateLimit(presignHandler, RATE_LIMIT_CONFIGS.upload);

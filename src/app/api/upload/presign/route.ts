import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { generateSecureFilename } from '@/lib/fileValidation';
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rateLimit';

async function presignHandler(req: NextRequest) {
  try {
    const { filename, contentType, size } = await req.json();

    if (!filename || !contentType) {
      return NextResponse.json({ error: 'Filename and content type required' }, { status: 400 });
    }

    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const secureFilename = generateSecureFilename(sanitizedFilename);

    const s3 = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: secureFilename,
      ContentType: contentType,
      ContentDisposition: 'inline',
    });

    const presignedUrl = await getSignedUrl(s3 as any, command, { expiresIn: 3600 });
    const fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${secureFilename}`;

    return NextResponse.json({
      presignedUrl,
      secureFilename,
      fileUrl,
      sanitizedFilename
    });
  } catch (error) {
    console.error('Presign error:', error);
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
  }
}

export const POST = withRateLimit(presignHandler, RATE_LIMIT_CONFIGS.upload);

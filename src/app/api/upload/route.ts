import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export async function POST(req: NextRequest) {
  // Parse the multipart form data
  const formData = await req.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  // Read the file into a buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const s3 = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  const uploadParams = {
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: file.name,
    Body: buffer,
    ContentType: file.type,
    ContentDisposition: 'attachment',
  };

  try {
    await s3.send(new PutObjectCommand(uploadParams));
    const fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${file.name}`;
    return NextResponse.json({ url: fileUrl });
  } catch (error) {
    console.error('S3 upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
} 
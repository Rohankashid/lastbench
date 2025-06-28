import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return NextResponse.json({
    awsRegion: process.env.AWS_REGION,
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID ? 'Set' : 'Not set',
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ? 'Set' : 'Not set',
    s3BucketName: process.env.S3_BUCKET_NAME,
    nodeEnv: process.env.NODE_ENV,
  });
} 
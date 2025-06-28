import { NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command, HeadObjectCommand } from '@aws-sdk/client-s3';

export async function GET() {
  try {
    console.log('Testing S3 configuration...');
    
    const s3 = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    console.log('Environment variables:');
    console.log('- AWS_REGION:', process.env.AWS_REGION);
    console.log('- S3_BUCKET_NAME:', process.env.S3_BUCKET_NAME);
    console.log('- AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'Set' : 'Not set');

    if (!process.env.S3_BUCKET_NAME) {
      return NextResponse.json({ 
        error: 'S3_BUCKET_NAME not configured',
        env: {
          region: process.env.AWS_REGION,
          accessKeySet: !!process.env.AWS_ACCESS_KEY_ID,
          bucketName: process.env.S3_BUCKET_NAME
        }
      }, { status: 400 });
    }

    // Test 1: List objects in bucket
    try {
      const listCommand = new ListObjectsV2Command({
        Bucket: process.env.S3_BUCKET_NAME,
        MaxKeys: 5, // Limit to 5 objects for testing
      });

      const listResult = await s3.send(listCommand);
      console.log('List objects result:', listResult);

      return NextResponse.json({
        success: true,
        message: 'S3 configuration test successful',
        bucket: process.env.S3_BUCKET_NAME,
        region: process.env.AWS_REGION,
        objects: listResult.Contents?.map(obj => ({
          key: obj.Key,
          size: obj.Size,
          lastModified: obj.LastModified
        })) || [],
        totalObjects: listResult.KeyCount
      });
    } catch (listError) {
      console.error('List objects failed:', listError);
      return NextResponse.json({
        error: 'Failed to list objects',
        details: listError instanceof Error ? listError.message : 'Unknown error',
        bucket: process.env.S3_BUCKET_NAME,
        region: process.env.AWS_REGION
      }, { status: 500 });
    }

  } catch (error) {
    console.error('S3 test error:', error);
    return NextResponse.json({
      error: 'S3 configuration test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { S3Client, DeleteObjectCommand, HeadObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

export async function POST(req: NextRequest) {
  try {
    const { key } = await req.json();

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    console.log('Testing S3 delete for key:', key);

    const s3 = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const bucketName = 'lastbench-prod';

    console.log('Environment variables:');
    console.log('- AWS_REGION:', process.env.AWS_REGION);
    console.log('- AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'Set' : 'Not set');
    console.log('- Bucket:', bucketName);

    // Step 1: List objects to see what's in the bucket
    try {
      console.log('Step 1: Listing objects in bucket...');
      const listCommand = new ListObjectsV2Command({
        Bucket: bucketName,
        MaxKeys: 10,
      });

      const listResult = await s3.send(listCommand);
      console.log('Objects in bucket:', listResult.Contents?.map(obj => obj.Key));
    } catch (listError) {
      console.error('Failed to list objects:', listError);
    }

    // Step 2: Check if the specific file exists
    try {
      console.log('Step 2: Checking if file exists...');
      const headCommand = new HeadObjectCommand({
        Bucket: bucketName,
        Key: key,
      });
      
      const headResult = await s3.send(headCommand);
      console.log('File exists, size:', headResult.ContentLength, 'bytes');
    } catch (headError) {
      console.error('File does not exist:', headError);
      return NextResponse.json({ 
        error: 'File not found', 
        details: headError instanceof Error ? headError.message : 'Unknown error'
      }, { status: 404 });
    }

    // Step 3: Attempt deletion
    try {
      console.log('Step 3: Attempting deletion...');
      const deleteCommand = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      });
      
      const deleteResult = await s3.send(deleteCommand);
      console.log('Delete result:', deleteResult);
    } catch (deleteError) {
      console.error('Delete failed:', deleteError);
      return NextResponse.json({ 
        error: 'Delete failed', 
        details: deleteError instanceof Error ? deleteError.message : 'Unknown error'
      }, { status: 500 });
    }

    // Step 4: Verify deletion
    try {
      console.log('Step 4: Verifying deletion...');
      const verifyHeadCommand = new HeadObjectCommand({
        Bucket: bucketName,
        Key: key,
      });
      
      await s3.send(verifyHeadCommand);
      console.error('File still exists after deletion!');
      return NextResponse.json({ 
        error: 'File still exists after deletion', 
        details: 'Deletion appeared successful but file still exists'
      }, { status: 500 });
    } catch (verifyError) {
      console.log('File successfully deleted (verification passed)');
    }

    return NextResponse.json({ 
      success: true, 
      message: 'File successfully deleted and verified',
      details: {
        bucket: bucketName,
        key: key
      }
    });

  } catch (error) {
    console.error('Test S3 delete error:', error);
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
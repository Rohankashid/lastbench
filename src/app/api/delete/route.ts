import { NextRequest, NextResponse } from 'next/server';
import { S3Client, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

export async function DELETE(req: NextRequest) {
  try {
    const { fileUrl } = await req.json();

    if (!fileUrl) {
      return NextResponse.json({ error: 'File URL is required' }, { status: 400 });
    }

    console.log('Attempting to delete file:', fileUrl);

    // Check if this is an S3 URL (broader pattern matching)
    if (fileUrl.includes('s3.amazonaws.com') || fileUrl.includes('s3.')) {
      // Extract the key from the S3 URL
      const url = new URL(fileUrl);
      const key = decodeURIComponent(url.pathname.substring(1)); // Remove leading slash and decode URL
      
      console.log('S3 URL detected, key:', key);
      console.log('S3 URL hostname:', url.hostname);
      console.log('S3 URL pathname:', url.pathname);
      console.log('Decoded key:', key);

      // Extract bucket name from hostname
      const hostnameParts = url.hostname.split('.');
      const extractedBucketName = hostnameParts[0];
      console.log('Extracted bucket name from URL:', extractedBucketName);

      const s3 = new S3Client({
        region: process.env.AWS_REGION!,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      });

      // Try with extracted bucket name first, then fallback to env variable
      const bucketName = extractedBucketName || process.env.S3_BUCKET_NAME!;
      
      const deleteParams = {
        Bucket: bucketName,
        Key: key,
      };

      console.log('S3 delete params:', deleteParams);
      console.log('Environment variables:');
      console.log('- AWS_REGION:', process.env.AWS_REGION);
      console.log('- S3_BUCKET_NAME (env):', process.env.S3_BUCKET_NAME);
      console.log('- Extracted bucket name:', extractedBucketName);
      console.log('- Final bucket name used:', bucketName);
      console.log('- AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'Set' : 'Not set');

      // First, check if the file exists
      try {
        console.log('Checking if file exists before deletion...');
        const headCommand = new HeadObjectCommand({
          Bucket: bucketName,
          Key: key,
        });
        
        const headResult = await s3.send(headCommand);
        console.log('File exists, size:', headResult.ContentLength, 'bytes');
      } catch (headError) {
        console.error('File does not exist or cannot be accessed:', headError);
        return NextResponse.json({ 
          error: 'File not found or cannot be accessed', 
          details: headError instanceof Error ? headError.message : 'Unknown error',
          params: { bucket: bucketName, key: key }
        }, { status: 404 });
      }

      try {
        console.log('Attempting to delete file...');
        const result = await s3.send(new DeleteObjectCommand(deleteParams));
        console.log('S3 delete command result:', result);
        
        // Verify deletion by trying to head the object again
        try {
          console.log('Verifying deletion...');
          const verifyHeadCommand = new HeadObjectCommand({
            Bucket: bucketName,
            Key: key,
          });
          
          await s3.send(verifyHeadCommand);
          console.error('File still exists after deletion attempt!');
          return NextResponse.json({ 
            error: 'File still exists after deletion', 
            details: 'Deletion appeared successful but file still exists',
            params: deleteParams
          }, { status: 500 });
        } catch (verifyError) {
          console.log('File successfully deleted (verification passed)');
        }
        
        console.log('S3 file deleted successfully');
        
        return NextResponse.json({ 
          success: true, 
          message: 'S3 file deleted successfully',
          details: {
            bucket: bucketName,
            key: key,
            result: result
          }
        });
      } catch (s3Error) {
        console.error('S3 delete command failed:', s3Error);
        return NextResponse.json({ 
          error: 'S3 delete failed', 
          details: s3Error instanceof Error ? s3Error.message : 'Unknown S3 error',
          params: deleteParams
        }, { status: 500 });
      }
    } else {
      // This is not an S3 URL (likely Firebase Storage)
      console.log('Not an S3 URL, skipping S3 deletion');
      return NextResponse.json({ 
        success: true, 
        message: 'Not an S3 URL, skipping S3 deletion',
        note: 'This appears to be a Firebase Storage URL'
      });
    }
  } catch (error) {
    console.error('S3 delete error:', error);
    return NextResponse.json({ 
      error: 'Delete failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
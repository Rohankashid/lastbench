import { NextRequest, NextResponse } from 'next/server';
import { S3Client, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rateLimit';

async function deleteHandler(req: NextRequest) {
  try {
    const { fileUrl } = await req.json();

    if (!fileUrl) {
      return NextResponse.json({ error: 'File URL is required' }, { status: 400 });
    }

    if (fileUrl.includes('s3.amazonaws.com') || fileUrl.includes('s3.')) {
      const url = new URL(fileUrl);
      const key = decodeURIComponent(url.pathname.substring(1)); // Remove leading slash and decode URL

      // Extract bucket name from hostname
      const hostnameParts = url.hostname.split('.');
      const extractedBucketName = hostnameParts[0];

      const s3 = new S3Client({
        region: process.env.AWS_REGION!,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      });
      const bucketName = extractedBucketName || process.env.S3_BUCKET_NAME!;
      
      const deleteParams = {
        Bucket: bucketName,
        Key: key,
      };

      try {
        const headCommand = new HeadObjectCommand({
          Bucket: bucketName,
          Key: key,
        });
        
        await s3.send(headCommand);
      } catch (headError) {
        console.error('File does not exist or cannot be accessed:', headError);
        return NextResponse.json({ 
          error: 'File not found or cannot be accessed', 
          details: headError instanceof Error ? headError.message : 'Unknown error',
          params: { bucket: bucketName, key: key }
        }, { status: 404 });
      }

      try {
        const result = await s3.send(new DeleteObjectCommand(deleteParams));
        
        try {
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
        } catch {
          // File was deleted successfully, verifyHeadCommand throws 404/NotFound as expected
        }
        
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
export const DELETE = withRateLimit(deleteHandler, RATE_LIMIT_CONFIGS.delete); 
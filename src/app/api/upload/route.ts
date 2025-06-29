import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rateLimit';
import { 
  validateFileUpload, 
  generateSecureFilename, 
  logFileValidation,
  STUDY_MATERIAL_VALIDATION 
} from '@/lib/fileValidation';

async function uploadHandler(req: NextRequest) {
  try {
    // Validate the file upload
    const validation = await validateFileUpload(req, STUDY_MATERIAL_VALIDATION);
    
    if (!validation.isValid || !validation.file || !validation.sanitizedFilename) {
      return NextResponse.json({ 
        error: 'File validation failed', 
        details: validation.error || 'Invalid file or missing filename'
      }, { status: 400 });
    }

    const { file, sanitizedFilename } = validation;

    // Generate a secure filename to prevent conflicts and improve security
    const secureFilename = generateSecureFilename(sanitizedFilename);

    // Read the file into a buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Log the file validation for security monitoring
    logFileValidation(
      file.name,
      file.size,
      file.type,
      file.type, // For now, using declared type as detected type
      true
    );

    const s3 = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: secureFilename, // Use secure filename instead of original
      Body: buffer,
      ContentType: file.type,
      ContentDisposition: 'attachment',
      // Add metadata for security tracking
      Metadata: {
        'original-filename': sanitizedFilename,
        'upload-timestamp': new Date().toISOString(),
        'file-size': file.size.toString(),
        'content-type': file.type,
      },
    };

    try {
      await s3.send(new PutObjectCommand(uploadParams));
      const fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${secureFilename}`;
      
      return NextResponse.json({ 
        url: fileUrl,
        filename: secureFilename,
        originalName: sanitizedFilename,
        size: file.size,
        type: file.type,
      });
    } catch (error) {
      console.error('S3 upload error:', error);
      return NextResponse.json({ 
        error: 'Upload failed', 
        details: error instanceof Error ? error.message : 'Unknown S3 error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Upload handler error:', error);
    return NextResponse.json({ 
      error: 'Upload failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export const POST = withRateLimit(uploadHandler, RATE_LIMIT_CONFIGS.upload); 
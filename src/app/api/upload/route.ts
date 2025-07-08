import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rateLimit';
import { 
  generateSecureFilename, 
  logFileValidation,
  STUDY_MATERIAL_VALIDATION 
} from '@/lib/fileValidation';
import { db } from '@/lib/firebaseAdmin';
import crypto from 'crypto';
// Remove: import { addDoc, collection } from 'firebase/firestore';

async function uploadHandler(req: NextRequest) {
  try {
    // Get form data to extract metadata
    const formData = await req.formData();
    
    // Extract metadata from form data
    const metadata = {
      name: formData.get('name') as string || '',
      university: formData.get('university') as string || '',
      semester: formData.get('semester') as string || '',
      subject: formData.get('subject') as string || '',
      category: formData.get('category') as string || 'note',
      branch: formData.get('branch') as string || '',
      year: formData.get('year') as string || '',
      // fileHash is ignored from client, always recompute below
    };

    // Get the file from form data
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ 
        error: 'File validation failed', 
        details: 'No file uploaded'
      }, { status: 400 });
    }

    // Basic file validation
    const errors: string[] = [];
    
    // Check file size
    if (file.size > STUDY_MATERIAL_VALIDATION.maxSizeBytes) {
      errors.push(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds ${STUDY_MATERIAL_VALIDATION.maxSizeBytes / 1024 / 1024}MB limit`);
    }

    // Check file extension
    const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!STUDY_MATERIAL_VALIDATION.allowedExtensions.includes(ext)) {
      errors.push(`File extension ${ext} not allowed. Allowed: ${STUDY_MATERIAL_VALIDATION.allowedExtensions.join(', ')}`);
    }

    // Check MIME type
    if (!STUDY_MATERIAL_VALIDATION.allowedMimeTypes.includes(file.type)) {
      errors.push(`File type ${file.type} not allowed`);
    }

    if (errors.length > 0) {
      return NextResponse.json({ 
        error: 'File validation failed', 
        details: errors.join('; ')
      }, { status: 400 });
    }

    // Generate a secure filename
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const secureFilename = generateSecureFilename(sanitizedFilename);

    // Read the file into a buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Always compute file hash (SHA256) on server
    const hashSum = crypto.createHash('sha256');
    hashSum.update(buffer);
    const fileHash = hashSum.digest('hex');

    // Check Firestore for existing file with same hash
    const existing = await db.collection('materials').where('fileHash', '==', fileHash).get();
    if (!existing.empty) {
      return NextResponse.json({
        error: 'Duplicate file',
        details: 'A file with the same content already exists.',
        fileHash,
      }, { status: 409 });
    }

    // Log the file validation for security monitoring
    logFileValidation(
      file.name,
      file.size,
      file.type,
      file.type,
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
      Key: secureFilename,
      Body: buffer,
      ContentType: file.type,
      ContentDisposition: 'attachment',
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
      
      // Save metadata to Firestore
      try {
        const firestoreData = {
          name: metadata.name || sanitizedFilename.replace(/\.[^/.]+$/, ""),
          university: metadata.university,
          semester: metadata.semester,
          subject: metadata.subject,
          category: metadata.category,
          branch: metadata.branch,
          year: metadata.category === 'pyq' ? metadata.year : null,
          fileUrl: fileUrl,
          filename: secureFilename,
          originalName: sanitizedFilename,
          fileSize: file.size,
          fileType: file.type,
          uploadedBy: 'auto-upload-script',
          uploadedAt: new Date().toISOString(),
          fileHash, // Always store the hash
        };

        // Remove empty fields
        Object.keys(firestoreData).forEach(key => {
          if (firestoreData[key as keyof typeof firestoreData] === '' || firestoreData[key as keyof typeof firestoreData] === null || firestoreData[key as keyof typeof firestoreData] === undefined) {
            delete firestoreData[key as keyof typeof firestoreData];
          }
        });

        await db.collection('materials').add(firestoreData);
        
        console.log('✅ File uploaded to S3 and metadata saved to Firestore:', {
          filename: secureFilename,
          category: metadata.category,
          name: firestoreData.name
        });
        
      } catch (firestoreError) {
        console.error('❌ Firestore save error:', firestoreError);
        return NextResponse.json({ 
          url: fileUrl,
          filename: secureFilename,
          originalName: sanitizedFilename,
          size: file.size,
          type: file.type,
          warning: 'File uploaded but metadata not saved to database',
          firestoreError: firestoreError instanceof Error ? firestoreError.message : 'Unknown Firestore error'
        });
      }
      
      return NextResponse.json({ 
        url: fileUrl,
        filename: secureFilename,
        originalName: sanitizedFilename,
        size: file.size,
        type: file.type,
        metadata: {
          name: metadata.name || sanitizedFilename.replace(/\.[^/.]+$/, ""),
          category: metadata.category,
          subject: metadata.subject,
          university: metadata.university,
          semester: metadata.semester,
          branch: metadata.branch,
          year: metadata.category === 'pyq' ? metadata.year : null
        }
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
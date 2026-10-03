import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { verifyAuth } from '@/lib/auth-server';
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rateLimit';

async function confirmHandler(req: NextRequest) {
  try {
    // 1. Verify Authentication
    const decodedToken = await verifyAuth(req);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { metadata, fileDetails } = data;
    
    const firestoreData = {
      name: metadata.name || fileDetails.originalName.replace(/\.[^/.]+$/, ""),
      university: metadata.university,
      semester: metadata.semester,
      subject: metadata.subject,
      category: metadata.category,
      branch: metadata.branch,
      year: metadata.category === 'pyq' ? metadata.year : null,
      fileUrl: fileDetails.fileUrl,
      filename: fileDetails.filename,
      originalName: fileDetails.originalName,
      fileSize: fileDetails.size,
      fileType: fileDetails.type,
      uploadedBy: decodedToken.uid, // Force uploadedBy to be the authenticated user
      uploadedAt: new Date().toISOString(),
    };

    // Remove empty fields
    Object.keys(firestoreData).forEach(key => {
      if (firestoreData[key as keyof typeof firestoreData] === '' || firestoreData[key as keyof typeof firestoreData] === null || firestoreData[key as keyof typeof firestoreData] === undefined) {
        delete firestoreData[key as keyof typeof firestoreData];
      }
    });

    await db.collection('materials').add(firestoreData);

    return NextResponse.json({ success: true, url: fileDetails.fileUrl });
  } catch (error) {
    console.error('Confirm error:', error);
    return NextResponse.json({ error: 'Failed to save metadata' }, { status: 500 });
  }
}

// Wrap with rate limiting
export const POST = withRateLimit(confirmHandler, RATE_LIMIT_CONFIGS.upload);

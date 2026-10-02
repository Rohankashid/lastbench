import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { metadata, fileDetails } = data;
    
    // Check for duplicates (simplified hash check skipped for client upload)
    
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
      uploadedBy: metadata.uploadedBy || 'student',
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

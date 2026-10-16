import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { verifyAuth } from '@/lib/auth-server';
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rateLimit';
import { FieldValue } from 'firebase-admin/firestore';

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
      rightsConfirmed: metadata.rightsConfirmed || false,
      rightsConfirmedAt: metadata.rightsConfirmed ? new Date().toISOString() : null,
    };

    // Remove empty fields
    Object.keys(firestoreData).forEach(key => {
      if (firestoreData[key as keyof typeof firestoreData] === '' || firestoreData[key as keyof typeof firestoreData] === null || firestoreData[key as keyof typeof firestoreData] === undefined) {
        delete firestoreData[key as keyof typeof firestoreData];
      }
    });

    const docRef = await db.collection('materials').add(firestoreData);

    // Sync to Supabase
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase.from('materials').upsert({
          id: docRef.id,
          title: firestoreData.name,
          name: firestoreData.name,
          category: firestoreData.category,
          subject: firestoreData.subject,
          university: firestoreData.university,
          university_short: firestoreData.university?.includes('SPPU') ? 'SPPU' : (firestoreData.university?.includes('DBATU') ? 'DBATU' : null),
          branch: firestoreData.branch,
          semester: String(firestoreData.semester || '1'),
          year: firestoreData.year || null,
          exam_year: firestoreData.year || null,
          file_url: firestoreData.fileUrl,
          download_url: firestoreData.fileUrl,
          file_size: firestoreData.fileSize ? parseInt(String(firestoreData.fileSize), 10) : null,
          file_type: firestoreData.fileType || null,
          original_name: firestoreData.originalName || null,
          uploaded_by: decodedToken.uid,
          uploaded_at: firestoreData.uploadedAt,
          helpful_count: 0
        });
      }
    } catch (supaErr) {
      console.error('Supabase sync error in upload confirm:', supaErr);
    }

    // Increment user's contribution count
    const userRef = db.collection('users').doc(decodedToken.uid);
    await userRef.set({
      contributionsCount: FieldValue.increment(1),
      lastContributionAt: new Date().toISOString()
    }, { merge: true });

    return NextResponse.json({ success: true, url: fileDetails.fileUrl });
  } catch (error) {
    console.error('Confirm error:', error);
    return NextResponse.json({ error: 'Failed to save metadata' }, { status: 500 });
  }
}

// Wrap with rate limiting
export const POST = withRateLimit(confirmHandler, RATE_LIMIT_CONFIGS.upload);

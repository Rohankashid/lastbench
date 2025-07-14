import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';

// Initialize Firebase if not already initialized
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
if (!getApps().length) {
  initializeApp(firebaseConfig);
}
const db = getFirestore();

// Define the Material type for Firestore documents
export type Material = {
  id: string;
  university?: string;
  name?: string;
  downloadCount?: number;
  uploaderInfo?: string;
  uploadedBy?: string;
  semester?: string;
  branch?: string;
  subject?: string;
  year?: string;
  category?: string;
  // Add other fields as needed
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    if (!category) {
      return NextResponse.json({ error: 'category is required' }, { status: 400 });
    }
    const semester = searchParams.get('semester');
    const branch = searchParams.get('branch');
    const university = searchParams.get('university');
    const subject = searchParams.get('subject');
    const year = searchParams.get('year');
    const name = searchParams.get('name');
    const limitParam = parseInt(searchParams.get('limit') || '20', 10);
    const offsetParam = parseInt(searchParams.get('offset') || '0', 10);
    const limitVal = Math.min(Math.max(limitParam, 1), 100);
    const offsetVal = Math.max(offsetParam, 0);

    let q = query(collection(db, 'materials'), where('category', '==', category));
    if (semester) q = query(q, where('semester', '==', semester));
    if (branch) q = query(q, where('branch', '==', branch));
    if (subject) q = query(q, where('subject', '==', subject));
    if (year) q = query(q, where('year', '==', year));
    // Firestore does not support case-insensitive or partial queries natively, so we fetch and filter in-memory for those fields
    const docsSnap = await getDocs(q);
    let docs: Material[] = docsSnap.docs.map((doc): Material => ({ id: doc.id, ...doc.data() } as Material));
    if (university) {
      docs = docs.filter((d: Material) => d.university && d.university.toLowerCase().includes(university.toLowerCase()));
    }
    if (name) {
      docs = docs.filter((d: Material) => d.name && d.name.toLowerCase().includes(name.toLowerCase()));
    }
    // Pagination
    const pagedDocs = docs.slice(offsetVal, offsetVal + limitVal);
    // Add downloadCount and uploaderInfo
    const result = pagedDocs.map((d: Material) => ({
      ...d,
      downloadCount: d.downloadCount || 0,
      uploaderInfo: d.uploaderInfo || d.uploadedBy || null,
    }));
    return NextResponse.json({ materials: result, total: docs.length });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error', details: String(err) }, { status: 500 });
  }
} 
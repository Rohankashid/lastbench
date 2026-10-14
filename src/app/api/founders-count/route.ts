import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const snapshot = await db.collection('users').count().get();
    const count = snapshot.data().count;
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching founders count:', error);
    return NextResponse.json({ count: 0 });
  }
}

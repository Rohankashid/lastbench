import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef
      .where('contributionsCount', '>', 0)
      .orderBy('contributionsCount', 'desc')
      .limit(50)
      .get();

    const leaderboard = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        uid: doc.id,
        name: data.name || data.email?.split('@')[0] || 'Anonymous Student',
        university: data.university || 'Maharashtra Engineering',
        contributionsCount: data.contributionsCount || 0,
      };
    });

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}

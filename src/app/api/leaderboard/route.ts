import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { isAdminEmail } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef
      .where('contributionsCount', '>', 0)
      .orderBy('contributionsCount', 'desc')
      .limit(50)
      .get();

    const leaderboard: Array<{
      uid: string;
      name: string;
      university: string;
      contributionsCount: number;
    }> = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const email = data.email || '';
      const isAdmin = data.role === 'admin' || isAdminEmail(email);

      if (isAdmin) {
        // Reset admin contribution count so database stays clean
        usersRef.doc(doc.id).update({ contributionsCount: 0 }).catch(() => {});
        continue;
      }

      leaderboard.push({
        uid: doc.id,
        name: data.name || email.split('@')[0] || 'Anonymous Student',
        university: data.university || 'Maharashtra Engineering',
        contributionsCount: data.contributionsCount || 0,
      });
    }

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}

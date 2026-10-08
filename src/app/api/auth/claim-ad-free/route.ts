import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-server';
import { db } from '@/lib/firebaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const token = await verifyAuth(req);
    if (!token?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const usersRef = db.collection('users');
    
    // Run a secure transaction to check count and assign status
    const result = await db.runTransaction(async (t) => {
      // Get the count of users who already have adFree status
      const snapshot = await t.get(usersRef.where('adFree', '==', true));
      
      const userDocRef = usersRef.doc(token.uid);
      const userDoc = await t.get(userDocRef);

      if (!userDoc.exists) {
        return { success: false, message: 'User not found' };
      }
      
      if (userDoc.data()?.adFree) {
        return { success: true, message: 'Already ad-free' };
      }

      if (snapshot.size < 100) {
        t.update(userDocRef, { adFree: true, adFreeGrantedAt: new Date().toISOString() });
        return { success: true, message: 'Ad-free status granted!', spotsLeft: 99 - snapshot.size };
      } else {
        return { success: false, message: 'All 100 spots have been claimed.' };
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Claim ad-free error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

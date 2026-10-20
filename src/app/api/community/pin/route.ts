import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, isAdminEmail } from '@/lib/auth-server';
import { db } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  try {
    const token = await verifyAuth(req);
    if (!token?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdminEmail(token.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { postId, action } = body;

    if (!postId || !['pin', 'unpin'].includes(action)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const postRef = db.collection('community_posts').doc(postId);
    
    if (action === 'pin') {
      await postRef.update({
        pinnedAt: FieldValue.serverTimestamp()
      });
    } else {
      await postRef.update({
        pinnedAt: null
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Community pin error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

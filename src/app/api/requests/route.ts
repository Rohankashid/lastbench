import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const snapshot = await db
      .collection('paper_requests')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const requests = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Error fetching paper requests:', error);
    return NextResponse.json({ requests: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { description, source, userId, userEmail, userName, isFoundingMember } = body;

    if (!description || typeof description !== 'string' || !description.trim()) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    if (!userId || !userEmail || typeof userEmail !== 'string' || !userEmail.includes('@')) {
      return NextResponse.json(
        { error: 'Sign in with a verified account is required to submit a paper request' },
        { status: 401 }
      );
    }

    const docRef = await db.collection('paper_requests').add({
      description: description.trim(),
      source: source || 'general',
      userId: userId.trim(),
      userEmail: userEmail.trim().toLowerCase(),
      userName: userName?.trim() || null,
      isFoundingMember: Boolean(isFoundingMember),
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error('Error saving paper request:', error);
    return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'ID and status required' }, { status: 400 });
    }

    await db.collection('paper_requests').doc(id).update({
      status,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating paper request status:', error);
    return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await db.collection('paper_requests').doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting paper request:', error);
    return NextResponse.json({ error: 'Failed to delete request' }, { status: 500 });
  }
}

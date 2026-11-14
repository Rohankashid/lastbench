import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { sendFulfillmentEmail } from '@/lib/email';

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
    const { id, status, sendNotification = true } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'ID and status required' }, { status: 400 });
    }

    const docRef = db.collection('paper_requests').doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const data = docSnap.data();
    const now = new Date().toISOString();
    const updateData: Record<string, unknown> = {
      status,
      updatedAt: now,
    };

    let emailResult: { sent: boolean; error?: string } = { sent: false };

    // Auto-send notification email if marking fulfilled and student provided an email
    if (status === 'fulfilled' && sendNotification && data?.userEmail) {
      try {
        await sendFulfillmentEmail({
          to: data.userEmail,
          studentName: data.userName,
          description: data.description || 'Requested study material',
          source: data.source,
        });
        updateData.notifiedAt = now;
        emailResult = { sent: true };
      } catch (err: unknown) {
        console.error('Failed to auto-send fulfillment email:', err);
        emailResult = { sent: false, error: err instanceof Error ? err.message : 'Email delivery failed' };
      }
    }

    await docRef.update(updateData);

    return NextResponse.json({
      success: true,
      emailResult,
      notifiedAt: updateData.notifiedAt || data?.notifiedAt || null,
    });
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

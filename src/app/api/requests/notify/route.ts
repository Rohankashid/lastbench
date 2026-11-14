import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { sendFulfillmentEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Valid request ID is required' }, { status: 400 });
    }

    const docRef = db.collection('paper_requests').doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const data = docSnap.data();
    if (!data?.userEmail) {
      return NextResponse.json(
        { error: 'This request does not have an associated student email address' },
        { status: 400 }
      );
    }

    // Send email directly through Resend
    await sendFulfillmentEmail({
      to: data.userEmail,
      studentName: data.userName,
      description: data.description || 'Requested study material',
      source: data.source,
    });

    const now = new Date().toISOString();
    await docRef.update({
      notifiedAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ success: true, notifiedAt: now });
  } catch (error) {
    console.error('Error sending notification email:', error);
    const message = error instanceof Error ? error.message : 'Failed to send notification email';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

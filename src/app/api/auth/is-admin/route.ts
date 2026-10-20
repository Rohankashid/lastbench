import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, isAdminEmail } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    const token = await verifyAuth(req);
    if (!token?.email) {
      return NextResponse.json({ isAdmin: false });
    }

    const isAdmin = isAdminEmail(token.email);
    
    return NextResponse.json({ isAdmin });
  } catch (error) {
    console.error('is-admin error:', error);
    return NextResponse.json({ isAdmin: false });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    const token = await verifyAuth(req);
    if (!token?.email) {
      return NextResponse.json({ isAdmin: false });
    }

    const admins = (process.env.ADMIN_USER_EMAILS || '')
      .split(',')
      .map(e => e.trim().toLowerCase());

    const isAdmin = admins.includes(token.email.toLowerCase());
    
    return NextResponse.json({ isAdmin });
  } catch (error) {
    console.error('is-admin error:', error);
    return NextResponse.json({ isAdmin: false });
  }
}

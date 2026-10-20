import { NextRequest } from 'next/server';
import { auth } from './firebaseAdmin';
import type { DecodedIdToken } from 'firebase-admin/auth';

export async function verifyAuth(req: NextRequest): Promise<DecodedIdToken | null> {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Auth verification failed:', error);
    return null;
  }
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const admins = (process.env.ADMIN_USER_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}

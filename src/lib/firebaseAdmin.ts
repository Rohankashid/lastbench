import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import type { Auth } from 'firebase-admin/auth';

let adminApp: App | null = null;
let firestoreInstance: Firestore | null = null;
let authInstance: Auth | null = null;

function getAdminApp(): App {
  if (adminApp) return adminApp;
  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error('Firebase Admin credentials missing from environment:', {
      hasProjectId: !!projectId,
      hasClientEmail: !!clientEmail,
      hasPrivateKey: !!privateKey,
    });
    throw new Error(
      'Firebase Admin credentials incomplete. Ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set.'
    );
  }

  // Handle potential surrounding quotes, double-escaped backslashes, and escaped newlines
  privateKey = privateKey
    .replace(/^["']|["']$/g, '')
    .replace(/\\\\n/g, '\n')
    .replace(/\\n/g, '\n');

  adminApp = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  return adminApp;
}

export const db: Firestore = new Proxy({} as Firestore, {
  get(_target, prop) {
    if (!firestoreInstance) {
      getAdminApp();
      firestoreInstance = getFirestore();
    }
    const value = (firestoreInstance as any)[prop];
    if (typeof value === 'function') {
      return value.bind(firestoreInstance);
    }
    return value;
  },
});

export const auth: Auth = new Proxy({} as Auth, {
  get(_target, prop) {
    if (!authInstance) {
      getAdminApp();
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getAuth } = require('firebase-admin/auth');
      authInstance = getAuth();
    }
    const value = (authInstance as any)[prop];
    if (typeof value === 'function') {
      return value.bind(authInstance);
    }
    return value;
  },
});
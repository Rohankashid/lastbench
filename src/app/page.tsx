import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import HomePageClient from './HomePageClient';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
};

export default async function HomePage() {
  const cookieStore = await cookies();
  const hasAuth = cookieStore.get('lb_auth')?.value === '1';

  return <HomePageClient initialHasSession={hasAuth} />;
}

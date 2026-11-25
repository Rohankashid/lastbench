export interface DocumentAnalyticsData {
  id: string;
  title: string;
  subject?: string;
  semester?: string;
  university?: string;
  category?: string;
  branch?: string;
  examYear?: string;
  year?: string;
  [key: string]: unknown;
}

async function getPostHog() {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as { posthog?: typeof import('posthog-js').default };
  if (win.posthog) return win.posthog;
  try {
    const { default: posthog } = await import('posthog-js');
    return posthog;
  } catch {
    return null;
  }
}

/**
 * Track when a study material or past paper is viewed / previewed.
 */
export async function trackDocumentView(doc: DocumentAnalyticsData) {
  if (typeof window === 'undefined') return;
  try {
    const ph = await getPostHog();
    ph?.capture('document_viewed', {
      doc_id: doc.id,
      title: doc.title,
      subject: doc.subject || 'Unknown Subject',
      semester: doc.semester || null,
      university: doc.university || 'General',
      category: doc.category || 'note',
      branch: doc.branch || null,
      exam_year: doc.examYear || doc.year || null,
      source: 'web_app',
    });
  } catch (err) {
    console.debug('Analytics view track error:', err);
  }
}

/**
 * Track when a study material or past paper is downloaded.
 */
export async function trackDocumentDownload(doc: DocumentAnalyticsData) {
  if (typeof window === 'undefined') return;
  try {
    const ph = await getPostHog();
    ph?.capture('document_downloaded', {
      doc_id: doc.id,
      title: doc.title,
      subject: doc.subject || 'Unknown Subject',
      semester: doc.semester || null,
      university: doc.university || 'General',
      category: doc.category || 'note',
      branch: doc.branch || null,
      exam_year: doc.examYear || doc.year || null,
      source: 'web_app',
    });
  } catch (err) {
    console.debug('Analytics download track error:', err);
  }
}

/**
 * Identify a user in PostHog when they sign in.
 */
export async function trackIdentifyUser(
  userId: string,
  traits?: { email?: string | null; name?: string | null; [key: string]: unknown }
) {
  if (typeof window === 'undefined') return;
  try {
    const ph = await getPostHog();
    ph?.identify(userId, traits || {});
  } catch (err) {
    console.debug('Analytics identify error:', err);
  }
}

/**
 * Reset user identity on sign out.
 */
export async function trackResetUser() {
  if (typeof window === 'undefined') return;
  try {
    const ph = await getPostHog();
    ph?.reset();
  } catch (err) {
    console.debug('Analytics reset error:', err);
  }
}

import posthog from 'posthog-js';

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

/**
 * Track when a study material or past paper is viewed / previewed.
 */
export function trackDocumentView(doc: DocumentAnalyticsData) {
  if (typeof window === 'undefined') return;
  try {
    posthog.capture('document_viewed', {
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
export function trackDocumentDownload(doc: DocumentAnalyticsData) {
  if (typeof window === 'undefined') return;
  try {
    posthog.capture('document_downloaded', {
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
export function trackIdentifyUser(
  userId: string,
  traits?: { email?: string | null; name?: string | null; [key: string]: unknown }
) {
  if (typeof window === 'undefined') return;
  try {
    posthog.identify(userId, traits || {});
  } catch (err) {
    console.debug('Analytics identify error:', err);
  }
}

/**
 * Reset user identity on sign out.
 */
export function trackResetUser() {
  if (typeof window === 'undefined') return;
  try {
    posthog.reset();
  } catch (err) {
    console.debug('Analytics reset error:', err);
  }
}

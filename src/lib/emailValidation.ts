/**
 * Email validation utility to block disposable/temporary email domains
 * and dummy email addresses.
 */

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  // Popular temporary email services
  'mailinator.com',
  'tempmail.com',
  'temp-mail.org',
  '10minutemail.com',
  '10minutemail.net',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.biz',
  'sharklasers.com',
  'throwawaymail.com',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'getnada.com',
  'abav.net',
  'burnermail.io',
  'dispostable.com',
  'inboxkitten.com',
  'crazymailing.com',
  'dropmail.me',
  'mohmal.com',
  'fakemailgenerator.com',
  'generator.email',
  'trashmail.com',
  'mytemp.email',
  'emailondeck.com',
  'tempail.com',
  'nada.ltd',
  'nada.email',
  'getairmail.com',
  'minuteinbox.com',
  'internxt.com',
  'maildrop.cc',
  'fastmail.org',
  'mytempmail.com',
  'disposablemail.com',
]);

const OBVIOUS_DUMMY_DOMAINS = new Set([
  'example.com',
  'test.com',
  'domain.com',
  'sample.com',
  'none.com',
  'dummy.com',
  'fake.com',
  'invalid.com',
  'asdf.com',
  'qwerty.com',
]);

/**
 * Validates whether an email is syntactically valid and not from a disposable or dummy domain.
 */
export function validateStudentEmail(rawEmail: string): { isValid: boolean; error?: string } {
  const email = (rawEmail || '').trim().toLowerCase();

  if (!email) {
    return { isValid: false, error: 'Email address is required.' };
  }

  // Basic RFC 5322 regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address.' };
  }

  const parts = email.split('@');
  if (parts.length !== 2) {
    return { isValid: false, error: 'Invalid email address format.' };
  }

  const [username, domain] = parts;

  // Check username length
  if (username.length < 2) {
    return { isValid: false, error: 'Email username is too short.' };
  }

  // Check disposable domains
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return {
      isValid: false,
      error: 'Disposable and temporary email addresses are not allowed. Please use your genuine personal or college email.',
    };
  }

  // Check obvious dummy domains
  if (OBVIOUS_DUMMY_DOMAINS.has(domain)) {
    return {
      isValid: false,
      error: 'Please enter a real email address (e.g., Gmail, Outlook, or your college email).',
    };
  }

  // Check obvious dummy patterns
  if (username === 'test' || username === 'dummy' || username === 'fake' || username === 'asdf') {
    return {
      isValid: false,
      error: 'Please enter a genuine student email address.',
    };
  }

  return { isValid: true };
}

export function isDisposableEmailDomain(email: string): boolean {
  const parts = (email || '').trim().toLowerCase().split('@');
  if (parts.length !== 2) return false;
  return DISPOSABLE_EMAIL_DOMAINS.has(parts[1]);
}

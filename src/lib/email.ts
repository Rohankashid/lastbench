import { Resend } from 'resend';
import nodemailer, { type Transporter } from 'nodemailer';

export interface SendFulfillmentEmailParams {
  to: string;
  studentName?: string | null;
  description: string;
  source?: string;
}

/**
 * Creates a Gmail SMTP transporter if Gmail App Password is configured.
 */
function getGmailTransporter(): Transporter | null {
  const pass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASSWORD;
  if (!pass || !pass.trim()) {
    return null;
  }
  const user = process.env.GMAIL_USER || process.env.SMTP_USER || 'contact.lastbench@gmail.com';
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user.trim(),
      pass: pass.trim().replace(/\s+/g, ''), // Strip spaces from Google 16-char app password format
    },
  });
}

/**
 * Creates a configured Resend client instance if the API key is present.
 */
function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    return null;
  }
  return new Resend(apiKey.trim());
}

/**
 * Sends a background transactional notification email to a student when their
 * requested study material has been uploaded and fulfilled.
 * Supports both Gmail SMTP (contact.lastbench@gmail.com via App Password) and Resend.
 */
export async function sendFulfillmentEmail(params: SendFulfillmentEmailParams): Promise<{ success: boolean; id?: string }> {
  const { to, studentName, description, source } = params;

  if (!to || !to.includes('@')) {
    throw new Error('A valid recipient email address is required.');
  }

  const gmailTransporter = getGmailTransporter();
  const resend = getResendClient();

  if (!gmailTransporter && !resend) {
    throw new Error(
      'Email provider not configured. Please add either GMAIL_APP_PASSWORD in .env.local (to send directly from contact.lastbench@gmail.com) or RESEND_API_KEY.'
    );
  }

  const name = studentName?.trim() || 'Student';
  const isNotes = source === 'notes';
  const categoryLabel = isNotes ? 'Engineering Notes' : 'Previous Year Question Papers (PYQ)';
  const targetUrl = isNotes
    ? 'https://www.lastbench.online/notes'
    : 'https://www.lastbench.online/pyqs';

  const subject = 'Your requested study material is now live on LastBench! 🎓';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px 16px; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18181b;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e4e4e7; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);">
    
    <!-- Header Banner -->
    <tr>
      <td style="background-color: #09090b; padding: 28px 32px; text-align: left;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <span style="font-size: 20px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">
                LAST<span style="color: #10b981;">BENCH</span>
              </span>
            </td>
            <td style="text-align: right;">
              <span style="display: inline-block; padding: 4px 10px; font-size: 11px; font-weight: 600; color: #10b981; background-color: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px;">
                Request Fulfilled
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Main Content -->
    <tr>
      <td style="padding: 32px 32px 24px 32px;">
        <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #09090b; letter-spacing: -0.3px;">
          Good news, ${name}! 🎉
        </h1>
        
        <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #3f3f46;">
          The study material you requested on LastBench has just been uploaded and is ready for you to access and download.
        </p>

        <!-- Request Details Box -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
          <tr>
            <td style="padding: 16px 20px;">
              <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 6px;">
                Requested Material &bull; ${categoryLabel}
              </div>
              <div style="font-size: 14px; font-weight: 600; color: #0f172a; line-height: 1.5; font-style: italic;">
                &ldquo;${escapeHtml(description)}&rdquo;
              </div>
            </td>
          </tr>
        </table>

        <!-- Call to Action Button -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 28px 0;">
          <tr>
            <td style="text-align: center;">
              <a href="${targetUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #09090b; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 13px 28px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                View &amp; Download Material &rarr;
              </a>
            </td>
          </tr>
        </table>

        <p style="margin: 0 0 12px 0; font-size: 13px; line-height: 1.5; color: #71717a;">
          Thank you for contributing to the LastBench student community. Material requests help us ensure syllabus-aligned notes and university papers are always accessible to every engineering student.
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #fafafa; border-top: 1px solid #f4f4f5; padding: 20px 32px; text-align: center;">
        <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #71717a;">
          LastBench &bull; Free Engineering Study Resources
        </p>
        <p style="margin: 0; font-size: 11px; color: #a1a1aa;">
          You received this email because you submitted a material request on 
          <a href="https://www.lastbench.online" style="color: #71717a; text-decoration: underline;">lastbench.online</a>.
        </p>
      </td>
    </tr>

  </table>
</body>
</html>
  `.trim();

  const text = `
Hi ${name},

Good news! The study material you requested on LastBench:
"${description}"

has now been uploaded and is ready for you to view and download:
${targetUrl}

Thank you for contributing to the LastBench student community!

Best regards,
The LastBench Team
https://www.lastbench.online
  `.trim();

  // Mode 1: Send directly via Gmail SMTP (contact.lastbench@gmail.com)
  if (gmailTransporter) {
    const gmailUser = process.env.GMAIL_USER || process.env.SMTP_USER || 'contact.lastbench@gmail.com';
    const info = await gmailTransporter.sendMail({
      from: `LastBench <${gmailUser.trim()}>`,
      to,
      replyTo: gmailUser.trim(),
      subject,
      html,
      text,
    });
    return { success: true, id: info.messageId };
  }

  // Mode 2: Send via Resend
  if (resend) {
    const fromEmail =
      process.env.RESEND_FROM_EMAIL?.trim() ||
      'LastBench <notifications@lastbench.online>';

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      replyTo: 'contact.lastbench@gmail.com',
      subject,
      html,
      text,
    });

    if (error) {
      throw new Error(error.message || 'Resend failed to deliver the notification email.');
    }

    return { success: true, id: data?.id };
  }

  throw new Error('No email provider is configured.');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

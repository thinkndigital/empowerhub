import { Resend } from 'resend';

let client: Resend | null = null;
function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!client) client = new Resend(key);
  return client;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

// Best-effort: never throws. If RESEND_API_KEY isn't configured (local dev),
// logs and no-ops instead of breaking the API route that triggered it.
export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<void> {
  const resend = getClient();
  const from = process.env.EMAIL_FROM || 'EmpowerHub <notifications@empowerhub.thinkndigital.com>';
  if (!resend) {
    console.warn(`[mailer] RESEND_API_KEY not set — skipping email to ${to}: ${subject}`);
    return;
  }
  try {
    await resend.emails.send({ from, to, subject, html });
  } catch (e: any) {
    console.error(`[mailer] failed to send email to ${to}:`, e?.message || e);
  }
}

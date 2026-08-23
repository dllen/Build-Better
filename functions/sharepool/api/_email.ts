import type { Env } from "./_env";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

export function buildVerificationEmail(to: string, verifyUrl: string): EmailMessage {
  return {
    to,
    subject: "Verify your SharePool email",
    html:
      `<p>Welcome to SharePool. Confirm your email address to start sharing:</p>` +
      `<p><a href="${verifyUrl}">${verifyUrl}</a></p>` +
      `<p>If you didn't create an account, you can ignore this email.</p>`,
  };
}

// Sends via Resend. Never throws; returns false on failure so registration
// is not blocked by an unreachable email provider.
export async function sendEmail(env: Env, msg: EmailMessage): Promise<boolean> {
  if (!env.RESEND_API_KEY || !env.RESEND_FROM) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: env.RESEND_FROM,
        to: [msg.to],
        subject: msg.subject,
        html: msg.html,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

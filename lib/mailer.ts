import nodemailer from 'nodemailer';
import dns from 'dns';

// Force IPv4 resolution to prevent ETIMEDOUT issues on local environments/ISPs that do not support IPv6 SMTP
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';

if (!RESEND_API_KEY) {
  console.warn(
    '[Mailer] WARNING: RESEND_API_KEY is not set. Emails will not be sent.'
  );
}

function createTransport() {
  return nodemailer.createTransport({
    host: 'smtp.resend.com',
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: 'resend',
      pass: RESEND_API_KEY,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '')
  : 'https://novix-messenger-next-js.onrender.com';

function otpEmailHtml(
  title: string,
  subtitle: string,
  code: string,
  note: string
) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#0E1621;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0E1621;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#17212B;border-radius:16px;overflow:hidden;max-width:480px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#5EBBF5,#3A9AD9);padding:32px 40px;text-align:center;">
              <div style="width:64px;height:64px;background:rgba(255,255,255,0.2);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;">
                <span style="font-size:32px;font-weight:800;color:#fff;line-height:64px;display:block;">N</span>
              </div>
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#fff;letter-spacing:-0.3px;">Novix Messenger</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <h2 style="margin:0 0 8px;font-size:20px;font-weight:600;color:#fff;">${title}</h2>
              <p style="margin:0 0 28px;font-size:14px;color:#7D8E9A;line-height:1.6;">${subtitle}</p>
              <!-- OTP Box -->
              <div style="background:#0E1621;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;border:1px solid #1C2A38;">
                <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#5D6D7C;letter-spacing:1px;text-transform:uppercase;">Your verification code</p>
                <p style="margin:0;font-size:40px;font-weight:800;letter-spacing:12px;color:#5EBBF5;font-family:'Courier New',monospace;">${code}</p>
              </div>
              <p style="margin:0;font-size:13px;color:#5D6D7C;line-height:1.6;">${note}</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #1C2A38;text-align:center;">
              <p style="margin:0;font-size:12px;color:#5D6D7C;">If you didn't request this, you can safely ignore this email.</p>
              <p style="margin:8px 0 0;font-size:11px;color:#3A4A5A;">© ${new Date().getFullYear()} Novix Messenger</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ✅ Single shared send function using SMTP
async function sendMail(
  to: string,
  subject: string,
  html: string,
  label: string
): Promise<void> {
  if (!RESEND_API_KEY) {
    throw new Error(
      `[Mailer] Cannot send ${label} — RESEND_API_KEY SMTP credentials are missing.`
    );
  }

  const transport = createTransport();

  try {
    console.log(`[Mailer] Sending ${label} to ${to} via Resend SMTP...`);

    const info = await transport.sendMail({
      from: 'Novix Messenger <onboarding@resend.dev>',
      to,
      subject,
      html,
    });

    console.log(`[Mailer] ${label} sent successfully via SMTP.`, {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    });
  } catch (err: unknown) {
    console.error(`[Mailer] Failed to send ${label} to ${to} via SMTP:`, {
      message: err instanceof Error ? err.message : String(err),
      code: (err as Record<string, unknown>)?.code,
      command: (err as Record<string, unknown>)?.command,
      response: (err as Record<string, unknown>)?.response,
      responseCode: (err as Record<string, unknown>)?.responseCode,
    });
    throw err;
  } finally {
    transport.close(); // ✅ Always release connection
  }
}

export async function sendVerificationEmail(
  to: string,
  code: string
): Promise<void> {
  console.log(`\n✉️  [MAIL] Verification OTP code for ${to} is: ${code}\n`);
  await sendMail(
    to,
    `${code} — Verify your Novix account`,
    otpEmailHtml(
      'Verify Your Email',
      'Thanks for signing up! Enter the code below to verify your email address and activate your account.',
      code,
      'This code expires in <strong style="color:#fff;">15 minutes</strong>. Do not share it with anyone.'
    ),
    'VerificationEmail'
  );
}

export async function sendPasswordResetEmail(
  to: string,
  code: string
): Promise<void> {
  console.log(`\n✉️  [MAIL] Password Reset OTP code for ${to} is: ${code}\n`);
  await sendMail(
    to,
    `${code} — Reset your Novix password`,
    otpEmailHtml(
      'Reset Your Password',
      'We received a request to reset the password for your Novix account. Enter the code below to proceed.',
      code,
      'This code expires in <strong style="color:#fff;">15 minutes</strong>. If you did not request a password reset, please ignore this email.'
    ),
    'PasswordResetEmail'
  );
}

export async function sendEmailChangeEmail(
  to: string,
  code: string
): Promise<void> {
  console.log(`\n✉️  [MAIL] Email Change OTP code for ${to} is: ${code}\n`);
  await sendMail(
    to,
    `${code} — Confirm your new Novix email`,
    otpEmailHtml(
      'Confirm Email Change',
      'Enter the code below to confirm this as the new email address for your Novix account.',
      code,
      'This code expires in <strong style="color:#fff;">15 minutes</strong>. Your email will not change until you enter this code.'
    ),
    'EmailChangeEmail'
  );
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
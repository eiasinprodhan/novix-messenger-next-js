import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

function getCredentials() {
  let user = (process.env.GMAIL_USER || process.env.SMTP_USER || '').trim();
  let pass = (process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || '').replace(/\s+/g, '');

  if (!user || !pass || user === 'your-email@gmail.com') {
    try {
      dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });
      dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: false });
      user = (process.env.GMAIL_USER || process.env.SMTP_USER || '').trim();
      pass = (process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || '').replace(/\s+/g, '');
    } catch {
      // ignore
    }
  }

  return { user, pass };
}

const initialCreds = getCredentials();
if (!initialCreds.user || !initialCreds.pass || initialCreds.user === 'your-email@gmail.com') {
  console.warn(
    '[Mailer] WARNING: GMAIL_USER / GMAIL_APP_PASSWORD is not properly configured. Emails will not be sent.'
  );
} else {
  console.log(`[Mailer] Gmail SMTP configured for ${initialCreds.user}`);
}

function getTransporter() {
  const { user, pass } = getCredentials();

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass,
    },
  });
}

function getBaseUrl(): string {
  // Prefer the public-facing URL from env, strip /api suffix
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  if (apiUrl) return apiUrl.replace(/\/api\/?$/, '');
  return 'https://novixmessenger.online';
}

/**
 * Wraps plain text content into a clean, normal-text email representation.
 * Avoids heavy dark cards, complex tables, and bloated styling so that emails
 * appear as standard readable messages across all clients and avoid spam classification.
 */
export function toNormalTextHtml(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Make web links clickable
  const linkified = escaped.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" style="color: #0284c7; text-decoration: underline;">$1</a>'
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin: 0; padding: 24px 16px; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #1f2937;">
  <div style="max-width: 580px; margin: 0 auto; white-space: pre-wrap; word-break: break-word;">
${linkified}
  </div>
</body>
</html>`;
}

export function otpEmailText(
  title: string,
  subtitle: string,
  code: string,
  note?: string
): string {
  const baseUrl = getBaseUrl();

  let text = `Hello,\n\n${subtitle}\n\n`;
  text += `Your verification code is: ${code}\n\n`;
  if (note) {
    // Strip any HTML tags if passed from legacy callers
    const cleanNote = note.replace(/<[^>]+>/g, '');
    text += `${cleanNote}\n\n`;
  } else {
    text += `This code is valid for 15 minutes. For security reasons, please do not share this code with anyone.\n\n`;
  }
  text += `If you did not request this email, you can safely ignore it.\n\n`;
  text += `Best regards,\nNovix Messenger Team\n${baseUrl}`;

  return text;
}

/**
 * Legacy compatibility export for HTML OTP email template,
 * now returning clean, normal text HTML.
 */
export function otpEmailHtml(
  title: string,
  subtitle: string,
  code: string,
  note: string
): string {
  return toNormalTextHtml(otpEmailText(title, subtitle, code, note));
}

export interface SendMailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  label?: string;
}

export async function sendMail(
  optionsOrTo: string | SendMailOptions,
  subjectParam?: string,
  textOrHtmlParam?: string,
  labelParam: string = 'Email'
): Promise<void> {
  let to: string;
  let subject: string;
  let text: string;
  let html: string | undefined;
  let label: string;

  if (typeof optionsOrTo === 'object' && optionsOrTo !== null) {
    to = optionsOrTo.to;
    subject = optionsOrTo.subject;
    text = optionsOrTo.text;
    html = optionsOrTo.html ?? toNormalTextHtml(text);
    label = optionsOrTo.label || 'Email';
  } else {
    to = optionsOrTo;
    subject = subjectParam || '';
    const body = textOrHtmlParam || '';
    label = labelParam;

    if (body.includes('<html') || body.includes('</div>') || body.includes('</p>')) {
      html = body;
      text = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    } else {
      text = body;
      html = toNormalTextHtml(body);
    }
  }

  const { user, pass } = getCredentials();

  if (!user || !pass || user === 'your-email@gmail.com' || pass === 'your-16-digit-app-password') {
    throw new Error(
      `[Mailer] Cannot send ${label} — GMAIL_USER and GMAIL_APP_PASSWORD are not properly configured in .env / .env.local.`
    );
  }

  console.log(`[Mailer] Sending ${label} to ${to} via Gmail SMTP (${user})...`);
  const transporter = getTransporter();
  const mailOptions: nodemailer.SendMailOptions = {
    from: `"Novix Messenger" <${user}>`,
    to,
    subject,
    text,
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[Mailer] ${label} sent successfully via Gmail SMTP. MessageId: ${info.messageId}`);
}

export async function sendVerificationEmail(
  to: string,
  code: string,
  name?: string
): Promise<void> {
  console.log(`\n✉️  [MAIL] Verification OTP code for ${to} is: ${code}\n`);
  const greeting = name ? `Hello ${name},` : 'Hello,';
  const text = `${greeting}

Thank you for signing up for Novix Messenger!

Your verification code is: ${code}

This code is valid for 15 minutes. For security reasons, please do not share this code with anyone.

If you did not request this verification code, you can safely ignore this email.

Best regards,
Novix Messenger Team
${getBaseUrl()}`;

  await sendMail({
    to,
    subject: `${code} is your Novix Messenger verification code`,
    text,
    html: toNormalTextHtml(text),
    label: 'VerificationEmail',
  });
}

export async function sendPasswordResetEmail(
  to: string,
  code: string,
  name?: string
): Promise<void> {
  console.log(`\n✉️  [MAIL] Password Reset OTP code for ${to} is: ${code}\n`);
  const greeting = name ? `Hello ${name},` : 'Hello,';
  const text = `${greeting}

We received a request to reset the password for your Novix Messenger account.

Your password reset code is: ${code}

This code is valid for 15 minutes.

If you did not request a password reset, you can safely ignore this email. Your account remains secure.

Best regards,
Novix Messenger Team
${getBaseUrl()}`;

  await sendMail({
    to,
    subject: `${code} is your Novix Messenger password reset code`,
    text,
    html: toNormalTextHtml(text),
    label: 'PasswordResetEmail',
  });
}

export async function sendEmailChangeEmail(
  to: string,
  code: string,
  name?: string
): Promise<void> {
  console.log(`\n✉️  [MAIL] Email Change OTP code for ${to} is: ${code}\n`);
  const greeting = name ? `Hello ${name},` : 'Hello,';
  const text = `${greeting}

We received a request to confirm this address as the new email for your Novix Messenger account.

Your confirmation code is: ${code}

This code is valid for 15 minutes. Your email address will not change until this code is verified.

If you did not request this change, you can safely ignore this email and review your account security.

Best regards,
Novix Messenger Team
${getBaseUrl()}`;

  await sendMail({
    to,
    subject: `${code} is your Novix Messenger email change code`,
    text,
    html: toNormalTextHtml(text),
    label: 'EmailChangeEmail',
  });
}

export async function sendWelcomeEmail(
  to: string,
  name?: string
): Promise<void> {
  console.log(`\n✉️  [MAIL] Sending Welcome Email to ${to}\n`);
  const greeting = name ? `Hello ${name},` : 'Hello,';
  const text = `${greeting}

Welcome to Novix Messenger! Your account has been verified and is ready to use.

Novix Messenger offers fast, secure, and private messaging across all your devices.

Here are a few quick tips to get started:
• Complete your profile and avatar
• Connect with friends and family
• Start private chats or create groups and channels
• Make crystal-clear voice and video calls

If you have any questions or need assistance, feel free to visit our website or reach out to our team.

Welcome aboard!

Best regards,
Novix Messenger Team
${getBaseUrl()}`;

  await sendMail({
    to,
    subject: 'Welcome to Novix Messenger!',
    text,
    html: toNormalTextHtml(text),
    label: 'WelcomeEmail',
  });
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function adminNotificationEmailText(
  title: string,
  badgeText: string,
  message: string,
  metadataItems: { label: string; value: string }[] = []
): string {
  let text = `[NOVIX ADMIN NOTIFICATION - ${badgeText}]\n\n`;
  text += `${title}\n\n`;
  text += `${message}\n\n`;

  if (metadataItems.length > 0) {
    text += `Details:\n`;
    for (const item of metadataItems) {
      text += `• ${item.label}: ${item.value}\n`;
    }
    text += `\n`;
  }

  const adminUrl = `${getBaseUrl()}/admin`;
  text += `Admin Console: ${adminUrl}\n\n`;
  text += `Server Time: ${new Date().toUTCString()}\n`;
  text += `—\nNovix Messenger System Alert`;

  return text;
}

export function adminNotificationEmailHtml(
  title: string,
  badgeText: string,
  message: string,
  metadataItems: { label: string; value: string }[] = []
): string {
  return toNormalTextHtml(adminNotificationEmailText(title, badgeText, message, metadataItems));
}

export async function sendAdminNotificationEmail({
  to,
  subject,
  title,
  badgeText = 'ADMIN ALERT',
  message,
  metadataItems = [],
}: {
  to: string;
  subject: string;
  title: string;
  badgeText?: string;
  message: string;
  metadataItems?: { label: string; value: string }[];
}): Promise<void> {
  console.log(`\n🔔 [ADMIN MAIL] Sending alert to ${to}: ${subject}\n`);
  const text = adminNotificationEmailText(title, badgeText, message, metadataItems);
  await sendMail({
    to,
    subject: `[Novix Admin] ${subject}`,
    text,
    html: toNormalTextHtml(text),
    label: 'AdminNotification',
  });
}
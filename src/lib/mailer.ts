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
  return 'http://130.210.13.242:3000';
}

function otpEmailHtml(
  title: string,
  subtitle: string,
  code: string,
  note: string
) {
  const baseUrl = getBaseUrl();
  const logoUrl = `${baseUrl}/novix_vpn.png`;
  const year = new Date().getFullYear();

  // Split the 6-digit code into individual character cells for a stylish box display
  const codeDigits = code.split('');
  const digitCells = codeDigits
    .map(
      (d) =>
        `<td style="width:48px;height:56px;background:#0E1621;border:2px solid #3390EC;border-radius:10px;text-align:center;vertical-align:middle;font-size:28px;font-weight:800;color:#5EBBF5;font-family:'Courier New',Courier,monospace;letter-spacing:0;">${d}</td>`
    )
    .join('<td style="width:6px;"></td>');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#0E1621;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <!--[if mso]><table role="presentation" align="center" width="520"><tr><td><![endif]-->
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#0E1621;padding:40px 16px;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="520" style="max-width:520px;width:100%;background-color:#17212B;border-radius:20px;overflow:hidden;border:1px solid #1E2D3D;">

          <!-- ══ HEADER ══ -->
          <tr>
            <td style="background:linear-gradient(135deg,#2B5278 0%,#1A3A5C 100%);padding:32px 40px 28px;text-align:center;">
              <!-- Logo image with text fallback -->
              <img src="${logoUrl}"
                   alt="Novix Messenger"
                   width="72"
                   height="72"
                   style="display:block;margin:0 auto 14px;width:72px;height:72px;border-radius:18px;object-fit:contain;background:rgba(255,255,255,0.08);"
                   onerror="this.style.display='none';document.getElementById('logo-fallback').style.display='inline-block';"
              />
              <div id="logo-fallback" style="display:none;width:72px;height:72px;background:rgba(255,255,255,0.15);border-radius:18px;margin:0 auto 14px;text-align:center;line-height:72px;">
                <span style="font-size:36px;font-weight:900;color:#ffffff;">N</span>
              </div>
              <h1 style="margin:0;font-size:20px;font-weight:700;color:#FFFFFF;letter-spacing:-0.2px;line-height:1.3;">Novix Messenger</h1>
              <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.55);letter-spacing:0.5px;text-transform:uppercase;">Security Notification</p>
            </td>
          </tr>

          <!-- ══ DIVIDER ══ -->
          <tr>
            <td style="height:0;border-bottom:1px solid #1E2D3D;"></td>
          </tr>

          <!-- ══ BODY ══ -->
          <tr>
            <td style="padding:36px 40px 32px;">

              <!-- Title -->
              <h2 style="margin:0 0 10px;font-size:22px;font-weight:700;color:#FFFFFF;letter-spacing:-0.3px;">${title}</h2>
              <p style="margin:0 0 30px;font-size:14px;color:#8E9CAE;line-height:1.7;">${subtitle}</p>

              <!-- OTP Box -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#0D1923;border-radius:14px;border:1px solid #1E2D3D;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px 10px;text-align:center;">
                    <p style="margin:0 0 16px;font-size:11px;font-weight:700;color:#4A6580;letter-spacing:2px;text-transform:uppercase;">Your Verification Code</p>
                    <!-- Digit boxes -->
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                      <tr>${digitCells}</tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 24px 20px;text-align:center;">
                    <p style="margin:0;font-size:12px;color:#4A6580;">
                      ⏱&nbsp; Expires in <strong style="color:#8E9CAE;">15 minutes</strong>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Note -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#0F1E2A;border-left:3px solid #3390EC;border-radius:0 8px 8px 0;margin-bottom:4px;">
                <tr>
                  <td style="padding:14px 18px;">
                    <p style="margin:0;font-size:13px;color:#7D8E9A;line-height:1.65;">${note}</p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- ══ FOOTER ══ -->
          <tr>
            <td style="background-color:#111B25;padding:22px 40px;border-top:1px solid #1E2D3D;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#4A6580;line-height:1.5;">
                If you didn't request this, you can safely ignore this email.<br/>
                Your account remains secure.
              </p>
              <p style="margin:10px 0 0;font-size:11px;color:#2E3F4F;">
                © ${year} Novix Messenger &nbsp;·&nbsp;
                <a href="${baseUrl}" style="color:#3390EC;text-decoration:none;">novixvpn.com</a>
              </p>
            </td>
          </tr>

        </table>
        <!-- /Card -->

      </td>
    </tr>
  </table>
  <!--[if mso]></td></tr></table><![endif]-->
</body>
</html>`;
}

async function sendMail(
  to: string,
  subject: string,
  html: string,
  label: string
): Promise<void> {
  const { user, pass } = getCredentials();

  if (!user || !pass || user === 'your-email@gmail.com' || pass === 'your-16-digit-app-password') {
    throw new Error(
      `[Mailer] Cannot send ${label} — GMAIL_USER and GMAIL_APP_PASSWORD are not properly configured in .env / .env.local.`
    );
  }

  console.log(`[Mailer] Sending ${label} to ${to} via Gmail SMTP (${user})...`);
  const transporter = getTransporter();
  const mailOptions = {
    from: `"Novix Messenger" <${user}>`,
    to,
    subject,
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[Mailer] ${label} sent successfully via Gmail SMTP. MessageId: ${info.messageId}`);
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

export function adminNotificationEmailHtml(
  title: string,
  badgeText: string,
  message: string,
  metadataItems: { label: string; value: string }[]
) {
  const metadataRows = metadataItems
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 0;color:#8E9CAE;font-size:13px;width:140px;font-weight:600;">${item.label}</td>
        <td style="padding:8px 0;color:#FFFFFF;font-size:13px;font-weight:700;">${item.value}</td>
      </tr>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#0A0F1D;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0F1D;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#131B2E;border-radius:18px;border:1px solid #1E293B;overflow:hidden;max-width:520px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#2563EB,#4F46E5);padding:28px 36px;text-align:left;">
              <span style="display:inline-block;padding:4px 10px;background:rgba(255,255,255,0.2);border-radius:20px;color:#FFFFFF;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">
                ${badgeText}
              </span>
              <h1 style="margin:0;font-size:22px;font-weight:800;color:#FFFFFF;letter-spacing:-0.4px;">${title}</h1>
              <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.85);">Novix Messenger Admin Console Alert</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 36px;">
              <p style="margin:0 0 20px;font-size:15px;color:#CBD5E1;line-height:1.6;">${message}</p>
              
              ${metadataItems.length > 0
      ? `
              <div style="background:#0F172A;border:1px solid #1E293B;border-radius:12px;padding:18px 22px;margin:20px 0;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  ${metadataRows}
                </table>
              </div>`
      : ''
    }

              <div style="text-align:center;margin-top:28px;">
                <a href="${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000'}/admin" style="display:inline-block;background:#2563EB;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 28px;border-radius:10px;">
                  Open Admin Console &rarr;
                </a>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 36px;background:#0B1120;border-top:1px solid #1E293B;text-align:center;">
              <p style="margin:0;font-size:11px;color:#64748B;">You received this email because this address is configured in Novix Messenger Admin Settings.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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
  await sendMail(
    to,
    `[Novix Admin] ${subject}`,
    adminNotificationEmailHtml(title, badgeText, message, metadataItems),
    'AdminNotification'
  );
}
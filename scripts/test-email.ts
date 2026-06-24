import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env configuration
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const GMAIL_USER = process.env.GMAIL_USER || '';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || '';

console.log('Using GMAIL_USER:', GMAIL_USER);
console.log('Using GMAIL_APP_PASSWORD length:', GMAIL_APP_PASSWORD.length);

async function testMail() {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.error('Error: GMAIL_USER or GMAIL_APP_PASSWORD is not set in .env');
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
  });

  try {
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: `"Novix Messenger Test" <${GMAIL_USER}>`,
      to: GMAIL_USER, // Send to self
      subject: 'Novix Mailer Test Output',
      text: 'If you receive this, the email verification system configurations are working correctly!',
      html: `
        <div style="background:#0E1621;color:#fff;padding:24px;font-family:sans-serif;text-align:center;">
          <h2>Novix Verification Mailer Test</h2>
          <p>If you receive this, the email verification system configurations are working correctly!</p>
        </div>
      `,
    });
    console.log('Email sent successfully! Message ID:', info.messageId);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}

testMail();

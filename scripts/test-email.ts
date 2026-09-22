import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

import { sendVerificationEmail, sendWelcomeEmail } from '../src/lib/mailer';

async function test() {
  const testRecipient = process.argv[3] || process.env.GMAIL_USER || 'test@example.com';
  const mode = (process.argv[2] || 'otp').toLowerCase();

  console.log(`Sending test email (${mode}) to ${testRecipient}...`);
  try {
    if (mode === 'welcome') {
      await sendWelcomeEmail(testRecipient, 'Novix User');
      console.log('✅ Test welcome email sent successfully!');
    } else if (mode === 'all') {
      await sendVerificationEmail(testRecipient, '123456');
      console.log('✅ Test OTP verification email sent successfully!');
      await sendWelcomeEmail(testRecipient, 'Novix User');
      console.log('✅ Test welcome email sent successfully!');
    } else {
      await sendVerificationEmail(testRecipient, '123456');
      console.log('✅ Test OTP email sent successfully!');
    }
  } catch (err: any) {
    console.error('❌ Failed to send test email:', err.message || err);
  } finally {
    process.exit(0);
  }
}

test();

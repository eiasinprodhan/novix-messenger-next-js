import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

import { sendVerificationEmail } from '../src/lib/mailer';

async function test() {
  const testRecipient = process.env.GMAIL_USER || 'test@example.com';
  console.log(`Sending test email to ${testRecipient}...`);
  try {
    await sendVerificationEmail(testRecipient, '123456');
    console.log('✅ Test email sent successfully!');
  } catch (err: any) {
    console.error('❌ Failed to send test email:', err.message || err);
  } finally {
    process.exit(0);
  }
}

test();

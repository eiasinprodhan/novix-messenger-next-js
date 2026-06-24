import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env configuration
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function testMail() {
  // Dynamically import mailer after env config is loaded
  const { sendVerificationEmail } = await import('../lib/mailer');
  const targetEmail = 'cyberloomittechnologies@gmail.com';
  console.log('Sending test verification code to:', targetEmail);

  try {
    await sendVerificationEmail(targetEmail, '123456');
    console.log('Test function execution finished.');
  } catch (error) {
    console.error('Failed to run test function:', error);
  }
}

testMail();

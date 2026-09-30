import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
function initFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Handle newlines in the private key string from env variables
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('⚠️ Firebase Admin SDK: Missing environment variables. Push notifications will not work.');
    return null;
  }

  try {
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } catch (error) {
    console.error('❌ Firebase Admin SDK Initialization Error:', error);
    return null;
  }
}

export const firebaseAdmin = initFirebaseAdmin();
export const messaging = firebaseAdmin ? admin.messaging() : null;

/**
 * Cleanly formats notification preview body, stripping internal metadata tags
 * like `<!--MARKETPLACE_PRODUCT:...-->` and providing human-friendly previews
 * for all message types (photos, audio, videos, documents, polls, etc.).
 */
export function formatNotificationPreview(
  content: string = '',
  type: string = 'text',
  isEncrypted: boolean = false
): string {
  if (isEncrypted) return '🔒 Encrypted message';

  const raw = content || '';

  // 1. Marketplace Product Inquiry: strip metadata tag and format cleanly
  if (raw.includes('<!--MARKETPLACE_PRODUCT:')) {
    let clean = raw.replace(/<!--MARKETPLACE_PRODUCT:[\s\S]*?-->\s*/g, '').trim();
    clean = clean.replace(/:\s*\r?\n+/, ': ');
    clean = clean.replace(/\r?\n+/g, ' · ');
    clean = clean.replace(/<!--[\s\S]*?-->/g, '').trim();
    return clean || '📦 Marketplace Inquiry';
  }

  // 2. Format based on type
  switch (type) {
    case 'image':
      return raw && !raw.startsWith('http') && !raw.includes('/') ? `📷 ${raw}` : '📷 Photo';
    case 'audio':
    case 'voice':
      return '🎤 Voice message';
    case 'video':
      return '🎥 Video';
    case 'document':
    case 'file':
      return raw && !raw.startsWith('http') && !raw.includes('/') ? `📄 ${raw}` : '📄 Document';
    case 'poll':
      return raw ? `📊 ${raw}` : '📊 Poll';
    case 'checklist':
      return raw ? `📝 ${raw}` : '📝 Checklist';
    case 'location':
      return '📍 Location';
    case 'contact':
      return '👤 Contact';
    case 'call':
    case 'missed_call':
      return '📞 Call';
    default: {
      const clean = raw.replace(/<!--[\s\S]*?-->/g, '').replace(/\r?\n+/g, ' ').trim();
      return clean || 'Sent a message';
    }
  }
}


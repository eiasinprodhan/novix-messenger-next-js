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

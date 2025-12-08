import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);

// Auth'u başlat
export const auth = getAuth(app);

// Firestore'u başlat
export const db = getFirestore(app);

// ✅ EKSTRA: Auth dil ayarı (opsiyonel, Türkçe hatalar için)
auth.languageCode = 'tr';

// ✅ Debug için
console.log('🔥 Firebase initialized');
console.log('🔥 Auth domain:', firebaseConfig.authDomain);

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyAumcd0vkm9-73yx8AGfT6SB2NgWMu_76Q',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'burako-leaderboard.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'burako-leaderboard',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'burako-leaderboard.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '928347273041',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:928347273041:web:31513f64e5a40b67300570',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export const ensureAuth = async () => {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
};

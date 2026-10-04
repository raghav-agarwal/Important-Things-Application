import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// These come from your existing Firebase project's config
// (Firebase Console -> Project settings -> General -> Your apps -> SDK setup).
// Fill them in via a .env.local file (see .env.example) so secrets aren't
// committed to source control.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId
);

const app = getApps().length
  ? getApps()[0]
  : initializeApp(
      isFirebaseConfigured
        ? firebaseConfig
        : { apiKey: "missing", projectId: "missing" }
    );

export const db = getFirestore(app);

import { type FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export function firebaseConfig() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!apiKey || !appId || !projectId) return null;
  return {
    apiKey,
    appId,
    projectId,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  };
}

function app(): FirebaseApp | null {
  const config = firebaseConfig();
  if (!config) return null;
  return getApps().length ? getApp() : initializeApp(config);
}

export function firebaseServices() {
  const firebaseApp = app();
  if (!firebaseApp) return null;
  return { auth: getAuth(firebaseApp), db: getFirestore(firebaseApp) };
}

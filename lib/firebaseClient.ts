import { type FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const webApp = {
  apiKey: "AIzaSyDnaYLtqK9bPp-Mb_h4YSjrp5qHe4afT00",
  authDomain: "nexusplayzone-7324d.firebaseapp.com",
  projectId: "nexusplayzone-7324d",
  storageBucket: "nexusplayzone-7324d.firebasestorage.app",
  messagingSenderId: "302063507170",
  appId: "1:302063507170:web:9d85523e3b3f813f02f0bb",
};

export function firebaseConfig() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || webApp.apiKey;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || webApp.appId;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || webApp.projectId;
  if (!apiKey || !appId || !projectId) return null;
  return {
    apiKey,
    appId,
    projectId,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || webApp.authDomain,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || webApp.storageBucket,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || webApp.messagingSenderId,
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

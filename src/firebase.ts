// src/firebase.ts  (HÅLL DEN SÅHÄR)
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDoErpJzQnkaEtt8Gxy59emPlJBFft5O08",
  authDomain: "firegem-b6f22.firebaseapp.com",
  projectId: "firegem-b6f22",
  storageBucket: "firegem-b6f22.firebasestorage.app",
  messagingSenderId: "461582898924",
  appId: "1:461582898924:web:74b28b3063xxxxxx"
};

export const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const APP_ID = "firegem-b6f22";
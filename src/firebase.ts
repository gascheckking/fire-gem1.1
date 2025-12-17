// src/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Din Firebase web-config (från bilden du skickade)
const firebaseConfig = {
  apiKey: "AIzaSyDoErpJzQnkaEtt8Gxy59emPlJBFft5O08",
  authDomain: "firegem-b6f22.firebaseapp.com",
  projectId: "firegem-b6f22",
  storageBucket: "firegem-b6f22.firebasestorage.app",
  messagingSenderId: "461582898924",
  appId: "1:461582898924:web:74b28b3063xxxxxx",
};

// Viktigt: init bara en gång
export const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Exportera exakt det App.tsx importerar
export const auth = getAuth(app);
export const db = getFirestore(app);

// Valfri “namespace” för dina collections
export const APP_ID = "firegem-b6f22";
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDoErpJzQnkaEtt8Gxy59emPlJBFft5O08",
  authDomain: "firegem-b6f22.firebaseapp.com",
  projectId: "firegem-b6f22",
  storageBucket: "firegem-b6f22.firebasestorage.app",
  messagingSenderId: "461582898924",
  appId: "1:461582898924:web:166ec1e5aec048d17db7c9",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// används i App.tsx
export const APP_ID = firebaseConfig.projectId;
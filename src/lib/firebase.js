import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Firebase config is intentionally public (client-side SDK). These are not secret credentials.
const firebaseConfig = {
  apiKey: "AIzaSyCsRs1BTT1NphOpbkoAwKn7rnrdQk16R2I",
  authDomain: "jinan-6c884.firebaseapp.com",
  databaseURL: "https://jinan-6c884-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "jinan-6c884",
  storageBucket: "jinan-6c884.firebasestorage.app",
  messagingSenderId: "956378670080",
  appId: "1:956378670080:web:2147d0766564dd00dde4e5"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB9Oe-815QvgQ18T98k1HyUt_UG_q6gXE4",
  authDomain: "sms-grocery-shop.firebaseapp.com",
  projectId: "sms-grocery-shop",
  storageBucket: "sms-grocery-shop.firebasestorage.app",
  messagingSenderId: "123600906132",
  appId: "1:123600906132:web:1cd5ff085797d2ddb91181",
  measurementId: "G-R746QLBE0X"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// Simple singleton state to persist confirmationResult across login and OTP verification pages
let savedConfirmationResult: any = null;

export const setConfirmationResult = (result: any) => {
  savedConfirmationResult = result;
};

export const getConfirmationResult = () => {
  return savedConfirmationResult;
};

export { app, auth, db };

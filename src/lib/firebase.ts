import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCEIMt1MANtgOfao3vGpGQ32B8ASGearuo",
  authDomain: "sms-grocery-shop-79ef1.firebaseapp.com",
  projectId: "sms-grocery-shop-79ef1",
  storageBucket: "sms-grocery-shop-79ef1.firebasestorage.app",
  messagingSenderId: "283851129301",
  appId: "1:283851129301:web:f86a7551707baa9736fd5c",
  measurementId: "G-ZQJXKWN5DX"
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

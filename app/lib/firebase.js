import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDqNly5CSJciwszR5lYJlv3RX9HVfcMhvw",
  authDomain: "hife-36fbe.firebaseapp.com",
  projectId: "hife-36fbe",
  storageBucket: "hife-36fbe.firebasestorage.app",
  messagingSenderId: "735584930256",
  appId: "1:735584930256:web:8368079284ad6ae70ed1d5",
  measurementId: "G-EPBKEQQQ5R"
};
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

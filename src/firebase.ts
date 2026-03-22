import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCfIW4EBao2PdM9FM-ufvp1X8_f3ADpCbE",
  authDomain: "triage-ai-9a489.firebaseapp.com",
  projectId: "triage-ai-9a489",
  storageBucket: "triage-ai-9a489.firebasestorage.app",
  messagingSenderId: "805532623543",
  appId: "1:805532623543:web:c0e5d6db6c032003eb2332",
  measurementId: "G-PXBS4ZE155"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
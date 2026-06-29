import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAuYJwu8VrnIuRBff0h7bR8Dh_Zn6dN3ts",
  authDomain: "bet-mali-africa.firebaseapp.com",
  databaseURL: "https://bet-mali-africa-default-rtdb.firebaseio.com",
  projectId: "bet-mali-africa",
  storageBucket: "bet-mali-africa.firebasestorage.app",
  messagingSenderId: "185796707973",
  appId: "1:185796707973:web:1cf6fce41d5f3b0e4d0bec",
  measurementId: "G-FV1KR4KBHE",
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const googleProvider = new GoogleAuthProvider();

isSupported().then((yes) => {
  if (yes) getAnalytics(firebaseApp);
});

export function phoneToEmail(phone: string): string {
  return phone.replace(/\D/g, "") + "@betmali.app";
}

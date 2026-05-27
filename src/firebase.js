import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCM8gy64WwmVMwRjp2SllqHzlcUAiwsVv4",
  authDomain: "contentai-7b9c3.firebaseapp.com",
  projectId: "contentai-7b9c3",
  storageBucket: "contentai-7b9c3.firebasestorage.app",
  messagingSenderId: "370309289902",
  appId: "1:370309289902:web:c1ed5251ce7495e1841a3f",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

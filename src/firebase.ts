import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAjfGTAtsnkJizayI8Ee9AWm8T0Su01WM0",
  authDomain: "kiflow-2810.firebaseapp.com",
  projectId: "kiflow-2810",
  storageBucket: "kiflow-2810.firebasestorage.app",
  messagingSenderId: "254899026253",
  appId: "1:254899026253:web:588aaee2018e1f17eb5f04",
  measurementId: "G-D8NKY3TX1C"
};

let analytics: ReturnType<typeof getAnalytics> | null = null;

if (typeof window !== "undefined") {
  const app = initializeApp(firebaseConfig);
  // analytics = getAnalytics(app);
}

export { analytics };

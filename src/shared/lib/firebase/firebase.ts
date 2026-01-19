import { initializeApp } from 'firebase/app';
import { getAnalytics, Analytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: 'AIzaSyAjfGTAtsnkJizayI8Ee9AWm8T0Su01WM0',
  authDomain: 'kiflow-2810.firebaseapp.com',
  projectId: 'kiflow-2810',
  storageBucket: 'kiflow-2810.firebasestorage.app',
  messagingSenderId: '254899026253',
  appId: '1:254899026253:web:588aaee2018e1f17eb5f04',
  measurementId: 'G-D8NKY3TX1C',
};

let analytics: Analytics | null = null;

/**
 * Initialize Firebase analytics (only in browser environment)
 */
export const initFirebase = (): Analytics | null => {
  if (typeof window !== 'undefined' && !analytics) {
    const app = initializeApp(firebaseConfig);
    analytics = getAnalytics(app);
  }
  return analytics;
};

/**
 * Get the Firebase analytics instance
 */
export const getFirebaseAnalytics = (): Analytics | null => {
  if (typeof window !== 'undefined' && !analytics) {
    return initFirebase();
  }
  return analytics;
};

// Auto-initialize on import in browser
if (typeof window !== 'undefined') {
  initFirebase();
}

export { analytics };

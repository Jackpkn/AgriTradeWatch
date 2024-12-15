// firebase.js
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
 import {getStorage} from 'firebase/storage';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Add additional services if needed
import { getFirestore } from 'firebase/firestore';

  const firebaseConfig = {
    apiKey: "AIzaSyAKMDXrtdbTQxn2yhJVY9M9HTAuX1sWGe4",
    authDomain: "agritradewatch-ea2dc.firebaseapp.com",
    projectId: "agritradewatch-ea2dc",
    storageBucket: "agritradewatch-ea2dc.firebasestorage.app",
    messagingSenderId: "809126175103",
    appId: "1:809126175103:android:d50742b8da0df189713a4a",
  };


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services as needed
const db = getFirestore(app);
const storage = getStorage(app);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export { auth, db, storage };

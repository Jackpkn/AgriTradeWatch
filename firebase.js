import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getStorage } from "firebase/storage";
import {
  getFirestore,
  initializeFirestore,
  CACHE_SIZE_UNLIMITED,
} from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyAKMDXrtdbTQxn2yhJVY9M9HTAuX1sWGe4",
  authDomain: "agritradewatch-ea2dc.firebaseapp.com",
  projectId: "agritradewatch-ea2dc",
  storageBucket: "agritradewatch-ea2dc.firebasestorage.app",
  messagingSenderId: "809126175103",
  appId: "1:809126175103:android:d50742b8da0df189713a4a",
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED,
});

const storage = getStorage(app);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export { auth, db, storage };

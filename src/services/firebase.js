import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: "AIzaSyA0IZkfBdo55YkuSmC_YLFlvdExgTX8ysg",
  authDomain: "myparking-1ce33.firebaseapp.com",
  projectId: "myparking-1ce33",
  storageBucket: "myparking-1ce33.appspot.com",
  messagingSenderId: "1062456240878",
  appId: "1:1062456240878:android:52cf7f0f8dbf8c4f7fa1ff"
};

// Initialize Firebase (only if it hasn't been initialized yet)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with AsyncStorage persistence
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (error) {
  // If auth is already initialized, just get the existing instance
  console.log('Auth already initialized, using existing instance');
  auth = getAuth(app);
}

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Storage
export const storage = getStorage(app);

export { auth };

export const saveUserData = async (uid, userData) => {
  try {
    await setDoc(doc(db, 'users', uid), {
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving user data:', error);
    throw error;
  }
};

export default app; 
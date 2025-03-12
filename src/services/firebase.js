import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyA0IZkfBdo55YkuSmC_YLFlvdExgTX8ysg",
  authDomain: "myparking-1ce33.firebaseapp.com",
  projectId: "myparking-1ce33",
  storageBucket: "myparking-1ce33.appspot.com",
  messagingSenderId: "1062456240878",
  appId: "1:1062456240878:android:52cf7f0f8dbf8c4f7fa1ff"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);

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
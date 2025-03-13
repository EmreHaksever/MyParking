import { collection, addDoc, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from './firebase';

const PARKING_COLLECTION = 'parkingLocations';

export const saveParkingLocation = async (location, description, isPaid, freeMinutes = 0) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const parkingData = {
      userId,
      latitude: location.latitude,
      longitude: location.longitude,
      description,
      isPaid,
      freeMinutes: isPaid ? freeMinutes : 0,
      createdAt: Date.now()
    };

    const docRef = await addDoc(collection(db, PARKING_COLLECTION), parkingData);
    console.log('Parking location saved successfully:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error saving parking location:', error);
    throw error;
  }
};

export const getUserParkingLocations = async () => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    console.log('Fetching parking locations for user:', userId);

    const parkingQuery = query(
      collection(db, PARKING_COLLECTION),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(parkingQuery);
    const locations = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log('Found parking locations:', locations.length);
    return locations;
  } catch (error) {
    console.error('Error getting parking locations:', error);
    throw error;
  }
};

export const deleteParkingLocation = async (locationId) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    console.log('Deleting parking location:', locationId);
    await deleteDoc(doc(db, PARKING_COLLECTION, locationId));
    console.log('Parking location deleted successfully');
  } catch (error) {
    console.error('Error deleting parking location:', error);
    throw error;
  }
}; 
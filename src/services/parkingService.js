import { collection, addDoc, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from './firebase';

const PARKING_COLLECTION = 'parking_locations';

export const saveParkingLocation = async (location, description) => {
  try {
    const docRef = await addDoc(collection(db, PARKING_COLLECTION), {
      userId: auth.currentUser.uid,
      latitude: location.latitude,
      longitude: location.longitude,
      description,
      timestamp: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving parking location:', error);
    throw error;
  }
};

export const getUserParkingLocations = async () => {
  try {
    const q = query(
      collection(db, PARKING_COLLECTION),
      where('userId', '==', auth.currentUser.uid)
    );
    
    const querySnapshot = await getDocs(q);
    const locations = [];
    
    querySnapshot.forEach((doc) => {
      locations.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return locations;
  } catch (error) {
    console.error('Error getting parking locations:', error);
    throw error;
  }
};

export const deleteParkingLocation = async (locationId) => {
  try {
    await deleteDoc(doc(db, PARKING_COLLECTION, locationId));
  } catch (error) {
    console.error('Error deleting parking location:', error);
    throw error;
  }
}; 
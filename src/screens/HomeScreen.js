import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { saveParkingLocation, getUserParkingLocations } from '../services/parkingService';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import CustomButton from '../components/CustomButton';
import CustomInput from '../components/CustomInput';

export default function HomeScreen({ navigation }) {
  const mapRef = useRef(null);
  const [location, setLocation] = useState(null);
  const [parkingLocations, setParkingLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [description, setDescription] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission denied', 'Location permission is required.');
          return;
        }

        let currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation.coords);

        const savedLocations = await getUserParkingLocations();
        setParkingLocations(savedLocations);
      } catch (error) {
        Alert.alert('Error', 'Failed to load location data');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleMapPress = (event) => {
    setSelectedLocation(event.nativeEvent.coordinate);
  };

  const handleAddLocation = () => {
    if (selectedLocation) {
      setShowModal(true);
    } else {
      Alert.alert('Select Location', 'Please select a location on the map first');
    }
  };

  const handleSaveLocation = async () => {
    if (!selectedLocation || !description) {
      Alert.alert('Error', 'Please provide a description for the location');
      return;
    }

    try {
      await saveParkingLocation(selectedLocation, description);
      const updatedLocations = await getUserParkingLocations();
      setParkingLocations(updatedLocations);
      setShowModal(false);
      setDescription('');
      setSelectedLocation(null);
      Alert.alert('Success', 'Parking location saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save parking location');
    }
  };

  const centerToCurrentLocation = async () => {
    try {
      let currentLocation = await Location.getCurrentPositionAsync({});
      mapRef.current?.animateToRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    } catch (error) {
      Alert.alert('Error', 'Failed to get current location');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>MyParking</Text>
      </View>

      {location && (
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            onPress={handleMapPress}
            showsUserLocation={true}
            showsMyLocationButton={false}
          >
            {/* Saved parking locations */}
            {parkingLocations.map((parking) => (
              <Marker
                key={parking.id}
                coordinate={{
                  latitude: parking.latitude,
                  longitude: parking.longitude,
                }}
                title={parking.description}
                description="Saved Parking Location"
              />
            ))}

            {/* Selected location marker */}
            {selectedLocation && (
              <Marker
                coordinate={selectedLocation}
                title="Selected Location"
                description="New parking location"
              />
            )}
          </MapView>

          {/* Map Controls */}
          <View style={styles.mapControls}>
            <TouchableOpacity 
              style={styles.mapButton}
              onPress={centerToCurrentLocation}
            >
              <Ionicons name="locate" size={24} color={COLORS.primary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.mapButton}
              onPress={handleAddLocation}
            >
              <Ionicons name="add-circle" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Save Parking Location</Text>
            
            <CustomInput
              value={description}
              onChangeText={setDescription}
              placeholder="Enter location description"
              style={styles.input}
            />

            <View style={styles.modalButtons}>
              <CustomButton
                title="Save"
                onPress={handleSaveLocation}
                style={styles.saveButton}
              />
              <CustomButton
                title="Cancel"
                onPress={() => {
                  setShowModal(false);
                  setDescription('');
                }}
                variant="secondary"
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.medium,
    backgroundColor: COLORS.white,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  title: {
    fontSize: FONTS.sizes.subtitle,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapControls: {
    position: 'absolute',
    right: SPACING.medium,
    bottom: SPACING.xlarge,
    gap: SPACING.small,
  },
  mapButton: {
    backgroundColor: COLORS.white,
    padding: SPACING.medium,
    borderRadius: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    padding: SPACING.xlarge,
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: FONTS.sizes.subtitle,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text.primary,
    marginBottom: SPACING.large,
    textAlign: 'center',
  },
  modalButtons: {
    marginTop: SPACING.large,
  },
  saveButton: {
    marginBottom: SPACING.small,
  },
}); 
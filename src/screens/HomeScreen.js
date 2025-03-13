import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  Alert,
  Modal,
  ActivityIndicator,
  TouchableOpacity,
  Platform
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { saveParkingLocation, getUserParkingLocations } from '../services/parkingService';
import { scheduleParkingNotification } from '../services/notificationService';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import CustomButton from '../components/CustomButton';
import CustomInput from '../components/CustomInput';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

export default function HomeScreen({ navigation }) {
  const mapRef = useRef(null);
  const [location, setLocation] = useState(null);
  const [parkingLocations, setParkingLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [description, setDescription] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [freeMinutes, setFreeMinutes] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [region, setRegion] = useState(null);
  const { isDarkMode } = useTheme();

  const loadLocations = async () => {
    try {
      const savedLocations = await getUserParkingLocations();
      setParkingLocations(savedLocations);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        
        // Önce varsayılan bir konum ayarlayalım (İstanbul merkez)
        const defaultRegion = {
          latitude: 41.0082,
          longitude: 28.9784,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        setRegion(defaultRegion);
        setSelectedLocation(defaultRegion);

        // Konum izinlerini kontrol edelim
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Konum İzni',
            'Haritada konumunuzu göstermek için izin gerekli. Harita yine de çalışacak ama konumunuz gösterilmeyecek.',
            [{ text: 'Tamam' }]
          );
          await loadLocations();
          setIsLoading(false);
          return;
        }

        try {
          // Mevcut konumu almaya çalışalım
          const locationOptions = {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000,
            distanceInterval: 0,
            mayShowUserSettingsDialog: false // Android için önemli
          };

          const currentLocation = await Location.getCurrentPositionAsync(locationOptions)
            .catch(async () => {
              // Yüksek hassasiyetli konum alınamadıysa, düşük hassasiyetli deneyelim
              console.log('Retrying with low accuracy...');
              return await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Low,
                timeInterval: 10000
              });
            });

          if (currentLocation) {
            const initialRegion = {
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            };
            setLocation(currentLocation.coords);
            setRegion(initialRegion);
            setSelectedLocation(initialRegion);
          }
        } catch (locationError) {
          console.warn('Location fetch failed:', locationError);
          // Konum alınamasa bile harita varsayılan konumla çalışmaya devam edecek
        }

        // Park yerlerini yükleyelim
        await loadLocations();
      } catch (error) {
        console.error('Map loading error:', error);
        Alert.alert(
          'Harita Yükleme Hatası',
          'Harita yüklenirken bir sorun oluştu. Lütfen internet bağlantınızı kontrol edin.',
          [{ text: 'Tamam' }]
        );
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Her ekran odaklandığında konumları güncelle
  useFocusEffect(
    React.useCallback(() => {
      loadLocations();
    }, [])
  );

  const handleRegionChange = (newRegion) => {
    setRegion(newRegion);
    setSelectedLocation({
      latitude: newRegion.latitude,
      longitude: newRegion.longitude,
    });
  };

  const handleAddLocation = () => {
    if (selectedLocation) {
      setShowModal(true);
    }
  };

  const handleSaveLocation = async () => {
    if (!selectedLocation || !description) {
      Alert.alert('Hata', 'Lütfen konum için bir açıklama girin');
      return;
    }

    if (isPaid && !freeMinutes) {
      Alert.alert('Hata', 'Lütfen ücretsiz dakika süresini girin');
      return;
    }

    const minutes = parseInt(freeMinutes);

    if (isPaid && minutes <= 5) {
      Alert.alert('Hata', 'Ücretsiz süre en az 6 dakika olmalıdır');
      return;
    }

    try {
      const locationId = await saveParkingLocation(selectedLocation, description, isPaid, minutes);
      
      // Ücretli park yeri için bildirim planla
      if (isPaid && minutes > 5) {
        await scheduleParkingNotification(locationId, description, minutes);
      }

      const updatedLocations = await getUserParkingLocations();
      setParkingLocations(updatedLocations);
      setShowModal(false);
      setDescription('');
      setIsPaid(false);
      setFreeMinutes('');
      Alert.alert('Başarılı', 'Park yeri başarıyla kaydedildi!');
    } catch (error) {
      Alert.alert('Hata', 'Park yeri kaydedilirken bir hata oluştu');
    }
  };

  const centerToCurrentLocation = async () => {
    try {
      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        maxAge: 10000,
        timeout: 5000
      });
      const newRegion = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      mapRef.current?.animateToRegion(newRegion, 1000);
      setLocation(currentLocation.coords);
      setSelectedLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to get current location');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, isDarkMode && styles.darkContainer]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
      <View style={[styles.header, isDarkMode && styles.darkHeader]}>
        <Text style={[styles.title, isDarkMode && styles.darkText]}>Park Yerim</Text>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={Platform.select({
            ios: undefined, // iOS'ta Apple Maps kullan
            android: PROVIDER_GOOGLE // Android'de Google Maps kullan
          })}
          initialRegion={region}
          onRegionChange={handleRegionChange}
          customMapStyle={isDarkMode ? darkMapStyle : []}
        >
          {location && (
            <Marker
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              title="Konumunuz"
            >
              <View style={[styles.markerContainer, isDarkMode && styles.darkMarkerContainer]}>
                <Ionicons name="car" size={30} color={COLORS.primary} />
              </View>
            </Marker>
          )}

          {parkingLocations.map((parking) => (
            <Marker
              key={parking.id}
              coordinate={{
                latitude: parking.latitude,
                longitude: parking.longitude,
              }}
              title={parking.description}
              description="Kayıtlı Park Yeri"
            >
              <View style={[styles.markerContainer, isDarkMode && styles.darkMarkerContainer]}>
                <Ionicons name="car" size={30} color={COLORS.error} />
              </View>
            </Marker>
          ))}
        </MapView>

        {/* Center marker overlay */}
        <View style={styles.markerFixed}>
          <Ionicons name="car" size={40} color={COLORS.primary} />
        </View>

        {/* Map Controls */}
        <View style={styles.mapControls}>
          <TouchableOpacity 
            style={[styles.mapButton, isDarkMode && styles.darkMapButton]}
            onPress={centerToCurrentLocation}
          >
            <Ionicons name="locate" size={24} color={isDarkMode ? COLORS.white : COLORS.primary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.mapButton, isDarkMode && styles.darkMapButton]}
            onPress={handleAddLocation}
          >
            <Ionicons name="add-circle" size={24} color={isDarkMode ? COLORS.white : COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, isDarkMode && styles.darkModalContent]}>
            <Text style={[styles.modalTitle, isDarkMode && styles.darkText]}>
              Park Yeri Kaydet
            </Text>
            
            <CustomInput
              value={description}
              onChangeText={setDescription}
              placeholder="Konum açıklaması girin"
              style={styles.input}
            />

            <View style={styles.parkingTypeContainer}>
              <Text style={[styles.label, isDarkMode && styles.darkText]}>Park Tipi:</Text>
              <View style={styles.radioContainer}>
                <TouchableOpacity 
                  style={styles.radioButton} 
                  onPress={() => {
                    setIsPaid(false);
                    setFreeMinutes('');
                  }}
                >
                  <View style={[styles.radio, !isPaid && styles.radioSelected]} />
                  <Text style={[styles.radioText, isDarkMode && styles.darkText]}>Ücretsiz</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.radioButton} 
                  onPress={() => setIsPaid(true)}
                >
                  <View style={[styles.radio, isPaid && styles.radioSelected]} />
                  <Text style={[styles.radioText, isDarkMode && styles.darkText]}>Ücretli</Text>
                </TouchableOpacity>
              </View>
            </View>

            {isPaid && (
              <View style={styles.freeMinutesContainer}>
                <Text style={[styles.label, isDarkMode && styles.darkText]}>Ücretsiz Dakika:</Text>
                <CustomInput
                  value={freeMinutes}
                  onChangeText={setFreeMinutes}
                  placeholder="Ücretsiz dakika girin"
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
            )}

            <View style={styles.modalButtons}>
              <CustomButton
                title="Kaydet"
                onPress={handleSaveLocation}
                style={styles.saveButton}
              />
              <CustomButton
                title="İptal"
                onPress={() => {
                  setShowModal(false);
                  setDescription('');
                  setIsPaid(false);
                  setFreeMinutes('');
                }}
                type="secondary"
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const darkMapStyle = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#242f3e' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#746855' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#242f3e' }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#263c3f' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b9a76' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#38414e' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212a37' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca5b3' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#746855' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f2835' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f3d19c' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#2f3948' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#17263c' }],
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  darkContainer: {
    backgroundColor: '#1a1a1a',
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
  darkHeader: {
    backgroundColor: '#2a2a2a',
  },
  title: {
    fontSize: FONTS.sizes.subtitle,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
  },
  darkText: {
    color: COLORS.white,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  markerFixed: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -20,
    marginTop: -40,
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
  darkMapButton: {
    backgroundColor: '#2a2a2a',
  },
  markerContainer: {
    padding: 5,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  darkMarkerContainer: {
    backgroundColor: 'rgba(42, 42, 42, 0.8)',
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
  darkModalContent: {
    backgroundColor: '#2a2a2a',
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
  parkingTypeContainer: {
    marginBottom: SPACING.medium,
  },
  label: {
    fontSize: FONTS.sizes.regular,
    color: COLORS.text.primary,
    marginBottom: SPACING.small,
  },
  radioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.small,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginRight: SPACING.small,
  },
  radioSelected: {
    backgroundColor: COLORS.primary,
  },
  radioText: {
    fontSize: FONTS.sizes.regular,
    color: COLORS.text.primary,
  },
  freeMinutesContainer: {
    marginBottom: SPACING.medium,
  },
}); 
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
  Platform,
  Linking
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

      {/* Arama Çubuğu */}
      <View style={[styles.searchContainer, isDarkMode && styles.darkSearchContainer]}>
        <Ionicons name="search" size={20} color={isDarkMode ? COLORS.white : COLORS.text.secondary} />
        <TouchableOpacity 
          style={styles.searchInput}
          onPress={() => Alert.alert('Bilgi', 'Arama özelliği yakında eklenecek!')}
        >
          <Text style={[styles.searchPlaceholder, isDarkMode && styles.darkSecondaryText]}>
            Konum ara...
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filtre Butonları */}
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterButton, styles.filterButtonActive, isDarkMode && styles.darkFilterButtonActive]}
          onPress={() => Alert.alert('Bilgi', 'Tüm park yerleri gösteriliyor.')}
        >
          <Text style={[styles.filterText, styles.filterTextActive, isDarkMode && styles.darkText]}>Tümü</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, isDarkMode && styles.darkFilterButton]}
          onPress={() => Alert.alert('Bilgi', 'Ücretsiz park yerleri filtresi yakında eklenecek!')}
        >
          <Text style={[styles.filterText, isDarkMode && styles.darkSecondaryText]}>Ücretsiz</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, isDarkMode && styles.darkFilterButton]}
          onPress={() => Alert.alert('Bilgi', 'Ücretli park yerleri filtresi yakında eklenecek!')}
        >
          <Text style={[styles.filterText, isDarkMode && styles.darkSecondaryText]}>Ücretli</Text>
        </TouchableOpacity>
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

      {/* Bilgi Kartı */}
      {parkingLocations.length > 0 ? (
        <View style={[styles.infoCard, isDarkMode && styles.darkInfoCard]}>
          <View style={styles.infoCardHeader}>
            <Text style={[styles.infoCardTitle, isDarkMode && styles.darkText]}>
              Aktif Park Bilgisi
            </Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('SavedLocations')}
              style={styles.viewAllButton}
            >
              <Text style={styles.viewAllText}>Tümünü Gör</Text>
            </TouchableOpacity>
          </View>

          {parkingLocations.slice(0, 1).map(parking => {
            const calculateRemainingMinutes = (createdAt, freeMinutes) => {
              if (!freeMinutes) return 0;
              const currentTime = Date.now();
              const elapsedMinutes = Math.floor((currentTime - createdAt) / (1000 * 60));
              return Math.max(0, freeMinutes - elapsedMinutes);
            };

            const remainingMinutes = calculateRemainingMinutes(parking.createdAt, parking.freeMinutes);

            return (
              <View key={parking.id} style={styles.parkingInfoContainer}>
                <View style={styles.parkingInfoLeft}>
                  <View style={styles.parkingIconContainer}>
                    <Ionicons name="car" size={24} color={COLORS.white} />
                  </View>
                  <View style={styles.parkingDetails}>
                    <Text style={[styles.parkingDescription, isDarkMode && styles.darkText]} numberOfLines={1}>
                      {parking.description}
                    </Text>
                    <Text style={[styles.parkingType, isDarkMode && styles.darkSecondaryText]}>
                      {parking.isPaid ? 'Ücretli Park' : 'Ücretsiz Park'}
                    </Text>
                    {parking.isPaid && (
                      <Text style={[
                        styles.remainingTime, 
                        remainingMinutes === 0 ? styles.expiredTime : styles.activeTime
                      ]}>
                        {remainingMinutes > 0 
                          ? `${remainingMinutes} dakika kaldı`
                          : 'Süre doldu'}
                      </Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.navigateButton}
                  onPress={() => {
                    const scheme = Platform.select({
                      ios: 'maps:0,0?q=',
                      android: 'geo:0,0?q='
                    });
                    const latLng = `${parking.latitude},${parking.longitude}`;
                    const label = parking.description;
                    const url = Platform.select({
                      ios: `${scheme}${label}@${latLng}`,
                      android: `${scheme}${latLng}(${label})`
                    });
                    Linking.openURL(url);
                  }}
                >
                  <Ionicons name="navigate" size={24} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={[styles.infoCard, isDarkMode && styles.darkInfoCard]}>
          <Text style={[styles.emptyText, isDarkMode && styles.darkText]}>
            Henüz kayıtlı park yeriniz yok
          </Text>
          <Text style={[styles.emptySubText, isDarkMode && styles.darkSecondaryText]}>
            Park yerinizi kaydetmek için haritada bir konum seçin ve sağ alttaki + butonuna tıklayın
          </Text>
        </View>
      )}

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
  darkSecondaryText: {
    color: '#a0a0a0',
  },
  // Arama Çubuğu Stilleri
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginHorizontal: SPACING.medium,
    marginVertical: SPACING.small,
    paddingHorizontal: SPACING.medium,
    paddingVertical: SPACING.small,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  darkSearchContainer: {
    backgroundColor: '#2a2a2a',
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.small,
    height: 40,
    justifyContent: 'center',
  },
  searchPlaceholder: {
    color: COLORS.text.secondary,
    fontSize: FONTS.sizes.regular,
  },
  // Filtre Butonları Stilleri
  filterContainer: {
    flexDirection: 'row',
    marginHorizontal: SPACING.medium,
    marginBottom: SPACING.small,
  },
  filterButton: {
    paddingHorizontal: SPACING.medium,
    paddingVertical: SPACING.small,
    borderRadius: 20,
    marginRight: SPACING.small,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.shadow,
  },
  darkFilterButton: {
    backgroundColor: '#2a2a2a',
    borderColor: '#3a3a3a',
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  darkFilterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: FONTS.sizes.small,
    color: COLORS.text.secondary,
  },
  filterTextActive: {
    color: COLORS.white,
    fontWeight: FONTS.weights.semiBold,
  },
  // Harita Stilleri
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
  // Bilgi Kartı Stilleri
  infoCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: SPACING.large,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  darkInfoCard: {
    backgroundColor: '#2a2a2a',
  },
  infoCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.medium,
  },
  infoCardTitle: {
    fontSize: FONTS.sizes.regular,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text.primary,
  },
  viewAllButton: {
    padding: SPACING.small,
  },
  viewAllText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.small,
    fontWeight: FONTS.weights.medium,
  },
  parkingInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 12,
    padding: SPACING.medium,
  },
  parkingInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  parkingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.medium,
  },
  parkingDetails: {
    flex: 1,
  },
  parkingDescription: {
    fontSize: FONTS.sizes.regular,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  parkingType: {
    fontSize: FONTS.sizes.small,
    color: COLORS.text.secondary,
    marginBottom: 2,
  },
  remainingTime: {
    fontSize: FONTS.sizes.small,
    fontWeight: FONTS.weights.medium,
  },
  activeTime: {
    color: COLORS.primary,
  },
  expiredTime: {
    color: COLORS.error,
  },
  navigateButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONTS.sizes.regular,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SPACING.small,
  },
  emptySubText: {
    fontSize: FONTS.sizes.small,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  // Modal Stilleri
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
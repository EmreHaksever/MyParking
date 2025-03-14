import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  Switch, 
  TouchableOpacity, 
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback
} from 'react-native';
import { auth } from '../services/firebase';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import CustomButton from '../components/CustomButton';
import CustomInput from '../components/CustomInput';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { getUserParkingLocations } from '../services/parkingService';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useFocusEffect } from '@react-navigation/native';

export default function ProfileScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLocations: 0,
    freeLocations: 0,
    paidLocations: 0
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();

  useEffect(() => {
    loadUserData();
  }, []);

  // Ekran her odaklandığında sayaçları güncelle
  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      
      // Kullanıcı bilgilerini yükle
      const db = getFirestore();
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        setEditFirstName(data.firstName || '');
        setEditLastName(data.lastName || '');
      }
      
      // Kullanıcı istatistiklerini yükle
      const locations = await getUserParkingLocations();
      const freeLocations = locations.filter(loc => !loc.isPaid);
      const paidLocations = locations.filter(loc => loc.isPaid);
      
      setStats({
        totalLocations: locations.length,
        freeLocations: freeLocations.length,
        paidLocations: paidLocations.length
      });
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Çıkış Yap',
      'Hesabınızdan çıkış yapmak istediğinizden emin misiniz?',
      [
        {
          text: 'İptal',
          style: 'cancel'
        },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: async () => {
            try {
              await auth.signOut();
              navigation.replace('Login');
            } catch (error) {
              console.error(error);
              Alert.alert('Hata', 'Çıkış yapılırken bir sorun oluştu.');
            }
          }
        }
      ]
    );
  };

  const handleEditProfile = () => {
    setShowEditModal(true);
    // Eğer kullanıcının profil fotoğrafı varsa, seçili fotoğraf olarak ayarla
    if (userData?.photoURL) {
      setSelectedImage(userData.photoURL);
    } else {
      setSelectedImage(null);
    }
  };

  const handleSaveProfile = async () => {
    if (!editFirstName.trim() || !editLastName.trim()) {
      Alert.alert('Hata', 'Ad ve soyad alanları boş bırakılamaz.');
      return;
    }

    try {
      setIsSaving(true);
      const db = getFirestore();
      const userRef = doc(db, 'users', auth.currentUser.uid);
      
      const updatedData = {
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        displayName: `${editFirstName.trim()} ${editLastName.trim()}`,
        updatedAt: new Date().toISOString()
      };

      // Profil fotoğrafı zaten uploadImage fonksiyonunda kaydediliyor
      // Bu nedenle burada tekrar kaydetmeye gerek yok
      
      await updateDoc(userRef, updatedData);
      
      // Kullanıcı verilerini güncelle
      setUserData(prevData => ({
        ...prevData,
        ...updatedData
      }));
      
      setShowEditModal(false);
      Alert.alert('Başarılı', 'Profil bilgileriniz başarıyla güncellendi.');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Hata', 'Profil güncellenirken bir sorun oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePhoto = () => {
    console.log('handleChangePhoto called');
    
    Alert.alert(
      'Profil Fotoğrafı',
      'Profil fotoğrafınızı nasıl değiştirmek istersiniz?',
      [
        {
          text: 'Kamera',
          onPress: () => {
            console.log('Camera option selected');
            takePhoto();
          },
        },
        {
          text: 'Galeri',
          onPress: () => {
            console.log('Gallery option selected');
            pickImage();
          },
        },
        {
          text: 'İptal',
          style: 'cancel',
          onPress: () => console.log('Photo change canceled'),
        },
      ],
      { cancelable: true }
    );
  };

  const requestPermissions = async () => {
    console.log('Requesting permissions...');
    
    if (Platform.OS !== 'web') {
      try {
        console.log('Requesting camera permission...');
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        console.log('Camera permission status:', cameraStatus);
        
        console.log('Requesting media library permission...');
        const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        console.log('Media library permission status:', libraryStatus);
        
        if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
          console.log('Permission denied. Camera:', cameraStatus, 'Library:', libraryStatus);
          Alert.alert(
            'İzin Gerekli',
            'Fotoğraf seçmek veya çekmek için kamera ve galeri izinleri gereklidir. Lütfen uygulama ayarlarından izinleri etkinleştirin.',
            [
              { 
                text: 'Tamam',
                onPress: () => console.log('Permission alert closed')
              }
            ]
          );
          return false;
        }
        
        console.log('All permissions granted');
        return true;
      } catch (error) {
        console.error('Error requesting permissions:', error);
        Alert.alert('Hata', `İzinler istenirken bir sorun oluştu: ${error.message}`);
        return false;
      }
    }
    
    console.log('Platform is web, no permissions needed');
    return true;
  };

  const takePhoto = async () => {
    try {
      console.log('Taking photo...');
      const permissionResult = await requestPermissions();
      
      if (!permissionResult) {
        console.log('Camera permission denied');
        return;
      }
      
      setIsUploadingImage(true);
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      
      console.log('Camera result:', result);
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        console.log('Selected image URI:', imageUri);
        
        const uploadedImage = await uploadImage(imageUri);
        if (uploadedImage) {
          console.log('Photo uploaded successfully');
          setSelectedImage(uploadedImage);
        }
      } else {
        console.log('Camera capture canceled or failed');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Hata', 'Fotoğraf çekilirken bir sorun oluştu: ' + error.message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const pickImage = async () => {
    try {
      console.log('Picking image from library...');
      const permissionResult = await requestPermissions();
      
      if (!permissionResult) {
        console.log('Media library permission denied');
        return;
      }
      
      setIsUploadingImage(true);
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      
      console.log('Image picker result:', result);
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        console.log('Selected image URI:', imageUri);
        
        const uploadedImage = await uploadImage(imageUri);
        if (uploadedImage) {
          console.log('Photo uploaded successfully');
          setSelectedImage(uploadedImage);
        }
      } else {
        console.log('Image selection canceled or failed');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Hata', 'Fotoğraf seçilirken bir sorun oluştu: ' + error.message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const uploadImage = async (uri) => {
    try {
      console.log('Uploading image with URI:', uri);
      setIsUploadingImage(true);
      
      // Resmi daha küçük boyuta sıkıştır
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 200, height: 200 } }],  // Daha küçük boyut
        { compress: 0.3, format: ImageManipulator.SaveFormat.JPEG, base64: true }  // Daha fazla sıkıştırma
      );
      
      console.log('Image compressed successfully');
      
      if (!manipResult.base64) {
        throw new Error('Resim sıkıştırma başarısız oldu');
      }
      
      // Base64 formatında kaydet
      const base64Image = `data:image/jpeg;base64,${manipResult.base64}`;
      console.log('Base64 image size:', base64Image.length, 'bytes');
      
      // Firestore'a kaydet
      const db = getFirestore();
      const userRef = doc(db, 'users', auth.currentUser.uid);
      
      // Firebase Storage kullanarak kaydet
      try {
        // Kullanıcı verilerini güncelle
        setUserData(prevData => ({
          ...prevData,
          photoURL: base64Image
        }));
        
        setSelectedImage(base64Image);
        
        // Firestore'a kaydet
        await updateDoc(userRef, {
          photoURL: base64Image,
          updatedAt: new Date().toISOString()
        });
        
        console.log('Image successfully saved to Firestore');
        return base64Image;
      } catch (firestoreError) {
        console.error('Error saving to Firestore:', firestoreError);
        
        // Firestore hatası durumunda alternatif olarak Firebase Storage'ı deneyelim
        if (firestoreError.message.includes('longer than 1048487 bytes')) {
          Alert.alert(
            'Bilgi', 
            'Fotoğraf boyutu çok büyük olduğu için profil fotoğrafınız geçici olarak kaydedilemedi. Daha küçük bir fotoğraf seçmeyi deneyin.'
          );
        } else {
          throw firestoreError;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error in uploadImage:', error);
      Alert.alert('Hata', 'Fotoğraf yüklenirken bir sorun oluştu: ' + error.message);
      return null;
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleNotificationSettings = () => {
    Alert.alert('Bilgi', 'Bildirim ayarları yakında eklenecek!');
  };

  const handleLanguageSettings = () => {
    Alert.alert('Bilgi', 'Dil ayarları yakında eklenecek!');
  };

  const handleAbout = () => {
    Alert.alert('Park Yerim Hakkında', 'Sürüm 1.0.0\n\nPark Yerim, araç sahiplerinin park yerlerini kolayca kaydetmelerini ve yönetmelerini sağlayan bir uygulamadır.');
  };

  const handleHelp = () => {
    Alert.alert('Yardım', 'Yardıma mı ihtiyacınız var?\n\nAna sayfada haritada bir konum seçip + butonuna tıklayarak park yerinizi kaydedebilirsiniz.\n\nKayıtlı Yerler sayfasından tüm kayıtlı konumlarınızı görüntüleyebilir ve yönetebilirsiniz.');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, isDarkMode && styles.darkText]}>Profil</Text>
        </View>
        
        <View style={[styles.profileCard, isDarkMode && styles.darkProfileCard]}>
          <View style={styles.profileImageContainer}>
            {userData?.photoURL ? (
              <Image 
                source={{ uri: userData.photoURL }} 
                style={styles.profileImage} 
              />
            ) : (
              <View style={[styles.profileImagePlaceholder, isDarkMode && styles.darkProfileImagePlaceholder]}>
                <Text style={styles.profileImageText}>
                  {userData?.firstName?.charAt(0) || ''}{userData?.lastName?.charAt(0) || ''}
                </Text>
              </View>
            )}
            <TouchableOpacity 
              style={[styles.editProfileButton, isDarkMode && styles.darkEditProfileButton]}
              onPress={handleEditProfile}
            >
              <Ionicons name="pencil" size={16} color={COLORS.white} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={[styles.name, isDarkMode && styles.darkText]}>
              {userData?.firstName} {userData?.lastName}
            </Text>
            <Text style={[styles.email, isDarkMode && styles.darkSecondaryText]}>
              {auth.currentUser?.email}
            </Text>
          </View>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, isDarkMode && styles.darkStatCard]}>
            <Ionicons 
              name="location" 
              size={24} 
              color={COLORS.primary} 
            />
            <Text style={[styles.statValue, isDarkMode && styles.darkText]}>
              {stats.totalLocations}
            </Text>
            <Text style={[styles.statLabel, isDarkMode && styles.darkSecondaryText]}>
              Toplam Konum
            </Text>
          </View>
          
          <View style={[styles.statCard, isDarkMode && styles.darkStatCard]}>
            <Ionicons 
              name="cash-outline" 
              size={24} 
              color={COLORS.success} 
            />
            <Text style={[styles.statValue, isDarkMode && styles.darkText]}>
              {stats.freeLocations}
            </Text>
            <Text style={[styles.statLabel, isDarkMode && styles.darkSecondaryText]}>
              Ücretsiz
            </Text>
          </View>
          
          <View style={[styles.statCard, isDarkMode && styles.darkStatCard]}>
            <Ionicons 
              name="card-outline" 
              size={24} 
              color={COLORS.primary} 
            />
            <Text style={[styles.statValue, isDarkMode && styles.darkText]}>
              {stats.paidLocations}
            </Text>
            <Text style={[styles.statLabel, isDarkMode && styles.darkSecondaryText]}>
              Ücretli
            </Text>
          </View>
        </View>
        
        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
            Ayarlar
          </Text>
          
          <View style={[styles.settingItem, isDarkMode && styles.darkSettingItem]}>
            <View style={styles.settingLeft}>
              <Ionicons 
                name={isDarkMode ? "moon" : "moon-outline"} 
                size={24} 
                color={isDarkMode ? COLORS.primary : COLORS.text.primary} 
              />
              <Text style={[styles.settingText, isDarkMode && styles.darkText]}>
                Karanlık Mod
              </Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: COLORS.shadow, true: COLORS.primary }}
              thumbColor={isDarkMode ? COLORS.white : '#f4f3f4'}
            />
          </View>
          
          <TouchableOpacity 
            style={[styles.settingItem, isDarkMode && styles.darkSettingItem]}
            onPress={handleNotificationSettings}
          >
            <View style={styles.settingLeft}>
              <Ionicons 
                name="notifications-outline" 
                size={24} 
                color={isDarkMode ? COLORS.white : COLORS.text.primary} 
              />
              <Text style={[styles.settingText, isDarkMode && styles.darkText]}>
                Bildirim Ayarları
              </Text>
            </View>
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color={isDarkMode ? COLORS.white : COLORS.text.secondary} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.settingItem, isDarkMode && styles.darkSettingItem]}
            onPress={handleLanguageSettings}
          >
            <View style={styles.settingLeft}>
              <Ionicons 
                name="language-outline" 
                size={24} 
                color={isDarkMode ? COLORS.white : COLORS.text.primary} 
              />
              <Text style={[styles.settingText, isDarkMode && styles.darkText]}>
                Dil
              </Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={[styles.settingValue, isDarkMode && styles.darkSecondaryText]}>
                Türkçe
              </Text>
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color={isDarkMode ? COLORS.white : COLORS.text.secondary} 
              />
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
            Diğer
          </Text>
          
          <TouchableOpacity 
            style={[styles.settingItem, isDarkMode && styles.darkSettingItem]}
            onPress={handleAbout}
          >
            <View style={styles.settingLeft}>
              <Ionicons 
                name="information-circle-outline" 
                size={24} 
                color={isDarkMode ? COLORS.white : COLORS.text.primary} 
              />
              <Text style={[styles.settingText, isDarkMode && styles.darkText]}>
                Hakkında
              </Text>
            </View>
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color={isDarkMode ? COLORS.white : COLORS.text.secondary} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.settingItem, isDarkMode && styles.darkSettingItem]}
            onPress={handleHelp}
          >
            <View style={styles.settingLeft}>
              <Ionicons 
                name="help-circle-outline" 
                size={24} 
                color={isDarkMode ? COLORS.white : COLORS.text.primary} 
              />
              <Text style={[styles.settingText, isDarkMode && styles.darkText]}>
                Yardım
              </Text>
            </View>
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color={isDarkMode ? COLORS.white : COLORS.text.secondary} 
            />
          </TouchableOpacity>
        </View>
        
        <CustomButton
          title="Çıkış Yap"
          onPress={handleLogout}
          style={styles.logoutButton}
          icon="log-out-outline"
        />
        
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, isDarkMode && styles.darkSecondaryText]}>
            Park Yerim v1.0.0
          </Text>
        </View>
      </ScrollView>

      {/* Profil Düzenleme Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={[styles.modalContent, isDarkMode && styles.darkModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDarkMode && styles.darkText]}>
                Profil Düzenle
              </Text>
              <TouchableOpacity 
                onPress={() => setShowEditModal(false)}
                style={styles.closeButton}
              >
                <Ionicons 
                  name="close" 
                  size={24} 
                  color={isDarkMode ? COLORS.white : COLORS.text.primary} 
                />
              </TouchableOpacity>
            </View>

            <View style={styles.profileImageEditContainer}>
              {isUploadingImage ? (
                <View style={[styles.largeProfileImage, styles.uploadingContainer]}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
              ) : selectedImage ? (
                <Image 
                  source={{ uri: selectedImage }} 
                  style={styles.largeProfileImage} 
                />
              ) : (
                <View style={[styles.profileImagePlaceholder, isDarkMode && styles.darkProfileImagePlaceholder, styles.largeProfileImage]}>
                  <Text style={[styles.profileImageText, styles.largeProfileImageText]}>
                    {editFirstName?.charAt(0) || ''}{editLastName?.charAt(0) || ''}
                  </Text>
                </View>
              )}
              <TouchableOpacity 
                style={styles.changePhotoButton}
                onPress={handleChangePhoto}
                disabled={isUploadingImage}
              >
                <Text style={[
                  styles.changePhotoText, 
                  isUploadingImage && styles.disabledText
                ]}>
                  Fotoğraf Değiştir
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, isDarkMode && styles.darkText]}>Ad</Text>
              <CustomInput
                value={editFirstName}
                onChangeText={setEditFirstName}
                placeholder="Adınız"
                style={styles.input}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, isDarkMode && styles.darkText]}>Soyad</Text>
              <CustomInput
                value={editLastName}
                onChangeText={setEditLastName}
                placeholder="Soyadınız"
                style={styles.input}
              />
            </View>

            <CustomButton
              title={isSaving ? "Kaydediliyor..." : "Kaydet"}
              onPress={handleSaveProfile}
              style={styles.saveButton}
              disabled={isSaving || isUploadingImage}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xlarge,
  },
  header: {
    padding: SPACING.large,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: FONTS.sizes.subtitle,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
  },
  // Profil Kartı Stilleri
  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginHorizontal: SPACING.medium,
    marginBottom: SPACING.large,
    padding: SPACING.large,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  darkProfileCard: {
    backgroundColor: '#2a2a2a',
    shadowColor: '#000',
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: SPACING.large,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkProfileImagePlaceholder: {
    backgroundColor: COLORS.primary,
  },
  profileImageText: {
    fontSize: FONTS.sizes.large,
    fontWeight: FONTS.weights.bold,
    color: COLORS.white,
  },
  editProfileButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  darkEditProfileButton: {
    borderColor: '#2a2a2a',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: FONTS.sizes.large,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text.primary,
    marginBottom: SPACING.small / 2,
  },
  email: {
    fontSize: FONTS.sizes.regular,
    color: COLORS.text.secondary,
  },
  // İstatistik Kartları Stilleri
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: SPACING.medium,
    marginBottom: SPACING.large,
  },
  statCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.medium,
    alignItems: 'center',
    width: '31%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  darkStatCard: {
    backgroundColor: '#2a2a2a',
  },
  statValue: {
    fontSize: FONTS.sizes.large,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    marginVertical: SPACING.small / 2,
  },
  statLabel: {
    fontSize: FONTS.sizes.small,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  // Ayarlar Bölümü Stilleri
  settingsSection: {
    marginBottom: SPACING.large,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.regular,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text.primary,
    marginHorizontal: SPACING.medium,
    marginBottom: SPACING.small,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.medium,
    paddingHorizontal: SPACING.large,
    marginHorizontal: SPACING.medium,
    marginBottom: SPACING.small,
    borderRadius: 12,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  darkSettingItem: {
    backgroundColor: '#2a2a2a',
    shadowColor: '#000',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: FONTS.sizes.regular,
    color: COLORS.text.primary,
    marginLeft: SPACING.medium,
  },
  settingValue: {
    fontSize: FONTS.sizes.small,
    color: COLORS.text.secondary,
    marginRight: SPACING.small,
  },
  darkText: {
    color: COLORS.white,
  },
  darkSecondaryText: {
    color: '#a0a0a0',
  },
  // Çıkış Butonu Stilleri
  logoutButton: {
    backgroundColor: COLORS.error,
    marginHorizontal: SPACING.medium,
    marginTop: SPACING.medium,
    marginBottom: SPACING.small,
    alignSelf: 'center',
    width: '90%',
    maxWidth: 400,
  },
  // Versiyon Bilgisi Stilleri
  versionContainer: {
    alignItems: 'center',
    marginTop: SPACING.medium,
  },
  versionText: {
    fontSize: FONTS.sizes.xsmall,
    color: COLORS.text.secondary,
  },
  // Modal Stilleri
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: SPACING.medium,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.large,
    width: '100%',
    maxWidth: 500,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  darkModalContent: {
    backgroundColor: '#2a2a2a',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.large,
  },
  modalTitle: {
    fontSize: FONTS.sizes.subtitle,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text.primary,
  },
  closeButton: {
    padding: SPACING.small,
  },
  profileImageEditContainer: {
    alignItems: 'center',
    marginBottom: SPACING.large,
  },
  largeProfileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: SPACING.medium,
  },
  largeProfileImageText: {
    fontSize: FONTS.sizes.xlarge,
  },
  changePhotoButton: {
    padding: SPACING.small,
  },
  changePhotoText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.regular,
    fontWeight: FONTS.weights.medium,
  },
  inputContainer: {
    marginBottom: SPACING.medium,
  },
  inputLabel: {
    fontSize: FONTS.sizes.regular,
    fontWeight: FONTS.weights.medium,
    color: COLORS.text.primary,
    marginBottom: SPACING.small / 2,
  },
  input: {
    marginBottom: SPACING.small,
  },
  saveButton: {
    marginTop: SPACING.medium,
  },
  // Fotoğraf Yükleme Stilleri
  uploadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  disabledText: {
    opacity: 0.5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
    paddingHorizontal: 10,
  },
  statBox: {
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 15,
    width: '30%',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  }
}); 
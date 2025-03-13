import React, { useState, useEffect } from 'react';
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
  ActivityIndicator
} from 'react-native';
import { auth } from '../services/firebase';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import CustomButton from '../components/CustomButton';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { getUserParkingLocations } from '../services/parkingService';

export default function ProfileScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLocations: 0,
    freeLocations: 0,
    paidLocations: 0
  });
  const { isDarkMode, toggleTheme } = useTheme();

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        
        // Kullanıcı bilgilerini yükle
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
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

    loadUserData();
  }, []);

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
    Alert.alert('Bilgi', 'Profil düzenleme özelliği yakında eklenecek!');
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
}); 
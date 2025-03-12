import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, Switch } from 'react-native';
import { auth } from '../services/firebase';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import CustomButton from '../components/CustomButton';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const { isDarkMode, toggleTheme } = useTheme();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigation.replace('Login');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
      <View style={styles.content}>
        <Text style={[styles.title, isDarkMode && styles.darkText]}>Profile</Text>
        
        {userData && (
          <>
            <Text style={[styles.name, isDarkMode && styles.darkText]}>{userData.firstName} {userData.lastName}</Text>
            <Text style={[styles.email, isDarkMode && styles.darkSecondaryText]}>{auth.currentUser?.email}</Text>
          </>
        )}

        <View style={[styles.settingItem, isDarkMode && styles.darkSettingItem]}>
          <View style={styles.settingLeft}>
            <Ionicons 
              name={isDarkMode ? "moon" : "moon-outline"} 
              size={24} 
              color={isDarkMode ? COLORS.primary : COLORS.text.primary} 
            />
            <Text style={[styles.settingText, isDarkMode && styles.darkText]}>Dark Mode</Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={toggleTheme}
            trackColor={{ false: COLORS.shadow, true: COLORS.primary }}
            thumbColor={isDarkMode ? COLORS.white : '#f4f3f4'}
          />
        </View>
        
        <CustomButton
          title="Logout"
          onPress={handleLogout}
          style={styles.logoutButton}
        />
      </View>
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
  content: {
    flex: 1,
    padding: SPACING.xlarge,
    alignItems: 'center',
  },
  title: {
    fontSize: FONTS.sizes.subtitle,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.large,
  },
  name: {
    fontSize: FONTS.sizes.large,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text.primary,
    marginBottom: SPACING.small,
  },
  email: {
    fontSize: FONTS.sizes.regular,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xlarge,
  },
  darkText: {
    color: COLORS.white,
  },
  darkSecondaryText: {
    color: '#a0a0a0',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: SPACING.medium,
    paddingHorizontal: SPACING.large,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: SPACING.large,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  darkSettingItem: {
    backgroundColor: '#2a2a2a',
    shadowColor: '#000',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: FONTS.sizes.regular,
    color: COLORS.text.primary,
    marginLeft: SPACING.medium,
  },
  logoutButton: {
    backgroundColor: COLORS.error,
    marginTop: 'auto',
  },
}); 
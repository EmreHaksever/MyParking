import React from 'react';
import { StyleSheet, Text, View, SafeAreaView } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import CustomButton from '../components/CustomButton';

export default function HomeScreen({ navigation }) {
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace('Login');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Parking Space Management</Text>
        <Text style={styles.subtitle}>Welcome to MyParking App</Text>
        
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xlarge,
  },
  title: {
    fontSize: FONTS.sizes.subtitle,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.medium,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONTS.sizes.regular,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xlarge,
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: COLORS.error,
  },
}); 
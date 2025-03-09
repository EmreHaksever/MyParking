import React from 'react';
import { StyleSheet, Text, View, SafeAreaView } from 'react-native';
import { auth } from '../services/firebase';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import CustomButton from '../components/CustomButton';

export default function ProfileScreen({ navigation }) {
  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigation.replace('Login');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.email}>{auth.currentUser?.email}</Text>
        
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
    padding: SPACING.xlarge,
    alignItems: 'center',
  },
  title: {
    fontSize: FONTS.sizes.subtitle,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.large,
  },
  email: {
    fontSize: FONTS.sizes.regular,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xlarge,
  },
  logoutButton: {
    backgroundColor: COLORS.error,
  },
}); 
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { getAuth, signOut } from 'firebase/auth';

export default function HomeScreen({ navigation }) {
  const handleLogout = async () => {
    try {
      await signOut(getAuth());
      navigation.replace('Login');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Park Yeri Kaydetme Uygulaması</Text>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  logoutButton: {
    backgroundColor: '#ff3b30',
    padding: 10,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
  },
}); 
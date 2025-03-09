import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, Image, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

// Firebase yapılandırması
const firebaseConfig = {
  apiKey: "AIzaSyA0IZkfBdo55YkuSmC_YLFlvdExgTX8ysg",
  authDomain: "myparking-1ce33.firebaseapp.com",
  projectId: "myparking-1ce33",
  storageBucket: "myparking-1ce33.appspot.com",
  messagingSenderId: "1062456240878",
  appId: "1:1062456240878:android:52cf7f0f8dbf8c4f7fa1ff"
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  const handleAuth = async () => {
    try {
      if (isLogin) {
        // Giriş işlemi
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('Giriş başarılı:', userCredential.user.email);
        // Ana sayfaya yönlendir
        navigation.replace('Home');
      } else {
        // Kayıt işlemi
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log('Kayıt başarılı:', userCredential.user.email);
        // Ana sayfaya yönlendir
        navigation.replace('Home');
      }
    } catch (error) {
      Alert.alert('Hata', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.contentContainer}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.appName}>MyParking</Text>
          <Text style={styles.slogan}>Aracınızı güvenle park edin</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>{isLogin ? 'Hoş Geldiniz' : 'Aramıza Katılın'}</Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="E-posta"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#666"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Şifre"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor="#666"
            />
          </View>

          <TouchableOpacity 
            style={styles.button} 
            onPress={handleAuth}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => setIsLogin(!isLogin)}
            style={styles.switchButton}
          >
            <Text style={styles.switchText}>
              {isLogin ? 'Hesabınız yok mu? Kayıt olun' : 'Zaten hesabınız var mı? Giriş yapın'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appName: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  slogan: {
    fontSize: 18,
    color: '#34495e',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 30,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
    fontSize: 18,
    color: '#2c3e50',
    width: '100%',
  },
  button: {
    backgroundColor: '#3498db',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
    shadowColor: '#3498db',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
  },
  switchButton: {
    alignItems: 'center',
    padding: 8,
  },
  switchText: {
    color: '#3498db',
    fontSize: 16,
    fontWeight: '500',
  },
});
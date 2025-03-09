import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  Animated,
  Dimensions
} from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import ParkingLogo from '../components/ParkingLogo';

const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [animation] = useState(new Animated.Value(1));

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      // Animate logo on submit
      Animated.sequence([
        Animated.timing(animation, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(animation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('Login successful:', userCredential.user.email);
        navigation.replace('Home');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log('Registration successful:', userCredential.user.email);
        navigation.replace('Home');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.contentContainer}
      >
        <View style={styles.headerContainer}>
          <Animated.View style={[styles.logoContainer, { transform: [{ scale: animation }] }]}>
            <ParkingLogo width={width * 0.4} height={width * 0.4} />
          </Animated.View>
          <Text style={styles.appName}>MyParking</Text>
          <Text style={styles.slogan}>Park Your Car Safely</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>
            {isLogin ? 'Welcome Back' : 'Join Us'}
          </Text>
          
          <View style={styles.inputContainer}>
            <CustomInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              keyboardType="email-address"
            />
            
            <CustomInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              secureTextEntry
            />
          </View>

          <CustomButton
            title={isLogin ? 'Login' : 'Register'}
            onPress={handleAuth}
          />
          
          <CustomButton
            title={isLogin ? 'Don\'t have an account? Register' : 'Already have an account? Login'}
            onPress={() => setIsLogin(!isLogin)}
            variant="secondary"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    flex: 1,
    padding: SPACING.xlarge,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xxlarge,
  },
  logoContainer: {
    marginBottom: SPACING.large,
    backgroundColor: COLORS.background,
    borderRadius: width * 0.2,
    padding: SPACING.medium,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  appName: {
    fontSize: FONTS.sizes.title,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.small,
  },
  slogan: {
    fontSize: FONTS.sizes.regular,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: SPACING.xlarge,
    width: '100%',
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
  title: {
    fontSize: FONTS.sizes.subtitle,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text.primary,
    marginBottom: SPACING.xlarge,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: SPACING.large,
  },
}); 
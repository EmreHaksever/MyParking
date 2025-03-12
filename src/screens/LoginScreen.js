import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  Animated,
  Dimensions,
  TouchableOpacity,
  LinearGradient
} from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, saveUserData } from '../services/firebase';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import ParkingLogo from '../components/ParkingLogo';
import Svg, { Path, Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [animation] = useState(new Animated.Value(1));
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  // Yeni animasyon değerleri
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateTransition = (isLoginNext) => {
    // Önce mevcut içeriği fade out yap
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: isLoginNext ? -20 : 20,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsLogin(isLoginNext);
      // Sonra yeni içeriği fade in yap
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        })
      ]).start();
    });
  };

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!isLogin && (!firstName || !lastName)) {
      Alert.alert('Error', 'Please fill in your first and last name');
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
        // Register new user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        try {
          // Save additional user data to Firestore
          await saveUserData(userCredential.user.uid, {
            firstName,
            lastName,
            email,
            displayName: `${firstName} ${lastName}`,
          });
        } catch (firestoreError) {
          console.error('Firestore error:', firestoreError);
          // Kullanıcı oluşturuldu ama Firestore'a kayıt başarısız oldu
          // Yine de Home ekranına yönlendir
        }

        console.log('Registration successful:', userCredential.user.email);
        navigation.replace('Home');
      }
    } catch (error) {
      console.error('Auth error:', error);
      Alert.alert(
        'Error',
        error.code === 'auth/email-already-in-use'
          ? 'This email is already registered. Please try logging in.'
          : error.message
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.backgroundPattern}>
        <Svg height="100%" width="100%" style={styles.backgroundSvg}>
          <Defs>
            <SvgGradient id="grad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={COLORS.primaryLight} stopOpacity="0.03" />
              <Stop offset="0.5" stopColor={COLORS.primary} stopOpacity="0.05" />
              <Stop offset="1" stopColor={COLORS.primaryDark} stopOpacity="0.08" />
            </SvgGradient>
            <SvgGradient id="patternGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={COLORS.primary} stopOpacity="0.02" />
              <Stop offset="1" stopColor={COLORS.primaryLight} stopOpacity="0.05" />
            </SvgGradient>
          </Defs>
          
          {/* Ana gradient arka plan */}
          <Circle cx="0" cy="0" r="400" fill="url(#grad)" />
          <Circle cx="100%" cy="100%" r="300" fill="url(#grad)" />
          
          {/* Dekoratif desenler */}
          {Array.from({ length: 8 }).map((_, i) => (
            <Circle
              key={i}
              cx={`${Math.random() * 100}%`}
              cy={`${Math.random() * 100}%`}
              r={40 + Math.random() * 60}
              fill="url(#patternGrad)"
              opacity={0.4}
            />
          ))}
          
          {/* İnce çizgiler */}
          <Path
            d="M0 100 Q 400 0, 800 100 T 1600 100"
            stroke={COLORS.primary}
            strokeWidth="1"
            opacity="0.05"
          />
          <Path
            d="M0 200 Q 400 100, 800 200 T 1600 200"
            stroke={COLORS.primary}
            strokeWidth="1"
            opacity="0.03"
          />
        </Svg>
      </View>

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
          <Animated.View style={{
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }]
          }}>
            <Text style={styles.title}>
              {isLogin ? 'Welcome Back' : 'Join Us'}
            </Text>
            
            <View style={styles.inputContainer}>
              {!isLogin && (
                <>
                  <CustomInput
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="First Name"
                    autoCapitalize="words"
                  />
                  <CustomInput
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Last Name"
                    autoCapitalize="words"
                  />
                </>
              )}
              
              <CustomInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              
              <View style={styles.passwordContainer}>
                <CustomInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  secureTextEntry={!showPassword}
                  style={styles.passwordInput}
                />
                <TouchableOpacity 
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <Circle
                      cx="12"
                      cy="12"
                      r="12"
                      fill={COLORS.primary}
                      opacity="0.1"
                    />
                    <Path
                      d={showPassword 
                        ? "M12 6c-4.5 0-8.2 3-9.5 7 1.3 4 5 7 9.5 7s8.2-3 9.5-7c-1.3-4-5-7-9.5-7zm0 11.5c-2.5 0-4.5-2-4.5-4.5s2-4.5 4.5-4.5 4.5 2 4.5 4.5-2 4.5-4.5 4.5zm0-7.2c-1.5 0-2.7 1.2-2.7 2.7s1.2 2.7 2.7 2.7 2.7-1.2 2.7-2.7-1.2-2.7-2.7-2.7z"
                        : "M12 6c-4.5 0-8.2 3-9.5 7 1.3 4 5 7 9.5 7s8.2-3 9.5-7c-1.3-4-5-7-9.5-7zm0 11.5c-2.5 0-4.5-2-4.5-4.5s2-4.5 4.5-4.5 4.5 2 4.5 4.5-2 4.5-4.5 4.5z"}
                      fill={COLORS.primary}
                    />
                    {!showPassword && (
                      <Path
                        d="M4 4L20 20"
                        stroke={COLORS.primary}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                    )}
                  </Svg>
                </TouchableOpacity>
              </View>
            </View>

            <CustomButton
              title={isLogin ? 'Login' : 'Register'}
              onPress={handleAuth}
              style={styles.loginButton}
            />
          </Animated.View>
          
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>
              {isLogin ? 'Don\'t have an account?' : 'Already have an account?'}
            </Text>
            <TouchableOpacity 
              onPress={() => animateTransition(!isLogin)}
              style={styles.registerButton}
            >
              <Text style={styles.registerButtonText}>
                {isLogin ? 'Register' : 'Login'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  backgroundPattern: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 1,
  },
  backgroundSvg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    flex: 1,
    padding: SPACING.xlarge,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '15%',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xlarge,
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
    fontSize: FONTS.sizes.large,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.small / 2,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  slogan: {
    fontSize: FONTS.sizes.medium,
    color: COLORS.text.secondary,
    textAlign: 'center',
    fontWeight: FONTS.weights.medium,
    letterSpacing: 0.5,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: 24,
    padding: SPACING.xlarge,
    width: '100%',
    maxWidth: 400,
    elevation: 10,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    transform: [{ translateY: -SPACING.xlarge }],
  },
  title: {
    fontSize: FONTS.sizes.subtitle,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.xlarge,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  inputContainer: {
    marginBottom: SPACING.large,
  },
  passwordContainer: {
    position: 'relative',
    width: '100%',
    marginBottom: SPACING.large,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  passwordInput: {
    paddingRight: 50,
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
    fontSize: FONTS.sizes.regular,
    color: COLORS.text.primary,
    height: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -28 }],
    padding: 8,
    borderRadius: 24,
    backgroundColor: 'transparent',
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButton: {
    marginBottom: SPACING.medium,
  },
  registerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.small,
  },
  registerText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.sizes.regular,
    marginRight: SPACING.small,
  },
  registerButton: {
    padding: SPACING.small,
  },
  registerButtonText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.regular,
    fontWeight: FONTS.weights.semiBold,
    textDecorationLine: 'underline',
  },
}); 
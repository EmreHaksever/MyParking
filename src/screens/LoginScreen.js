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
  ActivityIndicator,
  StatusBar,
  ScrollView
} from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, saveUserData } from '../services/firebase';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import ParkingLogo from '../components/ParkingLogo';
import Svg, { Path, Circle, Defs, LinearGradient as SvgGradient, Stop, Rect } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [animation] = useState(new Animated.Value(1));
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Yeni animasyon değerleri
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  
  const { isDarkMode } = useTheme();

  const animateTransition = (isLoginNext) => {
    // Hata mesajını temizle
    setErrorMessage('');
    
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
    // Hata mesajını temizle
    setErrorMessage('');
    
    if (!email || !password) {
      setErrorMessage('Lütfen tüm gerekli alanları doldurun');
      return;
    }

    if (!isLogin && (!firstName || !lastName)) {
      setErrorMessage('Lütfen ad ve soyadınızı girin');
      return;
    }

    try {
      setIsLoading(true);
      
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
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
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
      
      // Kullanıcı dostu hata mesajları
      let errorMsg = 'Bir hata oluştu. Lütfen tekrar deneyin.';
      
      switch(error.code) {
        case 'auth/email-already-in-use':
          errorMsg = 'Bu e-posta adresi zaten kayıtlı. Lütfen giriş yapmayı deneyin.';
          break;
        case 'auth/invalid-email':
          errorMsg = 'Geçersiz e-posta adresi. Lütfen kontrol edin.';
          break;
        case 'auth/user-not-found':
          errorMsg = 'Bu e-posta adresiyle kayıtlı bir kullanıcı bulunamadı.';
          break;
        case 'auth/wrong-password':
          errorMsg = 'Hatalı şifre. Lütfen tekrar deneyin.';
          break;
        case 'auth/weak-password':
          errorMsg = 'Şifre çok zayıf. Lütfen en az 6 karakter içeren güçlü bir şifre seçin.';
          break;
        case 'auth/network-request-failed':
          errorMsg = 'Ağ hatası. Lütfen internet bağlantınızı kontrol edin.';
          break;
        case 'auth/too-many-requests':
          errorMsg = 'Çok fazla başarısız giriş denemesi. Lütfen daha sonra tekrar deneyin.';
          break;
      }
      
      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content"} 
        backgroundColor={isDarkMode ? "#121212" : COLORS.background}
      />
      
      <View style={styles.backgroundPattern}>
        <Svg height="100%" width="100%" style={styles.backgroundSvg}>
          <Defs>
            <SvgGradient id="grad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={isDarkMode ? "#2a2a2a" : COLORS.primaryLight} stopOpacity={isDarkMode ? "0.1" : "0.03"} />
              <Stop offset="0.5" stopColor={COLORS.primary} stopOpacity={isDarkMode ? "0.15" : "0.05"} />
              <Stop offset="1" stopColor={isDarkMode ? "#1a1a1a" : COLORS.primaryDark} stopOpacity={isDarkMode ? "0.2" : "0.08"} />
            </SvgGradient>
            <SvgGradient id="patternGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={COLORS.primary} stopOpacity={isDarkMode ? "0.05" : "0.02"} />
              <Stop offset="1" stopColor={isDarkMode ? "#2a2a2a" : COLORS.primaryLight} stopOpacity={isDarkMode ? "0.1" : "0.05"} />
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
            opacity={isDarkMode ? "0.1" : "0.05"}
          />
          <Path
            d="M0 200 Q 400 100, 800 200 T 1600 200"
            stroke={COLORS.primary}
            strokeWidth="1"
            opacity={isDarkMode ? "0.08" : "0.03"}
          />
        </Svg>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.contentContainer}
        keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.headerContainer}>
            <Animated.View style={[
              styles.logoContainer, 
              isDarkMode && styles.darkLogoContainer,
              { transform: [{ scale: animation }] }
            ]}>
              <ParkingLogo width={width * 0.4} height={width * 0.4} />
            </Animated.View>
            <Text style={[styles.appName, isDarkMode && styles.darkText]}>Park Yerim</Text>
            <Text style={[styles.slogan, isDarkMode && styles.darkSecondaryText]}>Aracınızı Güvenle Park Edin</Text>
          </View>

          <View style={[styles.formContainer, isDarkMode && styles.darkFormContainer]}>
            <Animated.View style={{
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }]
            }}>
              <Text style={[styles.title, isDarkMode && styles.darkText]}>
                {isLogin ? 'Tekrar Hoşgeldiniz' : 'Bize Katılın'}
              </Text>
              
              {errorMessage ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={20} color={COLORS.error} />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}
              
              <View style={styles.inputContainer}>
                {!isLogin && (
                  <>
                    <CustomInput
                      value={firstName}
                      onChangeText={setFirstName}
                      placeholder="Ad"
                      autoCapitalize="words"
                      icon="person-outline"
                      darkMode={isDarkMode}
                    />
                    <CustomInput
                      value={lastName}
                      onChangeText={setLastName}
                      placeholder="Soyad"
                      autoCapitalize="words"
                      icon="person-outline"
                      darkMode={isDarkMode}
                    />
                  </>
                )}
                
                <CustomInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="E-posta"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  icon="mail-outline"
                  darkMode={isDarkMode}
                />
                
                <View style={[styles.passwordContainer, isDarkMode && styles.darkPasswordContainer]}>
                  <CustomInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Şifre"
                    secureTextEntry={!showPassword}
                    style={styles.passwordInput}
                    icon="lock-closed-outline"
                    darkMode={isDarkMode}
                  />
                  <TouchableOpacity 
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name={showPassword ? "eye-outline" : "eye-off-outline"} 
                      size={22} 
                      color={isDarkMode ? COLORS.white : COLORS.text.secondary} 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <CustomButton
                title={isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
                onPress={handleAuth}
                style={styles.loginButton}
                loading={isLoading}
                disabled={isLoading}
              />
            </Animated.View>
            
            <View style={styles.switchContainer}>
              <Text style={[styles.switchText, isDarkMode && styles.darkSecondaryText]}>
                {isLogin ? 'Hesabınız yok mu?' : 'Zaten hesabınız var mı?'}
              </Text>
              <TouchableOpacity onPress={() => animateTransition(!isLogin)}>
                <Text style={[styles.switchButton, isDarkMode && styles.darkActionText]}>
                  {isLogin ? 'Kayıt Olun' : 'Giriş Yapın'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  darkContainer: {
    backgroundColor: '#121212',
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
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.xlarge,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '15%',
    paddingBottom: SPACING.xlarge,
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
  darkLogoContainer: {
    backgroundColor: '#1a1a1a',
    shadowColor: '#000',
    shadowOpacity: 0.3,
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
  darkFormContainer: {
    backgroundColor: 'rgba(42, 42, 42, 0.95)',
    shadowColor: '#000',
  },
  title: {
    fontSize: FONTS.sizes.subtitle,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.large,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 87, 87, 0.1)',
    borderRadius: 8,
    padding: SPACING.medium,
    marginBottom: SPACING.medium,
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONTS.sizes.small,
    marginLeft: SPACING.small,
    flex: 1,
  },
  inputContainer: {
    marginBottom: SPACING.medium,
  },
  passwordContainer: {
    position: 'relative',
    width: '100%',
    marginBottom: SPACING.small,
  },
  darkPasswordContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -26 }],
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
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.small,
  },
  switchText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.sizes.regular,
    marginRight: SPACING.small,
  },
  switchButton: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.regular,
    fontWeight: FONTS.weights.semiBold,
    textDecorationLine: 'underline',
  },
  darkText: {
    color: COLORS.white,
  },
  darkSecondaryText: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  darkActionText: {
    color: COLORS.primary,
  },
}); 
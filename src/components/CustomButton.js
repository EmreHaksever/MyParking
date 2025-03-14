import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, Pressable, ActivityIndicator, View } from 'react-native';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function CustomButton({ 
  title, 
  onPress, 
  style, 
  type = 'primary', 
  icon, 
  loading = false, 
  disabled = false,
  iconPosition = 'left'
}) {
  const animatedScale = new Animated.Value(1);

  const handlePressIn = () => {
    if (disabled || loading) return;
    
    Animated.spring(animatedScale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    
    Animated.spring(animatedScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getButtonStyle = () => {
    if (disabled) {
      return type === 'primary' 
        ? styles.disabledPrimaryButton 
        : styles.disabledSecondaryButton;
    }
    return type === 'primary' ? styles.primaryButton : styles.secondaryButton;
  };

  const getTextStyle = () => {
    if (disabled) {
      return type === 'primary' 
        ? styles.disabledPrimaryText 
        : styles.disabledSecondaryText;
    }
    return type === 'primary' ? styles.primaryText : styles.secondaryText;
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={loading || disabled ? null : onPress}
      style={({ pressed }) => [
        { opacity: (pressed && !loading && !disabled) ? 0.9 : 1 }
      ]}
    >
      <Animated.View
        style={[
          styles.button,
          getButtonStyle(),
          { transform: [{ scale: animatedScale }] },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator 
            size="small" 
            color={type === 'primary' ? COLORS.white : COLORS.primary} 
          />
        ) : (
          <View style={styles.buttonContent}>
            {icon && iconPosition === 'left' && (
              <Ionicons 
                name={icon} 
                size={18} 
                color={type === 'primary' ? COLORS.white : COLORS.primary} 
                style={styles.leftIcon} 
              />
            )}
            <Text
              style={[
                styles.text,
                getTextStyle(),
              ]}
            >
              {title}
            </Text>
            {icon && iconPosition === 'right' && (
              <Ionicons 
                name={icon} 
                size={18} 
                color={type === 'primary' ? COLORS.white : COLORS.primary} 
                style={styles.rightIcon} 
              />
            )}
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    paddingVertical: SPACING.medium,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderWidth: 0,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  disabledPrimaryButton: {
    backgroundColor: 'rgba(128, 128, 128, 0.3)',
    borderWidth: 0,
  },
  disabledSecondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'rgba(128, 128, 128, 0.5)',
  },
  text: {
    fontSize: FONTS.sizes.medium,
    fontWeight: FONTS.weights.semiBold,
    letterSpacing: 0.5,
  },
  primaryText: {
    color: COLORS.text.light,
  },
  secondaryText: {
    color: COLORS.primary,
  },
  disabledPrimaryText: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  disabledSecondaryText: {
    color: 'rgba(128, 128, 128, 0.7)',
  },
  leftIcon: {
    marginRight: SPACING.small,
  },
  rightIcon: {
    marginLeft: SPACING.small,
  },
}); 
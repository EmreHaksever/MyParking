import React from 'react';
import { StyleSheet, TouchableOpacity, Text } from 'react-native';
import { COLORS, FONTS, SHADOWS } from '../constants/theme';

export const CustomButton = ({ 
  title, 
  onPress, 
  style, 
  textStyle,
  variant = 'primary' // 'primary' | 'secondary'
}) => {
  return (
    <TouchableOpacity 
      style={[
        styles.button, 
        variant === 'primary' ? styles.primaryButton : styles.secondaryButton,
        style
      ]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[
        styles.buttonText,
        variant === 'primary' ? styles.primaryText : styles.secondaryText,
        textStyle
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    padding: FONTS.sizes.regular,
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
    ...SHADOWS.medium
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontSize: FONTS.sizes.regular,
    fontWeight: FONTS.weights.semiBold,
  },
  primaryText: {
    color: COLORS.text.white,
  },
  secondaryText: {
    color: COLORS.primary,
  }
});

export default CustomButton; 
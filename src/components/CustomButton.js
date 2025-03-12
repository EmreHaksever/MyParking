import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, Pressable } from 'react-native';
import { COLORS, FONTS, SPACING } from '../constants/theme';

export default function CustomButton({ title, onPress, style, type = 'primary' }) {
  const animatedScale = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(animatedScale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(animatedScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View
        style={[
          styles.button,
          type === 'primary' ? styles.primaryButton : styles.secondaryButton,
          { transform: [{ scale: animatedScale }] },
          style,
        ]}
      >
        <Text
          style={[
            styles.text,
            type === 'primary' ? styles.primaryText : styles.secondaryText,
          ]}
        >
          {title}
        </Text>
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
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderWidth: 0,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
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
}); 
import React, { useState } from 'react';
import { TextInput, StyleSheet, Animated, View } from 'react-native';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function CustomInput({ style, icon, darkMode, ...props }) {
  const [focused, setFocused] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  const handleFocus = () => {
    setFocused(true);
    Animated.spring(animation, {
      toValue: 1,
      useNativeDriver: false,
      friction: 8,
      tension: 40,
    }).start();
  };

  const handleBlur = () => {
    setFocused(false);
    Animated.spring(animation, {
      toValue: 0,
      useNativeDriver: false,
      friction: 8,
      tension: 40,
    }).start();
  };

  const animatedStyle = {
    transform: [{
      scale: animation.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.02]
      })
    }],
    borderColor: animation.interpolate({
      inputRange: [0, 1],
      outputRange: [darkMode ? 'rgba(255, 255, 255, 0.1)' : COLORS.shadow, COLORS.primary]
    }),
    shadowOpacity: animation.interpolate({
      inputRange: [0, 1],
      outputRange: [darkMode ? 0.2 : 0.1, 0.25]
    }),
    backgroundColor: animation.interpolate({
      inputRange: [0, 1],
      outputRange: [darkMode ? 'rgba(255, 255, 255, 0.05)' : COLORS.white, darkMode ? 'rgba(255, 255, 255, 0.1)' : COLORS.background]
    })
  };

  return (
    <Animated.View style={[styles.inputWrapper, animatedStyle, darkMode && styles.darkInputWrapper]}>
      {icon && (
        <View style={styles.iconContainer}>
          <Ionicons 
            name={icon} 
            size={20} 
            color={focused ? COLORS.primary : darkMode ? 'rgba(255, 255, 255, 0.7)' : COLORS.text.secondary} 
          />
        </View>
      )}
      <TextInput
        style={[
          styles.input, 
          icon && styles.inputWithIcon,
          darkMode && styles.darkInput,
          style
        ]}
        placeholderTextColor={darkMode ? 'rgba(255, 255, 255, 0.5)' : COLORS.text.secondary}
        onFocus={handleFocus}
        onBlur={handleBlur}
        selectionColor={COLORS.primary}
        {...props}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  inputWrapper: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: SPACING.medium,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  darkInputWrapper: {
    shadowColor: '#000',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconContainer: {
    paddingLeft: SPACING.large,
  },
  input: {
    flex: 1,
    paddingHorizontal: SPACING.large,
    paddingVertical: SPACING.medium,
    fontSize: FONTS.sizes.regular,
    color: COLORS.text.primary,
    fontFamily: 'System',
  },
  inputWithIcon: {
    paddingLeft: SPACING.small,
  },
  darkInput: {
    color: COLORS.white,
  },
}); 
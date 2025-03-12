import React, { useState } from 'react';
import { TextInput, StyleSheet, Animated } from 'react-native';
import { COLORS, FONTS, SPACING } from '../constants/theme';

export default function CustomInput({ style, ...props }) {
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
      outputRange: [COLORS.shadow, COLORS.primary]
    }),
    shadowOpacity: animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0.1, 0.25]
    }),
    backgroundColor: animation.interpolate({
      inputRange: [0, 1],
      outputRange: [COLORS.white, COLORS.background]
    })
  };

  return (
    <Animated.View style={[styles.inputWrapper, animatedStyle]}>
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={COLORS.text.secondary}
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
  },
  input: {
    width: '100%',
    paddingHorizontal: SPACING.large,
    paddingVertical: SPACING.medium,
    fontSize: FONTS.sizes.regular,
    color: COLORS.text.primary,
    fontFamily: 'System',
  },
}); 
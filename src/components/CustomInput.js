import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';

export const CustomInput = ({ 
  value, 
  onChangeText, 
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize = 'none',
  style
}) => {
  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, style]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.text.secondary}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 12,
  },
  input: {
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 12,
    padding: 18,
    fontSize: FONTS.sizes.regular,
    color: COLORS.text.primary,
    width: '100%',
  }
});

export default CustomInput; 
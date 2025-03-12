import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, G, Rect } from 'react-native-svg';
import { COLORS } from '../constants/theme';

export default function ParkingLogo({ width = 35, height = 35 }) {
  return (
    <View style={{
      width: width * 1.2,
      height: height * 1.2,
      backgroundColor: COLORS.primary,
      borderRadius: width * 0.25,
      shadowColor: COLORS.shadow,
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 10,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden'
    }}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100">
        {/* Arka plan gradyanı için katmanlar */}
        <Circle
          cx="50"
          cy="50"
          r="40"
          fill={COLORS.primaryLight}
          opacity={0.3}
        />
        
        {/* Park işareti */}
        <G transform="translate(30, 25)">
          {/* P harfi */}
          <Path
            d="M0 0 v50 M0 0 h25 a15 15 0 0 1 0 30 h-25"
            stroke="white"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          
          {/* Araba silueti */}
          <Path
            d="M5 15 h15 l5 -5 h10 l5 5 h5 c2 0 3 1 3 3 v4 c0 2 -1 3 -3 3 h-2 c0 3 -2 5 -5 5 s-5 -2 -5 -5 h-10 c0 3 -2 5 -5 5 s-5 -2 -5 -5 h-2 c-2 0 -3 -1 -3 -3 v-4 c0 -2 1 -3 3 -3"
            fill="white"
            opacity="0.9"
            transform="translate(0, 15) scale(0.6)"
          />
        </G>
        
        {/* Dekoratif çizgiler */}
        <Path
          d="M25 75 h50"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.3"
        />
        <Path
          d="M30 82 h40"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.2"
        />
      </Svg>
    </View>
  );
} 
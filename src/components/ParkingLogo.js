import React from 'react';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { COLORS } from '../constants/theme';

export default function ParkingLogo({ width = 120, height = 120 }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 512 512">
      <Circle 
        cx="256" 
        cy="256" 
        r="245" 
        fill={COLORS.white}
        stroke={COLORS.primary}
        strokeWidth="22"
      />
      <G transform="translate(150, 100) scale(0.8)">
        <Path
          d="M90 20h100c44.183 0 80 35.817 80 80s-35.817 80-80 80h-60v90c0 11.046-8.954 20-20 20s-20-8.954-20-20V40c0-11.046 8.954-20 20-20z"
          fill={COLORS.primary}
        />
        <Path
          d="M190 140h-60V60h60c22.091 0 40 17.909 40 40s-17.909 40-40 40z"
          fill={COLORS.white}
        />
      </G>
    </Svg>
  );
} 
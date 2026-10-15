import React from 'react';
import Svg, { Path, Polyline, Circle } from 'react-native-svg';
import { brand } from '../theme/colors';

interface LogoProps {
  size?: number;
  /** When true, renders the mint/amber mark meant for dark backgrounds. */
  inverted?: boolean;
}

/**
 * CodeAtlas logo mark: an open book with angle-bracket "</>" pages and a
 * small sparkle accent. Pure inline SVG — no external image assets.
 */
export function Logo({ size = 40, inverted = false }: LogoProps) {
  const bookColor = inverted ? brand.softWhite : brand.deepNavy;
  const bracketColor = brand.mintGreen;
  const sparkleColor = brand.warmAmber;

  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {/* Open book */}
      <Path
        d="M24 10 C20 7 12 6 6 8 V34 C12 32 20 33 24 36 C28 33 36 32 42 34 V8 C36 6 28 7 24 10 Z"
        stroke={bookColor}
        strokeWidth={2.2}
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      />
      <Path d="M24 10 V36" stroke={bookColor} strokeWidth={2} strokeLinecap="round" />

      {/* Angle brackets </> on the right page */}
      <Polyline
        points="29,16 26,20 29,24"
        stroke={bracketColor}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Polyline
        points="35,16 38,20 35,24"
        stroke={bracketColor}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Sparkle accent */}
      <Circle cx={40} cy={10} r={2.2} fill={sparkleColor} />
      <Path d="M40 4 V7 M40 13 V16 M34 10 H37 M43 10 H46" stroke={sparkleColor} strokeWidth={1.4} strokeLinecap="round" />
    </Svg>
  );
}

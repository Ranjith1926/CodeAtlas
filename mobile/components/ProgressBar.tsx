import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

interface ProgressBarProps {
  /** 0 to 1 */
  progress: number;
  height?: number;
}

export function ProgressBar({ progress, height = 8 }: ProgressBarProps) {
  const { colors } = useTheme();
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <View
      style={[styles.track, { height, borderRadius: height / 2, backgroundColor: colors.surfaceAlt }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <View
        style={[
          styles.fill,
          { width: `${clamped * 100}%`, height, borderRadius: height / 2, backgroundColor: colors.accent },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
  fill: {},
});

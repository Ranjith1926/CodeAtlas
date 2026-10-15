import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

interface SkeletonLineProps {
  width?: number | `${number}%`;
  height?: number;
  style?: ViewStyle;
}

function SkeletonLine({ width = '100%', height = 16, style }: SkeletonLineProps) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 650, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: 8, backgroundColor: colors.surfaceAlt, opacity },
        style,
      ]}
    />
  );
}

/** A generic set of pulsing placeholder lines/cards for loading states. */
export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <View style={styles.wrap} accessibilityLabel="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={styles.row}>
          <SkeletonLine height={64} style={{ borderRadius: 14 }} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12, padding: 16 },
  row: { gap: 8 },
});

export { SkeletonLine };

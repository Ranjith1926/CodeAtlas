import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void | Promise<void>;
  /** Outer sizing/position within whatever row or grid holds this card: width, flex, minHeight, margin. */
  style?: StyleProp<ViewStyle>;
  /** How `children` are arranged inside the card's chrome: flexDirection, alignItems, justifyContent, gap, padding overrides. */
  contentStyle?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

// Every tap gets visible feedback, even a synchronous one (e.g. a plain
// navigation call) that would otherwise resolve before a human could see it.
const MIN_SPINNER_MS = 300;

export function Card({ children, onPress, style, contentStyle, accessibilityLabel }: CardProps) {
  const { colors } = useTheme();
  const [pending, setPending] = useState(false);
  const mountedRef = useRef(true);
  useEffect(() => () => {
    mountedRef.current = false;
  }, []);

  const handlePress = useCallback(() => {
    if (!onPress) return;
    const start = Date.now();
    setPending(true);
    const settle = () => {
      const remaining = Math.max(0, MIN_SPINNER_MS - (Date.now() - start));
      setTimeout(() => {
        if (mountedRef.current) setPending(false);
      }, remaining);
    };
    const result = onPress();
    if (result && typeof (result as Promise<void>).then === 'function') {
      (result as Promise<void>).then(settle, settle);
    } else {
      settle();
    }
  }, [onPress]);

  const content = (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.text },
        contentStyle,
      ]}
    >
      {children}
      {pending && (
        <View style={[StyleSheet.absoluteFill, styles.overlay, { backgroundColor: colors.card }]}>
          <ActivityIndicator color={colors.accent} />
        </View>
      )}
    </View>
  );

  // `style` (sizing: width, flex, minHeight, margin, …) must land on the
  // OUTERMOST element so Yoga can resolve percentage widths against the real
  // parent — a Pressable with no sizing of its own shrinks to its content's
  // intrinsic width, and a percentage width computed against that collapsed
  // size is how grid cards used to break (text wrapping per character).
  // `contentStyle` (arrangement: flexDirection, alignItems, gap, …) must land
  // on the INNER view instead, since that's the direct parent of `children` —
  // applying it to the Pressable has no effect, as the Pressable only ever
  // has this one inner view as its child. The inner view's flexGrow lets it
  // fill whatever box the outer sizing resolves to (e.g. a taller minHeight).
  if (!onPress) return <View style={style}>{content}</View>;

  return (
    <Pressable
      onPress={handlePress}
      disabled={pending}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [style, { opacity: pressed ? 0.85 : 1 }]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  overlay: { alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
});

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void | Promise<void>;
  /** Explicit loading override — pass this when the caller already tracks its own submit state. Omit to get an automatic spinner for the duration of `onPress` (or a brief flash for a synchronous one). */
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

// Every tap gets visible feedback, even a synchronous one (e.g. a plain
// navigation call) that would otherwise resolve before a human could see it.
const MIN_SPINNER_MS = 300;

export function PrimaryButton({ title, onPress, loading, disabled, variant = 'primary' }: PrimaryButtonProps) {
  const { colors } = useTheme();
  const [pending, setPending] = useState(false);
  const mountedRef = useRef(true);
  useEffect(() => () => {
    mountedRef.current = false;
  }, []);

  const handlePress = useCallback(() => {
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

  const isLoading = loading ?? pending;
  const isDisabled = disabled || isLoading;

  const backgroundColor =
    variant === 'primary' ? colors.primary : variant === 'danger' ? colors.danger : colors.surfaceAlt;
  const textColor = variant === 'secondary' ? colors.text : colors.primaryText;

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor, opacity: isDisabled ? 0.6 : pressed ? 0.88 : 1 },
      ]}
    >
      {isLoading ? <ActivityIndicator color={textColor} /> : <Text style={[styles.label, { color: textColor }]}>{title}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  label: { fontSize: 16, fontWeight: '700' },
});

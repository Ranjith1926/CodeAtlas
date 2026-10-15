import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { useResponsive } from '../hooks/useResponsive';

interface ScreenContainerProps {
  children: React.ReactNode;
  scroll?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  style?: ViewStyle;
  /** Centers content with a max reading width instead of stretching full-bleed. */
  centerContent?: boolean;
  /**
   * Pad for the status bar / notch. Only needed on screens with no native
   * header (e.g. Home, Profile) — screens inside a Stack navigator already
   * get a safe-area-aware header, so adding this there would double-pad.
   */
  topInset?: boolean;
}

/**
 * Common screen chrome: themed background, optional scroll + pull-to-refresh,
 * and a centered max-width content column on tablet/large screens so text
 * never stretches full-bleed.
 */
export function ScreenContainer({
  children,
  scroll = true,
  onRefresh,
  refreshing = false,
  style,
  centerContent = true,
  topInset = false,
}: ScreenContainerProps) {
  const { colors } = useTheme();
  const { contentMaxWidth, isTablet } = useResponsive();
  const insets = useSafeAreaInsets();

  const inner = (
    <View
      style={[
        centerContent && isTablet ? { width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center' } : undefined,
        styles.padding,
        topInset ? { paddingTop: insets.top + 16 } : undefined,
        style,
      ]}
    >
      {children}
    </View>
  );

  if (!scroll) {
    return <View style={[styles.flex, { backgroundColor: colors.background }]}>{inner}</View>;
  }

  return (
    <ScrollView
      style={[styles.flex, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        ) : undefined
      }
    >
      {inner}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  padding: { padding: 16 },
});

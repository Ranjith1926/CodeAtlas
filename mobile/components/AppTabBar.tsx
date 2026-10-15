import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { useResponsive } from '../hooks/useResponsive';
import { Logo } from './Logo';

export const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  home: 'home',
  tutorials: 'book',
  'interview-prep': 'briefcase',
  'ai-tutor': 'sparkles',
  profile: 'person',
};

/**
 * Custom tab bar passed to Expo Router's <Tabs tabBar={...}>. The concrete
 * prop types for a React Navigation tab bar belong to a transitive
 * dependency (@react-navigation/bottom-tabs) that isn't a direct project
 * dependency, so we accept the minimal shape we actually use rather than
 * importing its types and coupling to a package version we don't manage.
 */
interface TabBarRoute {
  key: string;
  name: string;
}

interface TabBarDescriptor {
  options: {
    title?: string;
    // React Navigation's real tabBarLabel can also be a render function —
    // typed loosely since we only ever act on the plain-string form (via a
    // typeof check below) and never call it as a function.
    tabBarLabel?: unknown;
    tabBarItemStyle?: StyleProp<ViewStyle>;
  };
}

interface AppTabBarProps {
  state: { routes: TabBarRoute[]; index: number };
  descriptors: Record<string, TabBarDescriptor>;
  navigation: {
    navigate: (name: string) => void;
    emit: (event: { type: 'tabPress'; target: string; canPreventDefault: true }) => { defaultPrevented: boolean };
  };
}

export function AppTabBar({ state, descriptors, navigation }: AppTabBarProps) {
  const { colors } = useTheme();
  const { isTablet } = useResponsive();
  const insets = useSafeAreaInsets();

  const items = state.routes
    .filter((route) => {
      const flat = StyleSheet.flatten(descriptors[route.key]?.options.tabBarItemStyle);
      return flat?.display !== 'none';
    })
    .map((route) => {
    const index = state.routes.indexOf(route);
    const descriptor = descriptors[route.key];
    // tabBarLabel lets a tab show a shorter word than the screen's own
    // header title (e.g. "Interview" vs. "Interview Prep") — long labels
    // otherwise wrap to two lines and throw off the bar's alignment.
    const rawLabel = descriptor?.options.tabBarLabel;
    const label = typeof rawLabel === 'string' ? rawLabel : descriptor?.options.title ?? route.name;
    const isFocused = state.index === index;
    const iconName = TAB_ICONS[route.name] ?? 'ellipse';

    const onPress = () => {
      const event = navigation.emit({ type: 'tabPress' as const, target: route.key, canPreventDefault: true as const });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    const color = isFocused ? colors.tabBarActive : colors.tabBarInactive;

    if (isTablet) {
      return (
        <Pressable
          key={route.key}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityState={isFocused ? { selected: true } : {}}
          accessibilityLabel={label}
          style={({ pressed }) => [
            styles.railItem,
            isFocused && { backgroundColor: colors.surfaceAlt },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Ionicons name={iconName} size={22} color={color} />
          <Text style={[styles.railLabel, { color }]} numberOfLines={1}>
            {label}
          </Text>
        </Pressable>
      );
    }

    return (
      <Pressable
        key={route.key}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={label}
        style={styles.tabItem}
      >
        <Ionicons name={iconName} size={22} color={color} />
        <Text style={[styles.tabLabel, { color }]} numberOfLines={1}>
          {label}
        </Text>
      </Pressable>
    );
  });

  if (isTablet) {
    return (
      <View
        style={[
          styles.rail,
          { backgroundColor: colors.tabBarBackground, borderRightColor: colors.border, paddingTop: insets.top + 16 },
        ]}
      >
        <View style={styles.railHeader}>
          <Logo size={32} inverted={colors.tabBarBackground !== '#FFFFFF'} />
        </View>
        {items}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.bottomBar,
        { backgroundColor: colors.tabBarBackground, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 8) },
      ]}
    >
      {items}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    minHeight: 44,
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  rail: {
    width: 96,
    height: '100%',
    borderRightWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    gap: 6,
  },
  railHeader: {
    marginBottom: 20,
  },
  railItem: {
    width: 76,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
    minHeight: 44,
    justifyContent: 'center',
  },
  railLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});

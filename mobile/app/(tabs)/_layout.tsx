import React from 'react';
import { Tabs } from 'expo-router';
import { AppTabBar } from '../../components/AppTabBar';
import { useResponsive } from '../../hooks/useResponsive';
import { useTheme } from '../../theme/ThemeProvider';

export default function TabsLayout() {
  const { isTablet } = useResponsive();
  const { colors } = useTheme();

  return (
    <Tabs
      // eslint-disable-next-line react/no-unstable-nested-components -- tabBar must re-render on theme/breakpoint change
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarPosition: isTablet ? 'left' : 'bottom',
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="tutorials" options={{ title: 'Tutorials' }} />
      <Tabs.Screen name="interview-prep" options={{ title: 'Interview Prep', tabBarLabel: 'Interview' }} />
      <Tabs.Screen name="bookmarks" options={{ title: 'Bookmarks', href: null }} />
      <Tabs.Screen name="ai-tutor" options={{ title: 'AI Tutor' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

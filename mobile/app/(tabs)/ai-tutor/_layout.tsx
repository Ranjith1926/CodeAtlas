import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '../../../theme/ThemeProvider';

export default function AiTutorLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { color: colors.text },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'AI Tutor' }} />
      <Stack.Screen name="[sessionId]" options={{ title: 'Chat' }} />
    </Stack>
  );
}

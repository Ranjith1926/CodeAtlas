import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '../../../theme/ThemeProvider';

export default function TutorialsLayout() {
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
      <Stack.Screen name="index" options={{ title: 'Tutorials' }} />
      <Stack.Screen name="[langCode]" options={{ title: 'Categories' }} />
      <Stack.Screen name="category/[categoryId]" options={{ title: 'Topics' }} />
      <Stack.Screen name="topic/[topicId]" options={{ title: 'Topic' }} />
      <Stack.Screen name="lesson/[lessonId]" options={{ title: 'Lesson' }} />
    </Stack>
  );
}

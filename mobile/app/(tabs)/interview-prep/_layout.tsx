import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '../../../theme/ThemeProvider';

export default function InterviewPrepLayout() {
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
      <Stack.Screen name="index" options={{ title: 'Interview Prep' }} />
      <Stack.Screen name="[langCode]" options={{ title: 'Categories' }} />
      <Stack.Screen name="category/[categoryId]" options={{ title: 'Topics' }} />
      <Stack.Screen name="topic/[topicId]" options={{ title: 'Questions' }} />
      <Stack.Screen name="question/[questionId]" options={{ title: 'Question' }} />
    </Stack>
  );
}

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Difficulty } from '../types/models';
import { difficultyColors } from '../theme/colors';

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const palette = difficultyColors[difficulty] ?? difficultyColors.Beginner;
  return (
    <View
      style={[styles.badge, { backgroundColor: palette.bg, borderColor: palette.border }]}
      accessibilityLabel={`Difficulty: ${difficulty}`}
    >
      <Text style={[styles.text, { color: palette.fg }]}>{difficulty}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});

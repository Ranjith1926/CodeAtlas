import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { useTheme } from '../../../../theme/ThemeProvider';
import { ScreenContainer } from '../../../../components/ScreenContainer';
import { Card } from '../../../../components/Card';
import { DifficultyBadge } from '../../../../components/DifficultyBadge';
import { EmptyState } from '../../../../components/EmptyState';
import { LoadingSkeleton } from '../../../../components/LoadingSkeleton';
import { useInterviewQuestions } from '../../../../hooks/queries';
import { Difficulty } from '../../../../types/models';

const DIFFICULTIES: Difficulty[] = ['Beginner', 'Intermediate', 'Advanced'];

export default function InterviewQuestionsScreen() {
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const { colors } = useTheme();
  const [filter, setFilter] = useState<Difficulty | undefined>(undefined);
  const { data: questions, isLoading, isError } = useInterviewQuestions(topicId, filter);

  return (
    <ScreenContainer>
      <Stack.Screen options={{ title: 'Interview Questions' }} />

      <View style={styles.chipsRow}>
        <FilterChip label="All" selected={filter === undefined} onPress={() => setFilter(undefined)} />
        {DIFFICULTIES.map((d) => (
          <FilterChip key={d} label={d} selected={filter === d} onPress={() => setFilter(d)} />
        ))}
      </View>

      {isLoading ? (
        <LoadingSkeleton rows={4} />
      ) : isError || !questions?.length ? (
        <EmptyState icon="help-circle-outline" title="No questions found" message="Try a different difficulty filter." />
      ) : (
        questions.map((q) => (
          <Card
            key={q.id}
            onPress={() => router.push(`/(tabs)/interview-prep/question/${q.id}`)}
            style={styles.card}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.question, { color: colors.text }]} numberOfLines={2}>
                {q.question}
              </Text>
              <DifficultyBadge difficulty={q.difficulty} />
            </View>
          </Card>
        ))
      )}
    </ScreenContainer>
  );
}

function FilterChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.primary : colors.surfaceAlt,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
    >
      <Text style={{ color: selected ? colors.primaryText : colors.text, fontWeight: '600', fontSize: 13 }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  card: { marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  question: { fontSize: 15, fontWeight: '700', flex: 1 },
});

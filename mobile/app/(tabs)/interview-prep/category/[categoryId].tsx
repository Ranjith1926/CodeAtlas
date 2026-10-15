import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { useTheme } from '../../../../theme/ThemeProvider';
import { ScreenContainer } from '../../../../components/ScreenContainer';
import { Card } from '../../../../components/Card';
import { DifficultyBadge } from '../../../../components/DifficultyBadge';
import { EmptyState } from '../../../../components/EmptyState';
import { LoadingSkeleton } from '../../../../components/LoadingSkeleton';
import { useTopics } from '../../../../hooks/queries';

export default function InterviewPrepTopicsScreen() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const { colors } = useTheme();
  const { data: topics, isLoading, isError } = useTopics(categoryId);

  return (
    <ScreenContainer>
      <Stack.Screen options={{ title: 'Topics' }} />

      {isLoading ? (
        <LoadingSkeleton rows={4} />
      ) : isError || !topics?.length ? (
        <EmptyState icon="list-outline" title="No topics found" />
      ) : (
        topics.map((topic) => (
          <Card
            key={topic.id}
            onPress={() => router.push(`/(tabs)/interview-prep/topic/${topic.id}`)}
            style={styles.card}
          >
            <View style={styles.rowHeader}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{topic.title}</Text>
              <DifficultyBadge difficulty={topic.difficulty} />
            </View>
          </Card>
        ))
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', flexShrink: 1 },
});

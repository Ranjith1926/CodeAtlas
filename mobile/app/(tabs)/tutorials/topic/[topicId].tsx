import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../theme/ThemeProvider';
import { ScreenContainer } from '../../../../components/ScreenContainer';
import { Card } from '../../../../components/Card';
import { DifficultyBadge } from '../../../../components/DifficultyBadge';
import { EmptyState } from '../../../../components/EmptyState';
import { LoadingSkeleton } from '../../../../components/LoadingSkeleton';
import { PrimaryButton } from '../../../../components/PrimaryButton';
import { useTopicDetail } from '../../../../hooks/queries';

export default function TopicDetailScreen() {
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const { colors } = useTheme();
  const { data: topic, isLoading, isError } = useTopicDetail(topicId);

  if (isLoading) {
    return (
      <ScreenContainer>
        <LoadingSkeleton rows={4} />
      </ScreenContainer>
    );
  }

  if (isError || !topic) {
    return (
      <ScreenContainer>
        <EmptyState icon="alert-circle-outline" title="Couldn't load this topic" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Stack.Screen options={{ title: topic.title }} />
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{topic.title}</Text>
        <DifficultyBadge difficulty={topic.difficulty} />
      </View>
      <Text style={[styles.summary, { color: colors.textMuted }]}>{topic.summary}</Text>

      <PrimaryButton
        title="Ask AI about this topic"
        variant="secondary"
        onPress={() =>
          router.push({
            pathname: '/(tabs)/ai-tutor/[sessionId]',
            params: { sessionId: 'new', contextTopicId: topic.id, starter: `Can you help me understand "${topic.title}"?` },
          })
        }
      />

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Lessons</Text>
      {topic.lessons.length === 0 ? (
        <Text style={{ color: colors.textMuted }}>No lessons published yet.</Text>
      ) : (
        topic.lessons
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((lesson, index) => (
            <Card
              key={lesson.id}
              onPress={() => router.push(`/(tabs)/tutorials/lesson/${lesson.id}`)}
              style={styles.lessonRowOuter}
              contentStyle={styles.lessonRow}
            >
              <View style={styles.lessonNumber}>
                <Text style={{ color: colors.primaryText, fontWeight: '700' }}>{index + 1}</Text>
              </View>
              <Text style={[styles.lessonTitle, { color: colors.text }]}>{lesson.title}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Card>
          ))
      )}

      {topic.relatedTopics.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Related topics</Text>
          <View style={styles.chipsRow}>
            {topic.relatedTopics.map((rt) => (
              <Card
                key={rt.id}
                onPress={() => router.push(`/(tabs)/tutorials/topic/${rt.id}`)}
                contentStyle={styles.chip}
              >
                <Text style={{ color: colors.text }}>{rt.title}</Text>
              </Card>
            ))}
          </View>
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '800', flexShrink: 1, marginRight: 8 },
  summary: { fontSize: 15, marginBottom: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginTop: 24, marginBottom: 12 },
  lessonRowOuter: { marginBottom: 10 },
  lessonRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  lessonNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#47D7AC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonTitle: { flex: 1, fontSize: 15, fontWeight: '600' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 12 },
});

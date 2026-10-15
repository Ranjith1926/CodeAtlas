import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../theme/ThemeProvider';
import { ScreenContainer } from '../../../../components/ScreenContainer';
import { Card } from '../../../../components/Card';
import { CodeBlock } from '../../../../components/CodeBlock';
import { MarkdownContent } from '../../../../components/MarkdownContent';
import { BookmarkButton } from '../../../../components/BookmarkButton';
import { EmptyState } from '../../../../components/EmptyState';
import { LoadingSkeleton } from '../../../../components/LoadingSkeleton';
import { useLesson } from '../../../../hooks/queries';
import { useNetworkStatus } from '../../../../hooks/useNetworkStatus';
import { getProgressFor, setProgressLocal } from '../../../../data/userdata';
import { downloadTopic, isTopicDownloaded } from '../../../../data/downloads';
import { ProgressStatus } from '../../../../types/models';

export default function LessonReaderScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const { colors } = useTheme();
  const isOnline = useNetworkStatus();
  const { data: lesson, isLoading, isError } = useLesson(lessonId);

  const [progress, setProgress] = useState<ProgressStatus | null>(null);
  const [downloaded, setDownloaded] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!lessonId) return;
    getProgressFor('Lesson', lessonId).then(setProgress);
  }, [lessonId]);

  useEffect(() => {
    if (!lesson) return;
    isTopicDownloaded(lesson.topicId).then(setDownloaded);
  }, [lesson]);

  const markComplete = async () => {
    if (!lessonId) return;
    const next: ProgressStatus = progress === 'Completed' ? 'InProgress' : 'Completed';
    setProgress(next);
    await setProgressLocal('Lesson', lessonId, next, isOnline);
  };

  // Record "InProgress" the first time a lesson is opened, so Home's
  // "continue learning" card has something to point to.
  useEffect(() => {
    if (!lessonId) return;
    (async () => {
      const existing = await getProgressFor('Lesson', lessonId);
      if (!existing) {
        await setProgressLocal('Lesson', lessonId, 'InProgress', isOnline);
        setProgress('InProgress');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  const handleDownload = async () => {
    if (!lesson) return;
    setDownloading(true);
    try {
      await downloadTopic(lesson.topicId);
      setDownloaded(true);
    } catch {
      // Best-effort; the user can retry when back online.
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer>
        <LoadingSkeleton rows={5} />
      </ScreenContainer>
    );
  }

  if (isError || !lesson) {
    return (
      <ScreenContainer>
        <EmptyState
          icon="cloud-offline-outline"
          title="Lesson unavailable"
          message="This lesson hasn't been downloaded and you're offline."
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Stack.Screen options={{ title: lesson.title }} />

      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.text }]}>{lesson.title}</Text>
        <BookmarkButton contentType="Lesson" contentId={lesson.id} />
      </View>

      <MarkdownContent content={lesson.contentMarkdown} />

      {lesson.codeExamples.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Code examples</Text>
          {lesson.codeExamples.map((ex) => (
            <View key={ex.id} style={styles.exampleWrap}>
              {ex.description ? <Text style={{ color: colors.textMuted, marginBottom: 6 }}>{ex.description}</Text> : null}
              <CodeBlock code={ex.code} language={ex.languageCode} expectedOutput={ex.expectedOutput} />
            </View>
          ))}
        </>
      )}

      <View style={styles.actionsRow}>
        <Card onPress={markComplete} contentStyle={styles.actionCard}>
          <Ionicons
            name={progress === 'Completed' ? 'checkmark-circle' : 'checkmark-circle-outline'}
            size={20}
            color={progress === 'Completed' ? colors.success : colors.textMuted}
          />
          <Text style={{ color: colors.text, fontWeight: '600' }}>
            {progress === 'Completed' ? 'Completed' : 'Mark as complete'}
          </Text>
        </Card>

        <Card onPress={handleDownload} contentStyle={styles.actionCard}>
          {downloading ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <Ionicons name={downloaded ? 'cloud-done' : 'cloud-download-outline'} size={20} color={colors.accent} />
          )}
          <Text style={{ color: colors.text, fontWeight: '600' }}>
            {downloaded ? 'Downloaded' : 'Download for offline'}
          </Text>
        </Card>

        <Card
          onPress={() =>
            router.push({
              pathname: '/(tabs)/ai-tutor/[sessionId]',
              params: {
                sessionId: 'new',
                contextTopicId: lesson.topicId,
                starter: `I'm reading the lesson "${lesson.title}" — can you help explain it further?`,
              },
            })
          }
          contentStyle={styles.actionCard}
        >
          <Ionicons name="sparkles" size={20} color={colors.accent} />
          <Text style={{ color: colors.text, fontWeight: '600' }}>Ask AI about this</Text>
        </Card>
      </View>

      <View style={styles.navRow}>
        <Card
          onPress={() => lesson.prevLessonId && router.replace(`/(tabs)/tutorials/lesson/${lesson.prevLessonId}`)}
          style={[styles.navCardOuter, !lesson.prevLessonId && styles.navDisabled]}
          contentStyle={styles.navCard}
        >
          <Ionicons name="chevron-back" size={18} color={colors.text} />
          <Text style={{ color: colors.text }}>Previous</Text>
        </Card>
        <Card
          onPress={() => lesson.nextLessonId && router.replace(`/(tabs)/tutorials/lesson/${lesson.nextLessonId}`)}
          style={[styles.navCardOuter, !lesson.nextLessonId && styles.navDisabled]}
          contentStyle={styles.navCard}
        >
          <Text style={{ color: colors.text }}>Next</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.text} />
        </Card>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '800', flexShrink: 1 },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginTop: 20, marginBottom: 8 },
  exampleWrap: { marginBottom: 12 },
  actionsRow: { gap: 10, marginTop: 24 },
  actionCard: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 20, marginBottom: 12 },
  navCardOuter: { flex: 1 },
  navCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  navDisabled: { opacity: 0.4 },
});

import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../theme/ThemeProvider';
import { ScreenContainer } from '../../../../components/ScreenContainer';
import { Card } from '../../../../components/Card';
import { DifficultyBadge } from '../../../../components/DifficultyBadge';
import { BookmarkButton } from '../../../../components/BookmarkButton';
import { EmptyState } from '../../../../components/EmptyState';
import { LoadingSkeleton } from '../../../../components/LoadingSkeleton';
import { MarkdownContent } from '../../../../components/MarkdownContent';
import { useInterviewQuestion } from '../../../../hooks/queries';
import { useNetworkStatus } from '../../../../hooks/useNetworkStatus';
import { getProgressFor, setProgressLocal } from '../../../../data/userdata';
import { ProgressStatus } from '../../../../types/models';

export default function InterviewQuestionDetailScreen() {
  const { questionId } = useLocalSearchParams<{ questionId: string }>();
  const { colors } = useTheme();
  const isOnline = useNetworkStatus();
  const { data: question, isLoading, isError } = useInterviewQuestion(questionId);
  const [practiced, setPracticed] = useState<ProgressStatus | null>(null);

  useEffect(() => {
    if (!questionId) return;
    getProgressFor('InterviewQuestion', questionId).then(setPracticed);
  }, [questionId]);

  const togglePracticed = async () => {
    if (!questionId) return;
    const next: ProgressStatus = practiced === 'Completed' ? 'NotStarted' : 'Completed';
    setPracticed(next);
    await setProgressLocal('InterviewQuestion', questionId, next, isOnline);
  };

  if (isLoading) {
    return (
      <ScreenContainer>
        <LoadingSkeleton rows={4} />
      </ScreenContainer>
    );
  }

  if (isError || !question) {
    return (
      <ScreenContainer>
        <EmptyState icon="cloud-offline-outline" title="Question unavailable" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Stack.Screen options={{ title: 'Question' }} />

      <View style={styles.headerRow}>
        <DifficultyBadge difficulty={question.difficulty} />
        <BookmarkButton contentType="InterviewQuestion" contentId={question.id} />
      </View>

      <Text style={[styles.question, { color: colors.text }]}>{question.question}</Text>

      <Section title="Answer" colorText={colors.text}>
        <MarkdownContent content={question.answer} />
      </Section>

      {question.scenario ? (
        <Section title="Scenario" colorText={colors.text}>
          <Text style={{ color: colors.textMuted }}>{question.scenario}</Text>
        </Section>
      ) : null}

      {question.commonMistakes ? (
        <Section title="Common mistakes" colorText={colors.text}>
          <Text style={{ color: colors.textMuted }}>{question.commonMistakes}</Text>
        </Section>
      ) : null}

      {question.followUps ? (
        <Section title="Follow-up questions" colorText={colors.text}>
          <Text style={{ color: colors.textMuted }}>{question.followUps}</Text>
        </Section>
      ) : null}

      <Card onPress={togglePracticed} style={styles.practicedCardOuter} contentStyle={styles.practicedCard}>
        <Ionicons
          name={practiced === 'Completed' ? 'checkmark-circle' : 'checkmark-circle-outline'}
          size={20}
          color={practiced === 'Completed' ? colors.success : colors.textMuted}
        />
        <Text style={{ color: colors.text, fontWeight: '600' }}>
          {practiced === 'Completed' ? "You've practiced this" : 'Mark as practiced'}
        </Text>
      </Card>
    </ScreenContainer>
  );
}

function Section({ title, colorText, children }: { title: string; colorText: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colorText }]}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  question: { fontSize: 19, fontWeight: '800', marginBottom: 16 },
  section: { marginBottom: 18 },
  sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  practicedCardOuter: { marginTop: 8 },
  practicedCard: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});

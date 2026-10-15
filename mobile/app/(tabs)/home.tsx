import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../context/AuthContext';
import { ScreenContainer } from '../../components/ScreenContainer';
import { Card } from '../../components/Card';
import { DifficultyBadge } from '../../components/DifficultyBadge';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { useLanguages, useCategories, useTopics, useLesson } from '../../hooks/queries';
import { getLastViewedLesson } from '../../data/userdata';
import { useQueryClient } from '@tanstack/react-query';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [lastLessonId, setLastLessonId] = useState<string | null | undefined>(undefined);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    getLastViewedLesson().then((row) => setLastLessonId(row?.contentId ?? null));
  }, []);

  const { data: lastLesson } = useLesson(lastLessonId ?? undefined);

  const { data: languages, isLoading: loadingLanguages } = useLanguages();
  const firstLanguage = languages?.[0];
  const { data: categories } = useCategories(firstLanguage?.code);
  const firstCategory = categories?.[0];
  const { data: topics } = useTopics(firstCategory?.id);

  const greetingName = user?.displayName?.split(' ')[0] || 'there';

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  };

  return (
    <ScreenContainer onRefresh={onRefresh} refreshing={refreshing} topInset>
      <Text style={[styles.greeting, { color: colors.text }]}>Hi {greetingName} 👋</Text>
      <Text style={[styles.subGreeting, { color: colors.textMuted }]}>Ready to pick up where you left off?</Text>

      {lastLessonId === undefined ? null : lastLesson ? (
        <Card onPress={() => router.push(`/(tabs)/tutorials/lesson/${lastLesson.id}`)} style={styles.sectionCard}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Continue learning</Text>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{lastLesson.title}</Text>
          <View style={styles.rowCenter}>
            <Ionicons name="play-circle" size={18} color={colors.accent} />
            <Text style={[styles.linkText, { color: colors.accent }]}>Resume lesson</Text>
          </View>
        </Card>
      ) : (
        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Continue learning</Text>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Start your first lesson</Text>
          <Text style={{ color: colors.textMuted, marginTop: 4 }}>
            Browse Tutorials to pick a language and get going.
          </Text>
        </Card>
      )}

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick links</Text>
      <View style={styles.quickLinksRow}>
        <QuickLink icon="book" label="Tutorials" onPress={() => router.push('/(tabs)/tutorials')} />
        <QuickLink icon="briefcase" label="Interview Prep" onPress={() => router.push('/(tabs)/interview-prep')} />
        <QuickLink icon="sparkles" label="AI Tutor" onPress={() => router.push('/(tabs)/ai-tutor')} />
        <QuickLink icon="bookmark" label="Bookmarks" onPress={() => router.push('/(tabs)/bookmarks')} />
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Recommended for you</Text>
      {loadingLanguages || !topics ? (
        <LoadingSkeleton rows={3} />
      ) : topics.length === 0 ? (
        <Text style={{ color: colors.textMuted }}>No recommendations yet — explore Tutorials to get started.</Text>
      ) : (
        topics.slice(0, 4).map((topic) => (
          <Card
            key={topic.id}
            onPress={() => router.push(`/(tabs)/tutorials/topic/${topic.id}`)}
            style={styles.topicCard}
          >
            <View style={styles.topicHeader}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{topic.title}</Text>
              <DifficultyBadge difficulty={topic.difficulty} />
            </View>
            <Text style={{ color: colors.textMuted }} numberOfLines={2}>
              {topic.summary}
            </Text>
          </Card>
        ))
      )}
    </ScreenContainer>
  );
}

function QuickLink({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Card onPress={onPress} style={styles.quickLink} contentStyle={styles.quickLinkContent} accessibilityLabel={label}>
      <Ionicons name={icon} size={22} color={colors.accent} />
      <Text style={[styles.quickLinkLabel, { color: colors.text }]}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  greeting: { fontSize: 24, fontWeight: '800' },
  subGreeting: { fontSize: 14, marginTop: 2, marginBottom: 20 },
  sectionCard: { marginBottom: 24 },
  sectionLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardTitle: { fontSize: 17, fontWeight: '700', marginTop: 4, flexShrink: 1 },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  linkText: { fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12, marginTop: 4 },
  quickLinksRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10, marginBottom: 24 },
  quickLink: { width: '47%', minHeight: 100 },
  quickLinkContent: { alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 18 },
  quickLinkLabel: { fontSize: 13, fontWeight: '600' },
  topicCard: { marginBottom: 12 },
  topicHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
});

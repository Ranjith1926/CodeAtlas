import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { useTheme } from '../../../../theme/ThemeProvider';
import { ScreenContainer } from '../../../../components/ScreenContainer';
import { Card } from '../../../../components/Card';
import { DifficultyBadge } from '../../../../components/DifficultyBadge';
import { EmptyState } from '../../../../components/EmptyState';
import { LoadingSkeleton } from '../../../../components/LoadingSkeleton';
import { SearchBar } from '../../../../components/SearchBar';
import { useTopics } from '../../../../hooks/queries';

export default function TopicsScreen() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const { data: topics, isLoading, isError } = useTopics(categoryId);

  const filtered = topics?.filter((t) => t.title.toLowerCase().includes(query.toLowerCase())) ?? [];

  return (
    <ScreenContainer>
      <Stack.Screen options={{ title: 'Topics' }} />
      <View style={styles.searchWrap}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search topics…" />
      </View>

      {isLoading ? (
        <LoadingSkeleton rows={4} />
      ) : isError || !topics?.length ? (
        <EmptyState icon="list-outline" title="No topics found" />
      ) : filtered.length === 0 ? (
        <EmptyState icon="search-outline" title="No matches" message={`Nothing matches "${query}"`} />
      ) : (
        filtered.map((topic) => (
          <Card
            key={topic.id}
            onPress={() => router.push(`/(tabs)/tutorials/topic/${topic.id}`)}
            style={styles.cardOuter}
            contentStyle={styles.card}
          >
            <View style={styles.rowHeader}>
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

const styles = StyleSheet.create({
  searchWrap: { marginBottom: 16 },
  cardOuter: { marginBottom: 12 },
  card: { gap: 6 },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', flexShrink: 1 },
});

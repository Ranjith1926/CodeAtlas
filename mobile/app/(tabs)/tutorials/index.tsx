import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../../theme/ThemeProvider';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { Card } from '../../../components/Card';
import { DynamicIcon } from '../../../components/DynamicIcon';
import { EmptyState } from '../../../components/EmptyState';
import { LoadingSkeleton } from '../../../components/LoadingSkeleton';
import { useLanguages } from '../../../hooks/queries';
import { useQueryClient } from '@tanstack/react-query';

export default function LanguagesScreen() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const { data: languages, isLoading, isError } = useLanguages();

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['languages'] });
    setRefreshing(false);
  };

  return (
    <ScreenContainer onRefresh={onRefresh} refreshing={refreshing}>
      <Text style={[styles.title, { color: colors.text }]}>Choose a language</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        Pick a language to explore its tutorials, from basics to advanced topics.
      </Text>

      {isLoading ? (
        <LoadingSkeleton rows={4} />
      ) : isError || !languages?.length ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="Couldn't load languages"
          message="Check your connection and pull to refresh."
        />
      ) : (
        <View style={styles.grid}>
          {languages.map((lang) => (
            <Card
              key={lang.id}
              onPress={() => router.push(`/(tabs)/tutorials/${lang.code}`)}
              style={styles.langCard}
              contentStyle={styles.langCardContent}
              accessibilityLabel={`${lang.name}: ${lang.description}`}
            >
              <DynamicIcon name={lang.iconName} size={28} color={colors.accent} />
              <Text style={[styles.langName, { color: colors.text }]}>{lang.name}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }} numberOfLines={2}>
                {lang.description}
              </Text>
            </Card>
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  langCard: { width: '47%', minHeight: 110 },
  langCardContent: { gap: 6 },
  langName: { fontSize: 16, fontWeight: '700', marginTop: 2 },
});

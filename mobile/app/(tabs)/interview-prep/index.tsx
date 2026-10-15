import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../../theme/ThemeProvider';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { Card } from '../../../components/Card';
import { DynamicIcon } from '../../../components/DynamicIcon';
import { EmptyState } from '../../../components/EmptyState';
import { LoadingSkeleton } from '../../../components/LoadingSkeleton';
import { useLanguages } from '../../../hooks/queries';

export default function InterviewPrepLanguagesScreen() {
  const { colors } = useTheme();
  const { data: languages, isLoading, isError } = useLanguages();

  return (
    <ScreenContainer>
      <Text style={[styles.title, { color: colors.text }]}>Interview Prep</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        Pick a language to practice common interview questions by topic.
      </Text>

      {isLoading ? (
        <LoadingSkeleton rows={4} />
      ) : isError || !languages?.length ? (
        <EmptyState icon="cloud-offline-outline" title="Couldn't load languages" />
      ) : (
        <View style={styles.grid}>
          {languages.map((lang) => (
            <Card
              key={lang.id}
              onPress={() => router.push(`/(tabs)/interview-prep/${lang.code}`)}
              style={styles.langCard}
              contentStyle={styles.langCardContent}
            >
              <DynamicIcon name={lang.iconName} size={26} color={colors.accent} />
              <Text style={[styles.langName, { color: colors.text }]}>{lang.name}</Text>
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
  langCard: { width: '47%', minHeight: 90 },
  langCardContent: { gap: 6 },
  langName: { fontSize: 16, fontWeight: '700' },
});

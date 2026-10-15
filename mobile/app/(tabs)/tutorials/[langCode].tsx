import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeProvider';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { Card } from '../../../components/Card';
import { EmptyState } from '../../../components/EmptyState';
import { LoadingSkeleton } from '../../../components/LoadingSkeleton';
import { useCategories } from '../../../hooks/queries';

export default function CategoriesScreen() {
  const { langCode } = useLocalSearchParams<{ langCode: string }>();
  const { colors } = useTheme();
  const { data: categories, isLoading, isError } = useCategories(langCode);

  return (
    <ScreenContainer>
      <Stack.Screen options={{ title: langCode?.toUpperCase() ?? 'Categories' }} />
      <Text style={[styles.title, { color: colors.text }]}>Categories</Text>

      {isLoading ? (
        <LoadingSkeleton rows={4} />
      ) : isError || !categories?.length ? (
        <EmptyState icon="folder-open-outline" title="No categories found" />
      ) : (
        categories.map((cat) => (
          <Card
            key={cat.id}
            onPress={() => router.push(`/(tabs)/tutorials/category/${cat.id}`)}
            style={styles.rowOuter}
            contentStyle={styles.row}
          >
            <Text style={[styles.rowTitle, { color: colors.text }]}>{cat.name}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </Card>
        ))
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '800', marginBottom: 16 },
  rowOuter: { marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowTitle: { fontSize: 16, fontWeight: '600' },
});

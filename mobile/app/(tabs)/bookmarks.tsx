import React from 'react';
import { Stack, router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../theme/ThemeProvider';
import { ScreenContainer } from '../../components/ScreenContainer';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { useBookmarks, useLesson, useInterviewQuestion } from '../../hooks/queries';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { removeBookmarkLocal } from '../../data/userdata';
import { Bookmark } from '../../types/models';

export default function BookmarksScreen() {
  const { colors } = useTheme();
  const { data: bookmarks, isLoading } = useBookmarks();

  return (
    <ScreenContainer topInset>
      <Stack.Screen options={{ title: 'Bookmarks' }} />
      <Text style={[styles.title, { color: colors.text }]}>Your bookmarks</Text>

      {isLoading ? (
        <LoadingSkeleton rows={4} />
      ) : !bookmarks?.length ? (
        <EmptyState
          icon="bookmark-outline"
          title="No bookmarks yet"
          message="Bookmark lessons and interview questions to find them here."
        />
      ) : (
        bookmarks.map((b) => <BookmarkRow key={b.id} bookmark={b} />)
      )}
    </ScreenContainer>
  );
}

function BookmarkRow({ bookmark }: { bookmark: Bookmark }) {
  const { colors } = useTheme();
  const isOnline = useNetworkStatus();
  const queryClient = useQueryClient();

  const lessonQuery = useLesson(bookmark.contentType === 'Lesson' ? bookmark.contentId : undefined);
  const questionQuery = useInterviewQuestion(
    bookmark.contentType === 'InterviewQuestion' ? bookmark.contentId : undefined
  );

  const title =
    bookmark.contentType === 'Lesson' ? lessonQuery.data?.title : questionQuery.data?.question;
  const isLoadingTitle = bookmark.contentType === 'Lesson' ? lessonQuery.isLoading : questionQuery.isLoading;

  const onPress = () => {
    if (bookmark.contentType === 'Lesson') {
      router.push(`/(tabs)/tutorials/lesson/${bookmark.contentId}`);
    } else {
      router.push(`/(tabs)/interview-prep/question/${bookmark.contentId}`);
    }
  };

  const onRemove = async () => {
    await removeBookmarkLocal(bookmark.id, isOnline);
    queryClient.invalidateQueries({ queryKey: ['bookmarks-local'] });
  };

  return (
    <Card onPress={onPress} style={styles.rowOuter} contentStyle={styles.row}>
      <View style={styles.rowContent}>
        <Ionicons
          name={bookmark.contentType === 'Lesson' ? 'book-outline' : 'help-circle-outline'}
          size={20}
          color={colors.accent}
        />
        <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={2}>
          {isLoadingTitle ? 'Loading…' : title ?? 'Untitled'}
        </Text>
      </View>
      <Ionicons name="trash-outline" size={20} color={colors.danger} onPress={onRemove} />
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', marginBottom: 16 },
  rowOuter: { marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  rowContent: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600', flexShrink: 1 },
});

import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../../theme/ThemeProvider';
import { ScreenContainer } from '../../../components/ScreenContainer';
import { Card } from '../../../components/Card';
import { EmptyState } from '../../../components/EmptyState';
import { LoadingSkeleton } from '../../../components/LoadingSkeleton';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { useChatMessages, useChatSessions } from '../../../hooks/queries';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';
import * as chatRepo from '../../../data/chat';
import { ChatSession } from '../../../types/models';

export default function ChatSessionsScreen() {
  const { colors } = useTheme();
  const { data: sessions, isLoading, isError } = useChatSessions();

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>AI Tutor</Text>
        <PrimaryButton title="New chat" onPress={() => router.push('/(tabs)/ai-tutor/new')} />
      </View>

      {isLoading ? (
        <LoadingSkeleton rows={4} />
      ) : isError ? (
        <EmptyState icon="cloud-offline-outline" title="Couldn't load conversations" message="Showing offline history, if any." />
      ) : !sessions?.length ? (
        <EmptyState
          icon="sparkles-outline"
          title="No conversations yet"
          message="Start a new chat to ask the AI tutor anything."
        />
      ) : (
        sessions.map((session) => <SessionRow key={session.id} session={session} />)
      )}
    </ScreenContainer>
  );
}

// Sessions have no server-generated title, so every row used to read the
// same literal "Untitled conversation" — indistinguishable from each other.
// Fall back to the session's first message (what ChatGPT-style history
// lists typically show) and a date, so the list is actually useful.
function SessionRow({ session }: { session: ChatSession }) {
  const { colors } = useTheme();
  const isOnline = useNetworkStatus();
  const queryClient = useQueryClient();
  const { data: messages } = useChatMessages(session.id);
  const firstMessage = messages?.[0]?.content?.trim();
  const displayTitle = session.title || firstMessage || 'New conversation';
  const dateLabel = session.createdAt
    ? new Date(session.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : null;

  const onDelete = () => {
    Alert.alert('Delete conversation?', 'This chat history will be permanently deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await chatRepo.deleteSession(session.id, isOnline);
          queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
        },
      },
    ]);
  };

  return (
    <Card
      onPress={() => router.push(`/(tabs)/ai-tutor/${session.id}`)}
      style={styles.rowOuter}
      contentStyle={styles.row}
    >
      <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.accent} />
      <View style={styles.rowTextWrap}>
        <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
          {displayTitle}
        </Text>
        {dateLabel ? <Text style={[styles.rowDate, { color: colors.textMuted }]}>{dateLabel}</Text> : null}
      </View>
      <Ionicons
        name="trash-outline"
        size={20}
        color={colors.danger}
        onPress={onDelete}
        accessibilityRole="button"
        accessibilityLabel="Delete conversation"
        hitSlop={8}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12 },
  title: { fontSize: 22, fontWeight: '800' },
  rowOuter: { marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowTextWrap: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  rowDate: { fontSize: 12 },
});

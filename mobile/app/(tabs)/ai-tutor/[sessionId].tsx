import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../../theme/ThemeProvider';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';
import { useChatMessages } from '../../../hooks/queries';
import { ChatBubble } from '../../../components/ChatBubble';
import { LoadingSkeleton } from '../../../components/LoadingSkeleton';
import * as chatRepo from '../../../data/chat';
import { streamChatMessage } from '../../../api/sse';
import { ChatMessage } from '../../../types/models';

export default function ChatScreen() {
  const params = useLocalSearchParams<{ sessionId: string; contextTopicId?: string; starter?: string }>();
  const { colors } = useTheme();
  const isOnline = useNetworkStatus();
  const queryClient = useQueryClient();
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const isNew = params.sessionId === 'new';
  const { data: serverMessages, isLoading } = useChatMessages(isNew ? undefined : params.sessionId);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState(params.starter ?? '');
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [creatingSession, setCreatingSession] = useState(isNew);

  // "new" sessions: create it on the server, then swap the URL to the real
  // id so the rest of this screen behaves identically either way.
  useEffect(() => {
    if (!isNew) return;
    let cancelled = false;
    (async () => {
      try {
        const session = await chatRepo.createSession(undefined, params.contextTopicId);
        if (cancelled) return;
        queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
        router.replace({
          pathname: '/(tabs)/ai-tutor/[sessionId]',
          params: { sessionId: session.id, starter: params.starter ?? '' },
        });
      } catch {
        if (!cancelled) setCreatingSession(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew]);

  useEffect(() => {
    if (serverMessages) setMessages(serverMessages);
  }, [serverMessages]);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, []);

  const handleSend = useCallback(async () => {
    const content = input.trim();
    if (!content || !isOnline || isNew || streamingId) return;
    setInput('');

    const userMessage = await chatRepo.addLocalMessage(params.sessionId, 'User', content);
    const assistantMessage = await chatRepo.addLocalMessage(params.sessionId, 'Assistant', '');
    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setStreamingId(assistantMessage.id);
    scrollToEnd();

    let accumulated = '';
    streamChatMessage(params.sessionId, content, {
      onDelta: (delta) => {
        accumulated += delta;
        const snapshot = accumulated;
        setMessages((prev) => prev.map((m) => (m.id === assistantMessage.id ? { ...m, content: snapshot } : m)));
        void chatRepo.updateLocalMessageContent(assistantMessage.id, snapshot);
        scrollToEnd();
      },
      onDone: () => {
        setStreamingId(null);
        void chatRepo.markMessageSynced(assistantMessage.id);
        void chatRepo.markMessageSynced(userMessage.id);
      },
      onError: () => {
        setStreamingId(null);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessage.id
              ? { ...m, content: accumulated || '_Sorry, something went wrong. Please try again._' }
              : m
          )
        );
      },
    });
  }, [input, isOnline, isNew, streamingId, params.sessionId, scrollToEnd]);

  if (isNew && creatingSession) {
    return (
      <View style={[styles.flex, styles.center, { backgroundColor: colors.background }]}>
        <LoadingSkeleton rows={2} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <Stack.Screen options={{ title: 'AI Tutor' }} />

      {isLoading ? (
        <LoadingSkeleton rows={4} />
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => <ChatBubble message={item} isStreaming={item.id === streamingId} />}
          onContentSizeChange={scrollToEnd}
          ListEmptyComponent={
            <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 40 }}>
              Ask the AI tutor anything about what you&apos;re learning.
            </Text>
          }
        />
      )}

      {!isOnline && (
        <View style={[styles.offlineNotice, { backgroundColor: colors.surfaceAlt }]}>
          <Ionicons name="cloud-offline-outline" size={16} color={colors.textMuted} />
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>
            You&apos;re offline — reconnect to send a new message.
          </Text>
        </View>
      )}

      <View style={[styles.inputRow, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask anything…"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceAlt }]}
          multiline
          editable={isOnline && !isNew}
          accessibilityLabel="Message"
        />
        <Pressable
          onPress={handleSend}
          disabled={!isOnline || isNew || !input.trim() || Boolean(streamingId)}
          accessibilityRole="button"
          accessibilityLabel="Send message"
          style={({ pressed }) => [
            styles.sendBtn,
            {
              backgroundColor: colors.primary,
              opacity: !isOnline || isNew || !input.trim() || streamingId ? 0.4 : pressed ? 0.85 : 1,
            },
          ]}
        >
          <Ionicons name="send" size={18} color={colors.primaryText} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 16, flexGrow: 1 },
  offlineNotice: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 6 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: { flex: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, maxHeight: 120, fontSize: 15 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});

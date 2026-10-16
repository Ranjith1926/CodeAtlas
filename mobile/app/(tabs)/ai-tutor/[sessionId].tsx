import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
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
import * as ImagePicker from 'expo-image-picker';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../../theme/ThemeProvider';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';
import { useChatMessages } from '../../../hooks/queries';
import { ChatBubble } from '../../../components/ChatBubble';
import { LoadingSkeleton } from '../../../components/LoadingSkeleton';
import * as chatRepo from '../../../data/chat';
import { streamChatMessage } from '../../../api/sse';
import { ChatMessage } from '../../../types/models';

interface PendingImage {
  uri: string;
  base64: string;
  mimeType: string;
}

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
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const [capturing, setCapturing] = useState(false);
  // Created lazily on first send (see handleSend) and reused across retries
  // after a failed send, so a flaky first attempt doesn't leave behind one
  // orphan session per retry.
  const draftSessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (serverMessages) setMessages(serverMessages);
  }, [serverMessages]);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, []);

  const handleCapturePhoto = useCallback(async () => {
    if (capturing) return;
    setCapturing(true);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Camera access needed',
          'Allow camera access for CodeAtlas in your device settings to capture a photo for the AI tutor.'
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.5, base64: true });
      const asset = result.canceled ? null : result.assets[0];
      if (!asset?.base64) return;
      setPendingImage({ uri: asset.uri, base64: asset.base64, mimeType: asset.mimeType ?? 'image/jpeg' });
    } finally {
      setCapturing(false);
    }
  }, [capturing]);

  const handleSend = useCallback(async () => {
    const content = input.trim();
    const image = pendingImage;
    if ((!content && !image) || !isOnline || streamingId) return;
    setInput('');
    setPendingImage(null);

    let sessionId = params.sessionId;
    if (isNew) {
      if (!draftSessionIdRef.current) {
        const session = await chatRepo.createSession(undefined, params.contextTopicId);
        draftSessionIdRef.current = session.id;
      }
      sessionId = draftSessionIdRef.current;
    }

    // The backend requires non-empty content; a bare photo gets a sensible
    // default prompt so the learner isn't forced to type anything first.
    const messageText = content || "What's shown in this photo?";

    const userMessage = await chatRepo.addLocalMessage(sessionId, 'User', messageText, image?.uri);
    const assistantMessage = await chatRepo.addLocalMessage(sessionId, 'Assistant', '');
    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setStreamingId(assistantMessage.id);
    scrollToEnd();

    let accumulated = '';
    streamChatMessage(
      sessionId,
      messageText,
      {
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
          // Only now swap the URL from the "new" draft placeholder to the real
          // session id — the server has actually persisted this exchange by
          // this point. Doing this right after creating the session instead
          // (before the message was even sent) flips `isNew` false and enables
          // the server-messages fetch while the reply is still streaming; that
          // fetch would see a session with zero messages yet and wipe the
          // optimistic UI with an empty list.
          if (isNew) {
            queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
            router.replace({ pathname: '/(tabs)/ai-tutor/[sessionId]', params: { sessionId } });
          }
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
          // Leave the URL on "new" so the screen keeps showing this local,
          // unsynced state rather than racing a now-enabled server fetch that
          // may see an incomplete (or empty) version of this turn. The session
          // itself is kept in draftSessionIdRef so a retry reuses it instead
          // of creating another one.
        },
      },
      image ? { base64: image.base64, mimeType: image.mimeType } : undefined
    );
  }, [
    input,
    pendingImage,
    isOnline,
    isNew,
    streamingId,
    params.sessionId,
    params.contextTopicId,
    queryClient,
    scrollToEnd,
  ]);

  const handleDelete = useCallback(() => {
    Alert.alert('Delete conversation?', 'This chat history will be permanently deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await chatRepo.deleteSession(params.sessionId, isOnline);
          queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
          router.replace('/(tabs)/ai-tutor');
        },
      },
    ]);
  }, [params.sessionId, isOnline, queryClient]);

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Stack.Screen
        options={{
          title: 'AI Tutor',
          // Reaching this screen via a cross-tab deep link (e.g. "Ask AI about
          // this topic" from Tutorials) makes it the root of this tab's own
          // stack, so there's no in-stack history to pop — the default header
          // then omits the back button entirely. Always show one and fall
          // back to the session list when there's nothing to go back to.
          headerLeft: () => (
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/ai-tutor'))}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Back"
              style={styles.backBtn}
            >
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </Pressable>
          ),
          headerRight: isNew
            ? undefined
            : () => (
                <Pressable
                  onPress={handleDelete}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Delete conversation"
                  style={styles.backBtn}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.danger} />
                </Pressable>
              ),
        }}
      />

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

      {pendingImage && (
        <View style={[styles.previewRow, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
          <Image source={{ uri: pendingImage.uri }} style={styles.previewThumb} />
          <Text style={{ color: colors.textMuted, fontSize: 12, flex: 1 }} numberOfLines={2}>
            Photo attached — it'll be sent with your next message.
          </Text>
          <Pressable
            onPress={() => setPendingImage(null)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Remove photo"
          >
            <Ionicons name="close-circle" size={22} color={colors.textMuted} />
          </Pressable>
        </View>
      )}

      <View style={[styles.inputRow, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
        <Pressable
          onPress={handleCapturePhoto}
          disabled={!isOnline || capturing}
          accessibilityRole="button"
          accessibilityLabel="Capture photo"
          style={({ pressed }) => [
            styles.cameraBtn,
            { backgroundColor: colors.surfaceAlt, opacity: !isOnline ? 0.4 : pressed ? 0.7 : 1 },
          ]}
        >
          <Ionicons name="camera-outline" size={22} color={colors.text} />
        </Pressable>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask anything…"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceAlt }]}
          multiline
          editable={isOnline}
          accessibilityLabel="Message"
        />
        <Pressable
          onPress={handleSend}
          disabled={!isOnline || (!input.trim() && !pendingImage) || Boolean(streamingId)}
          accessibilityRole="button"
          accessibilityLabel="Send message"
          style={({ pressed }) => [
            styles.sendBtn,
            {
              backgroundColor: colors.primary,
              opacity: !isOnline || (!input.trim() && !pendingImage) || streamingId ? 0.4 : pressed ? 0.85 : 1,
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
  cameraBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  backBtn: { paddingHorizontal: 4, paddingVertical: 4 },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  previewThumb: { width: 44, height: 44, borderRadius: 8 },
});

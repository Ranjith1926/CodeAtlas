import React from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { MarkdownContent } from './MarkdownContent';
import { ChatMessage } from '../types/models';

interface ChatBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

export function ChatBubble({ message, isStreaming }: ChatBubbleProps) {
  const { colors } = useTheme();
  const isUser = message.role === 'User';

  return (
    <View style={[styles.row, isUser ? styles.rowRight : styles.rowLeft]}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isUser ? colors.primary : colors.surfaceAlt,
            borderTopRightRadius: isUser ? 4 : 16,
            borderTopLeftRadius: isUser ? 16 : 4,
          },
        ]}
      >
        {message.imageUri ? (
          <Image source={{ uri: message.imageUri }} style={styles.image} resizeMode="cover" />
        ) : null}
        {isUser ? (
          message.content ? <Text style={{ color: colors.primaryText, fontSize: 15 }}>{message.content}</Text> : null
        ) : message.content ? (
          <MarkdownContent content={message.content} />
        ) : isStreaming ? (
          <ActivityIndicator size="small" color={colors.textMuted} />
        ) : null}
        {isStreaming && message.content ? (
          <View style={styles.typingRow}>
            <ActivityIndicator size="small" color={colors.textMuted} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginVertical: 6, flexDirection: 'row' },
  rowLeft: { justifyContent: 'flex-start' },
  rowRight: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '85%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  typingRow: { marginTop: 4, alignItems: 'flex-start' },
  image: { width: 200, height: 150, borderRadius: 10, marginBottom: 6 },
});

import React, { useMemo } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import Markdown, { ASTNode, RenderRules } from 'react-native-markdown-display';
import { useTheme } from '../theme/ThemeProvider';
import { ThemeColors } from '../theme/colors';
import { CodeBlock } from './CodeBlock';

interface MarkdownContentProps {
  content: string;
}

// react-native-markdown-display's ASTNode typings don't declare `sourceInfo`
// (the fenced code block's language tag, e.g. "```javascript"), but it's
// present on the node at runtime — it comes straight from markdown-it's
// token.info.
type FenceNode = ASTNode & { sourceInfo?: string };

function buildRules(colors: ThemeColors): RenderRules {
  return {
    fence: (node) => {
      const fenceNode = node as FenceNode;
      let content = fenceNode.content ?? '';
      if (content.endsWith('\n')) content = content.slice(0, -1);
      return <CodeBlock key={node.key} code={content} language={fenceNode.sourceInfo || 'javascript'} />;
    },
    code_block: (node) => {
      let content = node.content ?? '';
      if (content.endsWith('\n')) content = content.slice(0, -1);
      return <CodeBlock key={node.key} code={content} language="javascript" />;
    },
    code_inline: (node) => (
      <Text
        key={node.key}
        style={{
          fontFamily: 'monospace',
          backgroundColor: colors.surfaceAlt,
          color: colors.text,
          paddingHorizontal: 4,
          borderRadius: 4,
        }}
      >
        {node.content}
      </Text>
    ),
  };
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  const { colors } = useTheme();
  const rules = useMemo(() => buildRules(colors), [colors]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        body: { color: colors.text, fontSize: 15, lineHeight: 23 },
        heading1: { color: colors.text, fontSize: 24, fontWeight: '800', marginTop: 16, marginBottom: 8 },
        heading2: { color: colors.text, fontSize: 20, fontWeight: '700', marginTop: 14, marginBottom: 6 },
        heading3: { color: colors.text, fontSize: 17, fontWeight: '700', marginTop: 12, marginBottom: 6 },
        strong: { fontWeight: '700' },
        link: { color: colors.accent },
        blockquote: {
          backgroundColor: colors.surfaceAlt,
          borderLeftColor: colors.accent,
          borderLeftWidth: 3,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 6,
        },
        bullet_list: { marginVertical: 4 },
        ordered_list: { marginVertical: 4 },
        hr: { backgroundColor: colors.border, height: 1 },
        table: { borderColor: colors.border },
        th: { color: colors.text, fontWeight: '700' },
        td: { color: colors.text },
      }),
    [colors]
  );

  return (
    <View>
      <Markdown style={styles} rules={rules} onLinkPress={(url) => {
        Linking.openURL(url).catch(() => undefined);
        return false;
      }}>
        {content}
      </Markdown>
    </View>
  );
}

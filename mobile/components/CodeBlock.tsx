import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import Prism from 'prismjs';
// Core-only grammars (no DOM plugins): clike is required by both javascript and csharp.
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-csharp';
import { useTheme } from '../theme/ThemeProvider';

export type CodeLanguage = 'javascript' | 'csharp' | 'js' | 'cs' | string;

interface CodeBlockProps {
  code: string;
  language?: CodeLanguage;
  /** Optional "Output:" panel shown below the code (e.g. a lesson's expectedOutput). */
  expectedOutput?: string;
}

// Token-type -> color. Chosen for contrast against the brand's dark code background.
const TOKEN_COLORS: Record<string, string> = {
  comment: '#7C93AC',
  prolog: '#7C93AC',
  doctype: '#7C93AC',
  cdata: '#7C93AC',
  punctuation: '#C3D4E6',
  property: '#FFCA70',
  tag: '#FF8A8A',
  boolean: '#FFCA70',
  number: '#FFCA70',
  constant: '#FFCA70',
  symbol: '#FFCA70',
  selector: '#47D7AC',
  'attr-name': '#FFCA70',
  string: '#47D7AC',
  char: '#47D7AC',
  builtin: '#79D7FF',
  keyword: '#79B6FF',
  'class-name': '#FFCA70',
  function: '#C9A8FF',
  operator: '#F5F8FC',
  variable: '#F5F8FC',
  regex: '#47D7AC',
  important: '#FF8A8A',
  default: '#F5F8FC',
};

function normalizeLanguage(language?: CodeLanguage): string {
  const lang = (language ?? 'javascript').toLowerCase();
  if (lang === 'cs' || lang === 'c#' || lang === 'csharp') return 'csharp';
  if (lang === 'js' || lang === 'javascript') return 'javascript';
  return Prism.languages[lang] ? lang : 'javascript';
}

type PrismContent = string | Prism.Token | (string | Prism.Token)[];

function renderContent(content: PrismContent, keyPrefix: string): React.ReactNode {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.map((child, i) => (
      <React.Fragment key={`${keyPrefix}-${i}`}>{renderNode(child, `${keyPrefix}-${i}`)}</React.Fragment>
    ));
  }
  return renderNode(content, keyPrefix);
}

function renderNode(node: string | Prism.Token, key: string): React.ReactNode {
  if (typeof node === 'string') {
    return <Text style={{ color: TOKEN_COLORS.default }}>{node}</Text>;
  }
  const color = TOKEN_COLORS[node.type] ?? TOKEN_COLORS.default;
  return <Text style={{ color }}>{renderContent(node.content as PrismContent, key)}</Text>;
}

export function CodeBlock({ code, language, expectedOutput }: CodeBlockProps) {
  const { colors } = useTheme();
  const [copied, setCopied] = useState(false);

  const tokens = useMemo(() => {
    const grammarName = normalizeLanguage(language);
    const grammar = Prism.languages[grammarName] ?? Prism.languages.clike;
    try {
      return Prism.tokenize(code, grammar);
    } catch {
      return [code];
    }
  }, [code, language]);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <View style={[styles.wrap, { backgroundColor: colors.codeBackground }]}>
      <View style={styles.toolbar}>
        <Text style={styles.langLabel}>{normalizeLanguage(language)}</Text>
        <Pressable
          onPress={handleCopy}
          accessibilityRole="button"
          accessibilityLabel="Copy code to clipboard"
          hitSlop={8}
          style={styles.copyBtn}
        >
          <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={16} color={colors.codeText} />
          <Text style={styles.copyLabel}>{copied ? 'Copied' : 'Copy'}</Text>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Text style={styles.code} selectable>
          {tokens.map((t, i) => (
            <React.Fragment key={i}>{renderNode(t, String(i))}</React.Fragment>
          ))}
        </Text>
      </ScrollView>
      {expectedOutput ? (
        <View style={[styles.outputBox, { borderTopColor: 'rgba(245,248,252,0.15)' }]}>
          <Text style={styles.outputLabel}>Output:</Text>
          <Text style={styles.outputText}>{expectedOutput}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 8,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  langLabel: {
    color: '#9FB3C8',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  copyLabel: {
    color: '#F5F8FC',
    fontSize: 12,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 19,
    padding: 12,
  },
  outputBox: {
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: 12,
  },
  outputLabel: {
    color: '#9FB3C8',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  outputText: {
    color: '#F5F8FC',
    fontFamily: 'monospace',
    fontSize: 13,
  },
});

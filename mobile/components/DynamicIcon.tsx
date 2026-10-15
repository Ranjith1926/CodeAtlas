import React from 'react';
import { Ionicons } from '@expo/vector-icons';

/**
 * Renders an Ionicons glyph by name coming from untrusted/dynamic backend
 * data (e.g. Language.iconName), falling back to a generic icon when the
 * name isn't a recognized glyph.
 */
export function DynamicIcon({ name, size = 24, color }: { name: string; size?: number; color: string }) {
  const glyphName = (Ionicons.glyphMap as Record<string, unknown>)[name]
    ? (name as keyof typeof Ionicons.glyphMap)
    : 'code-slash';
  return <Ionicons name={glyphName} size={size} color={color} />;
}

import React, { useCallback, useEffect, useState } from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { addBookmarkLocal, findBookmarkId, removeBookmarkLocal } from '../data/userdata';
import { ContentType } from '../types/models';

interface BookmarkButtonProps {
  contentType: ContentType;
  contentId: string;
  size?: number;
}

export function BookmarkButton({ contentType, contentId, size = 22 }: BookmarkButtonProps) {
  const { colors } = useTheme();
  const isOnline = useNetworkStatus();
  const [bookmarkId, setBookmarkId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    findBookmarkId(contentType, contentId).then((id) => {
      if (mounted) setBookmarkId(id);
    });
    return () => {
      mounted = false;
    };
  }, [contentType, contentId]);

  const toggle = useCallback(async () => {
    if (bookmarkId) {
      const idToRemove = bookmarkId;
      setBookmarkId(null);
      await removeBookmarkLocal(idToRemove, isOnline);
    } else {
      const bookmark = await addBookmarkLocal(contentType, contentId, isOnline);
      setBookmarkId(bookmark.id);
    }
  }, [bookmarkId, contentType, contentId, isOnline]);

  return (
    <Pressable
      onPress={toggle}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={bookmarkId ? 'Remove bookmark' : 'Add bookmark'}
    >
      <Ionicons
        name={bookmarkId ? 'bookmark' : 'bookmark-outline'}
        size={size}
        color={bookmarkId ? colors.accent : colors.textMuted}
      />
    </Pressable>
  );
}

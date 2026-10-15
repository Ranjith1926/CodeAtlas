import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../context/AuthContext';
import { ScreenContainer } from '../../components/ScreenContainer';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ThemeMode } from '../../theme/colors';
import { APP_NAME, APP_TAGLINE } from '../../constants/config';
import { DownloadedTopic, deleteDownloadedTopic, listDownloadedTopics } from '../../data/downloads';

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { mode: 'light', label: 'Light', icon: 'sunny-outline' },
  { mode: 'dark', label: 'Dark', icon: 'moon-outline' },
  { mode: 'system', label: 'System', icon: 'phone-portrait-outline' },
];

export default function ProfileScreen() {
  const { colors, mode, setMode } = useTheme();
  const { user, logout } = useAuth();
  const [downloads, setDownloads] = useState<DownloadedTopic[]>([]);

  const refreshDownloads = () => listDownloadedTopics().then(setDownloads);

  useEffect(() => {
    refreshDownloads();
  }, []);

  const handleDelete = async (topicId: string) => {
    await deleteDownloadedTopic(topicId);
    refreshDownloads();
  };

  return (
    <ScreenContainer topInset>
      <View style={styles.userCard}>
        <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
          <Text style={styles.avatarLetter}>{(user?.displayName || user?.email || '?')[0]?.toUpperCase()}</Text>
        </View>
        <View>
          <Text style={[styles.name, { color: colors.text }]}>{user?.displayName || 'CodeAtlas learner'}</Text>
          <Text style={{ color: colors.textMuted }}>{user?.email}</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
      <View style={styles.themeRow}>
        {THEME_OPTIONS.map((opt) => (
          <Pressable
            key={opt.mode}
            onPress={() => setMode(opt.mode)}
            accessibilityRole="button"
            accessibilityState={{ selected: mode === opt.mode }}
            style={[
              styles.themeOption,
              { borderColor: mode === opt.mode ? colors.accent : colors.border, backgroundColor: colors.surface },
            ]}
          >
            <Ionicons name={opt.icon} size={20} color={mode === opt.mode ? colors.accent : colors.textMuted} />
            <Text style={{ color: mode === opt.mode ? colors.text : colors.textMuted, fontSize: 13 }}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Downloaded content</Text>
      {downloads.length === 0 ? (
        <EmptyState icon="cloud-download-outline" title="Nothing downloaded yet" message="Download a topic from the lesson reader to read it offline." />
      ) : (
        downloads.map((d) => (
          <Card key={d.topicId} style={styles.downloadRowOuter} contentStyle={styles.downloadRow}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '600' }}>{d.title}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                Downloaded {new Date(d.downloadedAt).toLocaleDateString()}
              </Text>
            </View>
            <Pressable onPress={() => handleDelete(d.topicId)} accessibilityRole="button" accessibilityLabel={`Delete ${d.title}`}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </Pressable>
          </Card>
        ))
      )}

      <View style={styles.logoutWrap}>
        <PrimaryButton title="Log out" variant="danger" onPress={logout} />
      </View>

      <View style={styles.footer}>
        <Text style={{ color: colors.textMuted, fontSize: 12 }}>
          {APP_NAME} · {APP_TAGLINE}
        </Text>
        <Text style={{ color: colors.textMuted, fontSize: 12 }}>
          Version {Constants.expoConfig?.version ?? '1.0.0'}
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  userCard: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 28 },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 22, fontWeight: '800', color: '#102A43' },
  name: { fontSize: 18, fontWeight: '800' },
  sectionTitle: { fontSize: 15, fontWeight: '800', marginBottom: 12, marginTop: 8 },
  themeRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  themeOption: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 14, borderRadius: 12, borderWidth: 1 },
  downloadRowOuter: { marginBottom: 10 },
  downloadRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoutWrap: { marginTop: 24, marginBottom: 24 },
  footer: { alignItems: 'center', gap: 2, paddingBottom: 24 },
});

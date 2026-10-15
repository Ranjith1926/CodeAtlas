import React, { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../../components/Logo';
import { FormInput } from '../../components/FormInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ApiError } from '../../api/client';

export default function RegisterScreen() {
  const { colors } = useTheme();
  const { register } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await register(email.trim(), password, displayName.trim() || undefined);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create your account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior="padding"
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Logo size={48} inverted={colors.background !== '#F5F8FC'} />
          <Text style={[styles.title, { color: colors.text }]}>Create your account</Text>
        </View>

        <FormInput label="Display name (optional)" value={displayName} onChangeText={setDisplayName} placeholder="Jordan Lee" />
        <FormInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          placeholder="you@example.com"
        />
        <FormInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          placeholder="At least 8 characters"
        />
        {error ? <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text> : null}

        <PrimaryButton title="Sign up" onPress={onSubmit} loading={loading} />

        <View style={styles.footerRow}>
          <Text style={{ color: colors.textMuted }}>Already have an account? </Text>
          <Link href="/(auth)/login" style={{ color: colors.accent, fontWeight: '700' }} replace>
            Log in
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40, maxWidth: 420, width: '100%', alignSelf: 'center' },
  header: { alignItems: 'center', marginBottom: 28, gap: 8 },
  title: { fontSize: 22, fontWeight: '800' },
  errorText: { marginBottom: 12, fontSize: 13, textAlign: 'center' },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
});

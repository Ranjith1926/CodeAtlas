import React, { useState } from 'react';
import { KeyboardAvoidingView, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../../components/Logo';
import { FormInput } from '../../components/FormInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { APP_NAME, APP_TAGLINE } from '../../constants/config';
import { ApiError } from '../../api/client';

export default function LoginScreen() {
  const { colors } = useTheme();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not log in. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior="padding"
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Logo size={56} inverted={colors.background !== '#F5F8FC'} />
          <Text style={[styles.title, { color: colors.text }]}>{APP_NAME}</Text>
          <Text style={[styles.tagline, { color: colors.textMuted }]}>{APP_TAGLINE}</Text>
        </View>

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
          placeholder="••••••••"
        />
        {error ? <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text> : null}

        <PrimaryButton title="Log in" onPress={onSubmit} loading={loading} />

        <Link href="/(auth)/forgot-password" style={[styles.link, { color: colors.accent }]}>
          Forgot password?
        </Link>

        <View style={styles.footerRow}>
          <Text style={{ color: colors.textMuted }}>Don&apos;t have an account? </Text>
          <Link href="/(auth)/register" style={{ color: colors.accent, fontWeight: '700' }}>
            Sign up
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, maxWidth: 420, width: '100%', alignSelf: 'center' },
  header: { alignItems: 'center', marginBottom: 32, gap: 4 },
  title: { fontSize: 26, fontWeight: '800', marginTop: 8 },
  tagline: { fontSize: 14 },
  errorText: { marginBottom: 12, fontSize: 13, textAlign: 'center' },
  link: { textAlign: 'center', marginTop: 16, fontSize: 14 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
});

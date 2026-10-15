import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { FormInput } from '../../components/FormInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { apiFetch } from '../../api/client';

/**
 * Known limitation (see README): the backend does not yet implement a
 * forgot-password endpoint. We call a best-effort stub and show the same
 * "check your email" confirmation regardless of the outcome, since
 * revealing whether an email exists would be a minor security leak anyway.
 */
export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = async () => {
    setLoading(true);
    try {
      await apiFetch('/auth/forgot-password', { method: 'POST', body: { email: email.trim() }, auth: false });
    } catch {
      // Intentionally ignored — see module doc comment above.
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <View style={[styles.flex, styles.center, { backgroundColor: colors.background }]}>
        <Ionicons name="mail-outline" size={48} color={colors.accent} />
        <Text style={[styles.title, { color: colors.text }]}>Check your email</Text>
        <Text style={[styles.message, { color: colors.textMuted }]}>
          If an account exists for {email.trim() || 'that address'}, we&apos;ve sent instructions to reset your
          password.
        </Text>
        <PrimaryButton title="Back to login" onPress={() => router.replace('/(auth)/login')} />
      </View>
    );
  }

  return (
    <View style={[styles.flex, styles.center, { backgroundColor: colors.background }]}>
      <View style={styles.form}>
        <Text style={[styles.title, { color: colors.text }]}>Reset your password</Text>
        <Text style={[styles.message, { color: colors.textMuted }]}>
          Enter the email associated with your account and we&apos;ll send you a reset link.
        </Text>
        <FormInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="you@example.com"
        />
        <PrimaryButton title="Send reset link" onPress={onSubmit} loading={loading} />
        <Link href="/(auth)/login" style={[styles.link, { color: colors.accent }]}>
          Back to login
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 12 },
  form: { width: '100%', maxWidth: 420 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 4, textAlign: 'center' },
  message: { fontSize: 14, textAlign: 'center', marginBottom: 16 },
  link: { textAlign: 'center', marginTop: 16, fontSize: 14 },
});

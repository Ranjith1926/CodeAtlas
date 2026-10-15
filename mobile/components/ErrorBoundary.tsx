import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { PrimaryButton } from './PrimaryButton';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render errors anywhere below it and shows a recoverable fallback
 * instead of a blank/crashed screen. Must stay a class component — React has
 * no hook equivalent for getDerivedStateFromError/componentDidCatch.
 *
 * Mounted below StateProvider/ThemeProvider/SafeAreaProvider in app/_layout.tsx
 * so the fallback UI itself can still use useTheme()/safe-area insets.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (__DEV__) {
      console.error('ErrorBoundary caught an error:', error, info.componentStack);
    }
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return <ErrorFallback error={this.state.error} onReset={this.reset} />;
    }
    return this.props.children;
  }
}

function ErrorFallback({ error, onReset }: { error: Error; onReset: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Ionicons name="warning-outline" size={48} color={colors.danger} />
      <Text style={[styles.title, { color: colors.text }]}>Something went wrong</Text>
      <Text style={[styles.message, { color: colors.textMuted }]}>
        {__DEV__ ? error.message : 'An unexpected error occurred. Please try again.'}
      </Text>
      <PrimaryButton title="Try again" onPress={onReset} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 18, fontWeight: '800' },
  message: { fontSize: 14, textAlign: 'center', marginBottom: 8 },
});

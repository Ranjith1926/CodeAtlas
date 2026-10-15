import { useCallback, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppState } from '../state/StateProvider';
import { ThemeColors, ThemeMode, darkColors, lightColors } from './colors';

const STORAGE_KEY = 'codeatlas.themeMode';

interface ThemeContextValue {
  mode: ThemeMode;
  resolvedScheme: 'light' | 'dark';
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
  isLoaded: boolean;
}

/**
 * Public theme hook — same shape as before the Context+useReducer refactor.
 * Reads from the combined app store (state/rootReducer.ts); resolvedScheme/
 * colors stay derived values (pure functions of mode + system scheme), same
 * as before. Hydration from AsyncStorage happens once in StateProvider.
 */
export function useTheme(): ThemeContextValue {
  const { state, dispatch } = useAppState();
  const systemScheme = useColorScheme();
  const { mode, isLoaded } = state.theme;

  const setMode = useCallback((next: ThemeMode) => {
    dispatch({ type: 'theme/setMode', payload: { mode: next } });
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {
      /* non-fatal: preference just won't persist across restarts */
    });
  }, [dispatch]);

  const resolvedScheme: 'light' | 'dark' =
    mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;

  const colors = resolvedScheme === 'dark' ? darkColors : lightColors;

  return useMemo(
    () => ({ mode, resolvedScheme, colors, setMode, isLoaded }),
    [mode, resolvedScheme, colors, setMode, isLoaded]
  );
}

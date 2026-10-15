import React, { Dispatch, createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as api from '../api/endpoints';
import { clearTokens, loadTokens, onForcedLogout } from '../api/tokenStore';
import { wireSyncTriggers } from '../data/syncTrigger';
import { ThemeMode } from '../theme/colors';
import { RootAction, RootState, initialRootState, rootReducer } from './rootReducer';

const THEME_STORAGE_KEY = 'codeatlas.themeMode';

interface StateContextValue {
  state: RootState;
  dispatch: Dispatch<RootAction>;
}

const StateContext = createContext<StateContextValue | undefined>(undefined);

export function StateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(rootReducer, initialRootState);

  // One-time app-wide initialization: hydrate the theme preference, load any
  // persisted auth tokens, and wire the offline-sync / forced-logout listeners.
  // This replaces the separate init effects that used to live in
  // ThemeProvider/AuthProvider — there is now a single owner for store startup.
  useEffect(() => {
    let cancelled = false;

    AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
      if (cancelled) return;
      const mode: ThemeMode = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
      dispatch({ type: 'theme/hydrate', payload: { mode } });
    });

    wireSyncTriggers();
    onForcedLogout(() => {
      void clearTokens();
      dispatch({ type: 'auth/logout' });
    });

    (async () => {
      dispatch({ type: 'auth/initStart' });
      const { accessToken } = await loadTokens();
      if (accessToken) {
        try {
          const me = await api.getMe();
          if (!cancelled) dispatch({ type: 'auth/initComplete', payload: { user: me } });
          return;
        } catch {
          // Token invalid/expired and the silent refresh (handled inside
          // apiFetch) didn't recover it — require a fresh login.
          await clearTokens();
        }
      }
      if (!cancelled) dispatch({ type: 'auth/initComplete', payload: { user: null } });
    })();

    return () => {
      cancelled = true;
      onForcedLogout(null);
    };
  }, []);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <StateContext.Provider value={value}>{children}</StateContext.Provider>;
}

export function useAppState(): StateContextValue {
  const ctx = useContext(StateContext);
  if (!ctx) throw new Error('useAppState must be used within a StateProvider');
  return ctx;
}

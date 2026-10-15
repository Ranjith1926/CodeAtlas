import { useCallback, useMemo } from 'react';
import * as api from '../api/endpoints';
import { saveTokens, clearTokens } from '../api/tokenStore';
import { useAppState } from '../state/StateProvider';
import { User } from '../types/models';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
}

/**
 * Public auth hook — same shape as before the Context+useReducer refactor, so
 * every existing call site keeps working unchanged. Internally it now reads
 * from the combined app store (state/rootReducer.ts) instead of owning its
 * own useState; the one-time token-load/init effect lives in StateProvider.
 */
export function useAuth(): AuthContextValue {
  const { state, dispatch } = useAppState();

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login(email, password);
    await saveTokens(res.accessToken, res.refreshToken);
    dispatch({ type: 'auth/loginSuccess', payload: { user: res.user } });
  }, [dispatch]);

  const register = useCallback(async (email: string, password: string, displayName?: string) => {
    const res = await api.register(email, password, displayName);
    await saveTokens(res.accessToken, res.refreshToken);
    dispatch({ type: 'auth/loginSuccess', payload: { user: res.user } });
  }, [dispatch]);

  const logout = useCallback(async () => {
    await clearTokens();
    dispatch({ type: 'auth/logout' });
  }, [dispatch]);

  return useMemo(
    () => ({
      user: state.auth.user,
      isAuthenticated: state.auth.user !== null,
      isLoading: state.auth.isLoading,
      login,
      register,
      logout,
    }),
    [state.auth.user, state.auth.isLoading, login, register, logout]
  );
}

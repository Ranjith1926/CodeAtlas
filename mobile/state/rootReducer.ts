import { AuthAction, AuthState } from './auth/authTypes';
import { authReducer, initialAuthState } from './auth/authReducer';
import { ThemeAction, ThemeState } from './theme/themeTypes';
import { themeReducer, initialThemeState } from './theme/themeReducer';

export interface RootState {
  auth: AuthState;
  theme: ThemeState;
}

export type RootAction = AuthAction | ThemeAction;

export const initialRootState: RootState = {
  auth: initialAuthState,
  theme: initialThemeState,
};

export function rootReducer(state: RootState, action: RootAction): RootState {
  return {
    auth: authReducer(state.auth, action as AuthAction),
    theme: themeReducer(state.theme, action as ThemeAction),
  };
}

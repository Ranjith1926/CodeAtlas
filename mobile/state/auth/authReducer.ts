import { AuthAction, AuthState } from './authTypes';

export const initialAuthState: AuthState = {
  user: null,
  isLoading: true,
};

export function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'auth/initStart':
      return { ...state, isLoading: true };
    case 'auth/initComplete':
      return { user: action.payload.user, isLoading: false };
    case 'auth/loginSuccess':
      return { user: action.payload.user, isLoading: false };
    case 'auth/logout':
      return { user: null, isLoading: false };
    default:
      return state;
  }
}

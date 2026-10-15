import { User } from '../../types/models';

export interface AuthState {
  user: User | null;
  isLoading: boolean;
}

export type AuthAction =
  | { type: 'auth/initStart' }
  | { type: 'auth/initComplete'; payload: { user: User | null } }
  | { type: 'auth/loginSuccess'; payload: { user: User } }
  | { type: 'auth/logout' };

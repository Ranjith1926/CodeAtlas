import { authReducer, initialAuthState } from './authReducer';
import { User } from '../../types/models';

const user: User = {
  id: 'user-1',
  email: 'demo@codeatlas.app',
  displayName: 'Demo User',
};

describe('authReducer', () => {
  it('returns the initial state as loading with no user', () => {
    expect(initialAuthState).toEqual({ user: null, isLoading: true });
  });

  it('auth/initStart marks the state as loading without touching the user', () => {
    const state = authReducer({ user, isLoading: false }, { type: 'auth/initStart' });
    expect(state).toEqual({ user, isLoading: true });
  });

  it('auth/initComplete sets the user and clears loading', () => {
    const state = authReducer(initialAuthState, { type: 'auth/initComplete', payload: { user } });
    expect(state).toEqual({ user, isLoading: false });
  });

  it('auth/initComplete with a null user leaves the user unauthenticated', () => {
    const state = authReducer({ user, isLoading: true }, { type: 'auth/initComplete', payload: { user: null } });
    expect(state).toEqual({ user: null, isLoading: false });
  });

  it('auth/loginSuccess sets the user and clears loading', () => {
    const state = authReducer(initialAuthState, { type: 'auth/loginSuccess', payload: { user } });
    expect(state).toEqual({ user, isLoading: false });
  });

  it('auth/logout clears the user', () => {
    const state = authReducer({ user, isLoading: false }, { type: 'auth/logout' });
    expect(state).toEqual({ user: null, isLoading: false });
  });

  it('returns the same state reference for an unrecognized action', () => {
    const state = { user, isLoading: false };
    // @ts-expect-error intentionally testing an action this reducer doesn't own
    const next = authReducer(state, { type: 'theme/setMode', payload: { mode: 'dark' } });
    expect(next).toBe(state);
  });
});

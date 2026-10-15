import { rootReducer, initialRootState } from './rootReducer';
import { User } from '../types/models';

const user: User = {
  id: 'user-1',
  email: 'demo@codeatlas.app',
  displayName: 'Demo User',
};

describe('rootReducer', () => {
  it('starts from the combined initial state of every slice', () => {
    expect(initialRootState).toEqual({
      auth: { user: null, isLoading: true },
      theme: { mode: 'system', isLoaded: false },
    });
  });

  it('an auth action only updates the auth slice, leaving theme untouched', () => {
    const state = rootReducer(initialRootState, { type: 'auth/loginSuccess', payload: { user } });
    expect(state.auth).toEqual({ user, isLoading: false });
    expect(state.theme).toBe(initialRootState.theme);
  });

  it('a theme action only updates the theme slice, leaving auth untouched', () => {
    const state = rootReducer(initialRootState, { type: 'theme/setMode', payload: { mode: 'dark' } });
    expect(state.theme).toEqual({ mode: 'dark', isLoaded: false });
    expect(state.auth).toBe(initialRootState.auth);
  });
});

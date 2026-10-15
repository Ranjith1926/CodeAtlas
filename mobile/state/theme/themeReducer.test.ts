import { themeReducer, initialThemeState } from './themeReducer';

describe('themeReducer', () => {
  it('returns the initial state as system mode, not yet loaded', () => {
    expect(initialThemeState).toEqual({ mode: 'system', isLoaded: false });
  });

  it('theme/hydrate sets the persisted mode and marks the state as loaded', () => {
    const state = themeReducer(initialThemeState, { type: 'theme/hydrate', payload: { mode: 'dark' } });
    expect(state).toEqual({ mode: 'dark', isLoaded: true });
  });

  it('theme/setMode updates the mode without affecting isLoaded', () => {
    const state = themeReducer({ mode: 'system', isLoaded: true }, { type: 'theme/setMode', payload: { mode: 'light' } });
    expect(state).toEqual({ mode: 'light', isLoaded: true });
  });

  it('returns the same state reference for an unrecognized action', () => {
    const state = { mode: 'dark' as const, isLoaded: true };
    // @ts-expect-error intentionally testing an action this reducer doesn't own
    const next = themeReducer(state, { type: 'auth/logout' });
    expect(next).toBe(state);
  });
});

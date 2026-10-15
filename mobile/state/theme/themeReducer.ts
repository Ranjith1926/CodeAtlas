import { ThemeAction, ThemeState } from './themeTypes';

export const initialThemeState: ThemeState = {
  mode: 'system',
  isLoaded: false,
};

export function themeReducer(state: ThemeState, action: ThemeAction): ThemeState {
  switch (action.type) {
    case 'theme/hydrate':
      return { mode: action.payload.mode, isLoaded: true };
    case 'theme/setMode':
      return { ...state, mode: action.payload.mode };
    default:
      return state;
  }
}

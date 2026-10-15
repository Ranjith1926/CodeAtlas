import { ThemeMode } from '../../theme/colors';

export interface ThemeState {
  mode: ThemeMode;
  isLoaded: boolean;
}

export type ThemeAction =
  | { type: 'theme/hydrate'; payload: { mode: ThemeMode } }
  | { type: 'theme/setMode'; payload: { mode: ThemeMode } };

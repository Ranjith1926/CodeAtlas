/**
 * CodeAtlas design tokens.
 * Brand palette: Deep Navy, Mint Green, Soft White, Slate, Warm Amber.
 */
export const brand = {
  deepNavy: '#102A43',
  mintGreen: '#47D7AC',
  softWhite: '#F5F8FC',
  slate: '#486581',
  warmAmber: '#FFCA70',
};

export const difficultyColors = {
  Beginner: { bg: '#E3FBF2', fg: '#0F9D6E', border: '#47D7AC' },
  Intermediate: { bg: '#FFF4DF', fg: '#B7791F', border: '#FFCA70' },
  Advanced: { bg: '#FDE8E8', fg: '#C53030', border: '#E57373' },
};

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  primaryText: string;
  accent: string;
  danger: string;
  success: string;
  tabBarBackground: string;
  tabBarActive: string;
  tabBarInactive: string;
  card: string;
  codeBackground: string;
  codeText: string;
}

export const lightColors: ThemeColors = {
  background: brand.softWhite,
  surface: '#FFFFFF',
  surfaceAlt: '#EAF0F7',
  text: brand.deepNavy,
  textMuted: brand.slate,
  border: '#D9E2EC',
  primary: brand.deepNavy,
  primaryText: '#FFFFFF',
  accent: brand.mintGreen,
  danger: '#C53030',
  success: '#0F9D6E',
  tabBarBackground: '#FFFFFF',
  tabBarActive: brand.deepNavy,
  tabBarInactive: brand.slate,
  card: '#FFFFFF',
  codeBackground: '#0D1B2A',
  codeText: '#F5F8FC',
};

export const darkColors: ThemeColors = {
  background: brand.deepNavy,
  surface: '#17344F',
  surfaceAlt: '#1E3A58',
  text: brand.softWhite,
  textMuted: '#9FB3C8',
  border: '#28496A',
  primary: brand.mintGreen,
  primaryText: brand.deepNavy,
  accent: brand.warmAmber,
  danger: '#FF8A8A',
  success: brand.mintGreen,
  tabBarBackground: '#0C2238',
  tabBarActive: brand.mintGreen,
  tabBarInactive: '#7A93AC',
  card: '#17344F',
  codeBackground: '#081420',
  codeText: '#F5F8FC',
};

export type ThemeMode = 'light' | 'dark' | 'system';

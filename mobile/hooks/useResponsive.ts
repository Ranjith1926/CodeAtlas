import { useWindowDimensions } from 'react-native';
import { LARGE_SCREEN_BREAKPOINT, TABLET_BREAKPOINT } from '../constants/config';

export interface ResponsiveInfo {
  width: number;
  isTablet: boolean; // >= 768px: use a side nav rail instead of bottom tabs
  isLargeScreen: boolean; // >= 1200px: room for a persistent "Ask AI" side panel
  contentMaxWidth: number;
}

export function useResponsive(): ResponsiveInfo {
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;
  const isLargeScreen = width >= LARGE_SCREEN_BREAKPOINT;
  // Keep the reading column comfortable — never let text stretch full-bleed.
  const contentMaxWidth = Math.min(width, 760);
  return { width, isTablet, isLargeScreen, contentMaxWidth };
}

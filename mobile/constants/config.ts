/**
 * Central runtime configuration.
 *
 * API_BASE_URL:
 *   Defaults to the Android emulator's alias for the host machine's localhost
 *   (10.0.2.2), matching the backend's fixed local dev port. Override with
 *   EXPO_PUBLIC_API_URL (e.g. a LAN IP) when running on a physical device:
 *     EXPO_PUBLIC_API_URL=http://192.168.1.50:5212/api npx expo start
 *
 * USE_FIXTURES:
 *   Dev-only convenience so screens can be built/tested before the backend
 *   (built in parallel by another team) is reachable. The real networking
 *   code path (api/client.ts) is always the default; this flag only makes
 *   repositories fall back to local fixture data instead of throwing when a
 *   request fails, and only while __DEV__ is true. It must never affect
 *   production builds.
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:5212/api';

export const USE_FIXTURES = __DEV__ && process.env.EXPO_PUBLIC_USE_FIXTURES === '1';

export const APP_NAME = 'CodeAtlas';
export const APP_TAGLINE = 'Learn. Explore. Master.';

export const TABLET_BREAKPOINT = 768;
export const LARGE_SCREEN_BREAKPOINT = 1200;

export const SQLITE_DB_NAME = 'codeatlas.db';

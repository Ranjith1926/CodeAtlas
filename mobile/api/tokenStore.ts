import * as SecureStore from 'expo-secure-store';

/**
 * Tokens live only in SecureStore (never AsyncStorage). A small in-memory
 * cache avoids an async round trip on every request; it is populated on
 * boot by AuthContext and kept in sync on every write here.
 */
const ACCESS_KEY = 'codeatlas.accessToken';
const REFRESH_KEY = 'codeatlas.refreshToken';

let cachedAccessToken: string | null = null;
let cachedRefreshToken: string | null = null;

/** Called when a silent refresh fails and the user must be logged out. */
type ForcedLogoutListener = () => void;
let forcedLogoutListener: ForcedLogoutListener | null = null;

export function onForcedLogout(listener: ForcedLogoutListener | null) {
  forcedLogoutListener = listener;
}

export function triggerForcedLogout() {
  forcedLogoutListener?.();
}

export async function loadTokens(): Promise<{ accessToken: string | null; refreshToken: string | null }> {
  const [access, refresh] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_KEY),
    SecureStore.getItemAsync(REFRESH_KEY),
  ]);
  cachedAccessToken = access;
  cachedRefreshToken = refresh;
  return { accessToken: access, refreshToken: refresh };
}

export async function saveTokens(accessToken: string, refreshToken: string): Promise<void> {
  cachedAccessToken = accessToken;
  cachedRefreshToken = refreshToken;
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_KEY, accessToken),
    SecureStore.setItemAsync(REFRESH_KEY, refreshToken),
  ]);
}

export async function clearTokens(): Promise<void> {
  cachedAccessToken = null;
  cachedRefreshToken = null;
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY),
    SecureStore.deleteItemAsync(REFRESH_KEY),
  ]);
}

export function getCachedAccessToken(): string | null {
  return cachedAccessToken;
}

export function getCachedRefreshToken(): string | null {
  return cachedRefreshToken;
}

export function setCachedAccessToken(token: string | null) {
  cachedAccessToken = token;
}

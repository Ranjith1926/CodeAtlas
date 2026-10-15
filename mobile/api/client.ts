import { API_BASE_URL } from '../constants/config';
import {
  getCachedAccessToken,
  getCachedRefreshToken,
  saveTokens,
  triggerForcedLogout,
} from './tokenStore';

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  auth?: boolean; // send bearer token when available (default true)
  skipRetry?: boolean; // internal: prevents infinite refresh loops
}

// A single in-flight refresh promise so concurrent 401s only refresh once.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = getCachedRefreshToken();
    if (!refreshToken) return null;
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      // Rotated tokens: always replace the stored refresh token with the new one.
      await saveTokens(data.accessToken, data.refreshToken);
      return data.accessToken as string;
    } catch {
      return null;
    }
  })();

  const result = await refreshPromise;
  refreshPromise = null;
  return result;
}

export async function apiFetch<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, skipRetry = false } = options;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getCachedAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new ApiError(0, `Network request failed: ${(err as Error).message}`);
  }

  if (res.status === 401 && auth && !skipRetry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiFetch<T>(path, { ...options, skipRetry: true });
    }
    triggerForcedLogout();
    throw new ApiError(401, 'Session expired');
  }

  if (!res.ok) {
    let parsedBody: unknown;
    try {
      parsedBody = await res.json();
    } catch {
      parsedBody = undefined;
    }
    const message =
      (parsedBody && typeof parsedBody === 'object' && 'message' in parsedBody
        ? String((parsedBody as { message: unknown }).message)
        : undefined) ?? `Request failed with status ${res.status}`;
    throw new ApiError(res.status, message, parsedBody);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  try {
    return (await res.json()) as T;
  } catch {
    return undefined as T;
  }
}

export { API_BASE_URL };

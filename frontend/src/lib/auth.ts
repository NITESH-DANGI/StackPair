/**
 * StackPair — Token persistence helpers.
 *
 * Stores access_token and refresh_token in localStorage.
 */

const ACCESS_TOKEN_KEY = 'stackpair_access_token';
const REFRESH_TOKEN_KEY = 'stackpair_refresh_token';

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  // Also clear legacy session storage keys
  sessionStorage.removeItem('stackpair_email');
  sessionStorage.removeItem('stackpair_display_name');
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

'use client';

import { create } from 'zustand';
import type {
  UserBrief,
  User,
  Session,
  AuthState,
  AuthActions,
  AuthResponse,
  RegisterResponse,
} from '@/lib/types/auth';
import { api, ApiError } from '@/lib/api';
import { setTokens, clearTokens, getAccessToken, getRefreshToken } from '@/lib/auth';

const initialState: AuthState = {
  user: null,
  fullUser: null,
  session: null,
  isLoading: false,
  otpSent: false,
  error: null,
};

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  ...initialState,

  // ── Setters ──

  setUser: (user: UserBrief) => set({ user }),
  setFullUser: (user: User) => set({ fullUser: user }),
  setSession: (session: Session) => set({ session }),
  setOtpSent: (sent: boolean) => set({ otpSent: sent }),
  setError: (error: string | null) => set({ error }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  clearStore: () => {
    clearTokens();
    set(initialState);
  },

  // ── Register (send OTP) ──

  register: async (email: string): Promise<RegisterResponse> => {
    set({ isLoading: true, error: null });
    try {
      const result = await api<RegisterResponse>('/auth/register', {
        method: 'POST',
        body: { email },
        skipAuth: true,
      });
      set({ otpSent: true, isLoading: false });
      return result;
    } catch (err) {
      const message = err instanceof ApiError ? err.detail : 'Failed to send OTP';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  // ── Verify OTP ──

  verifyOtp: async (email: string, otp: string): Promise<AuthResponse> => {
    set({ isLoading: true, error: null });
    try {
      const result = await api<AuthResponse>('/auth/verify-otp', {
        method: 'POST',
        body: { email, otp },
        skipAuth: true,
      });

      // Store tokens
      setTokens(result.access_token, result.refresh_token);

      set({
        user: result.user,
        session: {
          access_token: result.access_token,
          refresh_token: result.refresh_token,
        },
        isLoading: false,
        otpSent: false,
      });

      return result;
    } catch (err) {
      const message = err instanceof ApiError ? err.detail : 'Verification failed';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  // ── GitHub OAuth ──

  loginWithGithub: async (): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const result = await api<{ url: string }>('/auth/github', {
        method: 'POST',
        skipAuth: true,
      });
      // Redirect to GitHub OAuth page
      window.location.href = result.url;
    } catch (err) {
      const message = err instanceof ApiError ? err.detail : 'GitHub login failed';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  // ── Google OAuth ──

  loginWithGoogle: async (): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const result = await api<{ url: string }>('/auth/google', {
        method: 'POST',
        skipAuth: true,
      });
      // Redirect to Google OAuth page
      window.location.href = result.url;
    } catch (err) {
      const message = err instanceof ApiError ? err.detail : 'Google login failed';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  // ── OAuth Callback ──

  handleOAuthCallback: async (
    provider: string,
    code: string,
    state?: string,
  ): Promise<AuthResponse> => {
    set({ isLoading: true, error: null });
    try {
      const result = await api<AuthResponse>(`/auth/${provider}/callback`, {
        method: 'POST',
        body: { code, state },
        skipAuth: true,
      });

      // Store tokens
      setTokens(result.access_token, result.refresh_token);

      set({
        user: result.user,
        session: {
          access_token: result.access_token,
          refresh_token: result.refresh_token,
        },
        isLoading: false,
      });

      return result;
    } catch (err) {
      const message = err instanceof ApiError ? err.detail : 'OAuth login failed';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  // ── Fetch Full User ──

  fetchUser: async (): Promise<User> => {
    set({ isLoading: true, error: null });
    try {
      const user = await api<User>('/users/me', { method: 'GET' });
      set({
        fullUser: user,
        user: {
          id: user.id,
          email: user.email,
          onboarding_state: user.onboarding_state,
          role: user.role,
        },
        isLoading: false,
      });
      return user;
    } catch (err) {
      const message = err instanceof ApiError ? err.detail : 'Failed to load profile';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  // ── Logout ──

  logout: async (): Promise<void> => {
    set({ isLoading: true });
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {
      // Even if the server call fails, clear local state
    } finally {
      clearTokens();
      set(initialState);
    }
  },

  // ── Hydrate from localStorage ──

  hydrate: () => {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();
    if (accessToken && refreshToken) {
      set({
        session: { access_token: accessToken, refresh_token: refreshToken },
      });
    }
  },
}));

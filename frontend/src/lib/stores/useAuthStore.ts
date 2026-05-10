'use client';

import { create } from 'zustand';
import type { User, Session, AuthState, AuthActions } from '@/lib/types/auth';

const initialState: AuthState = {
  user: null,
  session: null,
  isLoading: false,
  otpSent: false,
  error: null,
};

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  ...initialState,

  setUser: (user: User) => set({ user }),

  setSession: (session: Session) => set({ session }),

  setOtpSent: (sent: boolean) => set({ otpSent: sent }),

  setError: (error: string | null) => set({ error }),

  setLoading: (loading: boolean) => set({ isLoading: loading }),

  clearStore: () => set(initialState),
}));

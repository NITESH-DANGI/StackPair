// StackPair — Auth & User Type Definitions
// Aligned with backend schemas (auth/schemas.py, users/schemas.py)

// ── Onboarding State (matches backend OnboardingState enum) ──

export type OnboardingState =
  | 'REGISTERED'
  | 'PROFILE_COMPLETE'
  | 'SKILLS_SET'
  | 'GOALS_SET'
  | 'ACTIVE';

// ── User Role (matches backend UserRole enum) ──

export type UserRole = 'USER' | 'MENTOR' | 'AMBASSADOR' | 'ADMIN';

// ── Platform (matches backend valid_platforms) ──

export type Platform = 'github' | 'leetcode' | 'kaggle' | 'stackoverflow' | 'codeforces' | 'portfolio';

// ── User (matches backend UserBrief from auth response) ──

export interface UserBrief {
  id: string;
  email: string;
  onboarding_state: OnboardingState;
  role: UserRole;
}

// ── Full User (matches backend UserMeResponse) ──

export interface User {
  id: string;
  username: string;
  display_name: string;
  email: string;
  avatar_url?: string | null;
  bio?: string | null;
  role: UserRole;
  onboarding_state: OnboardingState;
  profile?: UserProfile | null;
  created_at: string;
}

// ── User Profile (matches backend ProfileResponse) ──

export interface UserProfile {
  primary_skill?: string | null;
  skill_level?: number | null;
  secondary_skills?: string[] | null;
  goals?: string[] | null;
  timezone?: string | null;
  github_handle?: string | null;
  linkedin_url?: string | null;
  portfolio_url?: string | null;
  languages?: string[] | null;
  learn_mode_active: boolean;
  build_mode_active: boolean;
  showcase_unlocked: boolean;
}

// ── Auth Response (matches backend AuthResponse) ──

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: UserBrief;
}

// ── Register Response ──

export interface RegisterResponse {
  message: string;
  expires_in: number;
}

// ── Session (client-side token pair) ──

export interface Session {
  access_token: string;
  refresh_token: string;
}

// ── Auth Store State & Actions ──

export interface AuthState {
  user: UserBrief | null;
  fullUser: User | null;
  session: Session | null;
  isLoading: boolean;
  otpSent: boolean;
  error: string | null;
}

export interface AuthActions {
  // Setters
  setUser: (user: UserBrief) => void;
  setFullUser: (user: User) => void;
  setSession: (session: Session) => void;
  setOtpSent: (sent: boolean) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  clearStore: () => void;

  // Async actions
  register: (email: string) => Promise<RegisterResponse>;
  verifyOtp: (email: string, otp: string) => Promise<AuthResponse>;
  loginWithGithub: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  handleOAuthCallback: (provider: string, code: string, state?: string) => Promise<AuthResponse>;
  fetchUser: () => Promise<User>;
  logout: () => Promise<void>;
  hydrate: () => void;
}

// ── Verification Status (matches backend VerificationStatusResponse) ──

export interface VerificationStatus {
  status: string;
  trigger?: string | null;
  final_score?: number | null;
  assigned_level?: number | null;
  normalised_primary_skill?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
}

// ── Platform Info (for UI) ──

export interface PlatformInfo {
  id: Platform;
  name: string;
  weight: number;
  required: boolean;
  description: string;
}

// ── Platform Handle (for API) ──

export interface PlatformHandle {
  platform: string;
  handle: string;
}

// ── Goal (for onboarding UI) ──

export interface Goal {
  id: string;
  label: string;
}

// ── Onboarding State Response ──

export interface OnboardingStateResponse {
  onboarding_state: OnboardingState;
}

// ── Constants ──

export const PLATFORMS: PlatformInfo[] = [
  { id: 'github', name: 'GitHub', weight: 35, required: true, description: 'Code repositories & contributions' },
  { id: 'leetcode', name: 'LeetCode', weight: 25, required: false, description: 'Algorithm & data structure challenges' },
  { id: 'kaggle', name: 'Kaggle', weight: 15, required: false, description: 'Data science & ML competitions' },
  { id: 'stackoverflow', name: 'Stack Overflow', weight: 10, required: false, description: 'Developer Q&A contributions' },
  { id: 'codeforces', name: 'Codeforces', weight: 10, required: false, description: 'Competitive programming ratings' },
  { id: 'portfolio', name: 'Portfolio', weight: 5, required: false, description: 'Personal portfolio website' },
];

export const GOALS: Goal[] = [
  { id: 'dsa_prep', label: 'DSA & Placement Prep' },
  { id: 'system_design', label: 'System Design' },
  { id: 'portfolio_build', label: 'Build Projects for Portfolio' },
  { id: 'open_source', label: 'Open Source Contributions' },
  { id: 'interview_ready', label: 'Interview Readiness' },
  { id: 'learn_new_stack', label: 'Learn a New Tech Stack' },
  { id: 'mentor_others', label: 'Mentor Others' },
];

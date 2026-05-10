// StackPair F-01 — Auth & Onboarding Type Definitions

export type OnboardingState =
  | 'REGISTERED'
  | 'PROFILE_COMPLETE'
  | 'SKILLS_SET'
  | 'GOALS_SET'
  | 'ACTIVE';

export type UserRole = 'user' | 'admin';

export type Platform = 'github' | 'leetcode' | 'kaggle' | 'stackoverflow' | 'codeforces';

export type AvailabilityStatus = 'available' | 'busy' | 'scheduled';

export type LevelJobStatus = 'pending' | 'running' | 'complete' | 'failed';

export interface User {
  id: string;
  email: string;
  username: string | null;
  display_name: string | null;
  onboarding_state: OnboardingState;
  primary_skill: string | null;
  secondary_skills: string[];
  bridge_points: number;
  user_role: UserRole;
  avatar_url?: string | null;
  bio?: string | null;
}

export interface Session {
  access_token: string;
  refresh_token: string;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  otpSent: boolean;
  error: string | null;
}

export interface AuthActions {
  setUser: (user: User) => void;
  setSession: (session: Session) => void;
  setOtpSent: (sent: boolean) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  clearStore: () => void;
}

export interface PlatformInfo {
  id: Platform;
  name: string;
  weight: number;
  required: boolean;
  description: string;
}

export interface Goal {
  id: string;
  label: string;
}

export const PLATFORMS: PlatformInfo[] = [
  { id: 'github', name: 'GitHub', weight: 35, required: true, description: 'Code repositories & contributions' },
  { id: 'leetcode', name: 'LeetCode', weight: 25, required: false, description: 'Algorithm & data structure challenges' },
  { id: 'kaggle', name: 'Kaggle', weight: 15, required: false, description: 'Data science & ML competitions' },
  { id: 'stackoverflow', name: 'Stack Overflow', weight: 10, required: false, description: 'Developer Q&A contributions' },
  { id: 'codeforces', name: 'Codeforces', weight: 10, required: false, description: 'Competitive programming ratings' },
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


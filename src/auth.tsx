import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { ClerkProvider, useAuth, useClerk, useUser } from '@clerk/react';

export interface AuthState {
  configured: boolean;
  loaded: boolean;
  userId: string | null;
  name: string | null;
  getToken: () => Promise<string | null>;
  signIn: () => void;
  signUp: () => void;
  signOut: () => Promise<void>;
  manageAccount: () => void;
}
const guest: AuthState = { configured: false, loaded: true, userId: null, name: null, getToken: async () => null, signIn: () => {}, signUp: () => {}, signOut: async () => {}, manageAccount: () => {} };
export const AuthContext = createContext<AuthState>(guest);

function ClerkBridge({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, userId, getToken } = useAuth();
  const { user } = useUser();
  const clerk = useClerk();
  const value = useMemo<AuthState>(() => ({
    configured: true, loaded: Boolean(isLoaded), userId: isSignedIn ? userId ?? null : null,
    name: user?.fullName || user?.username || user?.primaryEmailAddress?.emailAddress || null,
    getToken: async () => { try { return await getToken(); } catch { return null; } },
    signIn: () => clerk.openSignIn(), signUp: () => clerk.openSignUp(),
    signOut: async () => { await clerk.signOut(); }, manageAccount: () => clerk.openUserProfile(),
  }), [isLoaded, isSignedIn, userId, user, getToken, clerk]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.trim();
  if (!publishableKey) return <AuthContext.Provider value={guest}>{children}</AuthContext.Provider>;
  return <ClerkProvider publishableKey={publishableKey} afterSignOutUrl={window.location.origin} appearance={{
    variables: { colorPrimary: '#4e6973', colorBackground: 'var(--surface)', colorInput: 'var(--canvas)', colorInputForeground: 'var(--ink)', colorForeground: 'var(--ink)', colorMutedForeground: 'var(--muted)', fontFamily: '"IBM Plex Sans", sans-serif', borderRadius: '6px' },
    elements: { cardBox: { border: '1px solid var(--line-strong)' }, card: { background: 'var(--surface)' }, footer: { background: 'var(--canvas)' }, formButtonPrimary: { background: 'var(--action-primary)', color: 'var(--ink-strong)' } },
  }}><ClerkBridge>{children}</ClerkBridge></ClerkProvider>;
}

export const useAcademyAuth = () => useContext(AuthContext);

'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from './supabase/client';
import { setAccessTokenProvider, setAccessTokenRefreshProvider } from './api';
import type { Plan } from './types';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  plan: Plan;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Resolves the student's plan from Supabase user metadata (set server-side
// by the Subscription module / an admin via `app_metadata.plan`). Defaults
// to 'free' so the app is safe-by-default if that touch-point isn't wired
// up yet — matches SRS §2.3's "Subscription module" dependency, kept
// swappable without touching every call site.
function resolvePlan(user: User | null): Plan {
  const raw = (user?.app_metadata as any)?.plan ?? (user?.user_metadata as any)?.plan;
  return raw === 'pro' ? 'pro' : 'free';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const router = useRouter();

  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Every API request must automatically include Authorization: Bearer
    // <access_token>. Centralizing it here — rather than in each
    // component — means it's wired exactly once, at the moment we know
    // the current session, and stays correct across refresh/sign-out.
    setAccessTokenProvider(async () => {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? null;
    });
    setAccessTokenRefreshProvider(async () => {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) return null;
      return data.session?.access_token ?? null;
    });
  }, [supabase]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    // Session persistence + refresh (RB session requirements): Supabase's
    // client library auto-refreshes the token before it expires and fires
    // this listener with the new session, so we never hold a stale token.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);

      if (event === 'SIGNED_OUT') {
        router.push('/login');
        router.refresh();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  async function signOut() {
    await supabase.auth.signOut();
  }

  const value: AuthContextValue = {
    user,
    session,
    plan: resolvePlan(user),
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

'use client';

import { useAuth } from '@/lib/auth-context';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();

  // Middleware already redirects signed-out visitors to /login before this
  // ever renders. This loading/absent-user state only shows briefly during
  // client-side hydration or right after a sign-out event.
  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-ink/40">Loading…</p>
      </main>
    );
  }

  return <>{children}</>;
}

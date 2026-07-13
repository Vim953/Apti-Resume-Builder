'use client';

import { useAuth } from '@/lib/auth-context';

export function UserMenu() {
  const { user, plan, signOut } = useAuth();

  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <p className="text-xs font-medium text-ink/70">{user?.email}</p>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-ink/40">{plan} plan</p>
      </div>
      <button
        onClick={() => signOut()}
        className="rounded-xl border border-ink/15 px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-ink/5"
      >
        Sign out
      </button>
    </div>
  );
}

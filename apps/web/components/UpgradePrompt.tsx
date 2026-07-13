'use client';

export function UpgradePrompt({ reason, onClose }: { reason: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-card">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-violet/10 text-lg">✨</div>
        <h3 className="mb-1 text-sm font-bold text-ink">This is a Pro feature</h3>
        <p className="mb-5 text-xs text-ink/60">{reason}</p>
        <div className="flex justify-center gap-2">
          <button onClick={onClose} className="rounded-xl border border-ink/15 px-4 py-2 text-sm font-semibold text-ink/70 hover:bg-ink/5">
            Not now
          </button>
          <button className="rounded-xl bg-violet px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
            Upgrade to Pro
          </button>
        </div>
      </div>
    </div>
  );
}

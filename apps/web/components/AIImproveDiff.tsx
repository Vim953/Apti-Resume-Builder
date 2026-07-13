'use client';

export function AIImproveDiff({
  original,
  suggestion,
  onAccept,
  onReject,
}: {
  original: string;
  suggestion: string;
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-6">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-card">
        <h3 className="mb-4 text-sm font-bold text-ink">AI Improve suggestion</h3>

        <div className="mb-3 rounded-xl bg-danger/5 p-3">
          <p className="mb-1 text-xs font-semibold text-danger/80">Original</p>
          <p className="text-sm text-ink/70 line-through decoration-danger/40">{original}</p>
        </div>

        <div className="mb-5 rounded-xl bg-success/5 p-3">
          <p className="mb-1 text-xs font-semibold text-success/80">Suggested</p>
          <p className="text-sm text-ink">{suggestion}</p>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onReject}
            className="rounded-xl border border-ink/15 px-4 py-2 text-sm font-semibold text-ink/70 hover:bg-ink/5"
          >
            Reject
          </button>
          <button
            onClick={onAccept}
            className="rounded-xl bg-success px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

import Link from 'next/link';

export default function AuthCodeErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-card">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-danger/10 text-lg">!</div>
        <h1 className="mb-2 text-lg font-bold text-ink">That link didn&apos;t work</h1>
        <p className="mb-5 text-sm text-ink/60">
          The confirmation or sign-in link is invalid or has expired. Please try signing in again.
        </p>
        <Link
          href="/login"
          className="inline-block rounded-xl bg-indigo px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          Back to sign in
        </Link>
      </div>
    </main>
  );
}

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)]">
      <div className="text-center">
        <h1 className="text-[120px] font-bold leading-none text-[var(--accent)]">404</h1>
        <p className="mt-2 text-xl text-[var(--text-secondary)]">Page not found</p>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-[var(--radius-md)] bg-[var(--accent)] px-6 py-2.5 text-sm font-medium text-[var(--bg-primary)] transition hover:bg-[var(--accent-hover)]"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

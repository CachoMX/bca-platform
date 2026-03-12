export default function LoginLoading() {
  return (
    <div className="w-full max-w-md px-4">
      <div className="animate-pulse rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-8">
        {/* Logo skeleton */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="h-10 w-20 rounded bg-[var(--border)]" />
          <div className="h-5 w-24 rounded bg-[var(--border)]" />
          <div className="mt-1 h-4 w-44 rounded bg-[var(--border)]" />
        </div>

        {/* Email field skeleton */}
        <div className="mb-5">
          <div className="mb-1.5 h-4 w-12 rounded bg-[var(--border)]" />
          <div className="h-10 w-full rounded-lg bg-[var(--bg-secondary)]" />
        </div>

        {/* Password field skeleton */}
        <div className="mb-5">
          <div className="mb-1.5 h-4 w-16 rounded bg-[var(--border)]" />
          <div className="h-10 w-full rounded-lg bg-[var(--bg-secondary)]" />
        </div>

        {/* Button skeleton */}
        <div className="h-10 w-full rounded-lg bg-[var(--border)]" />

        {/* Footer skeleton */}
        <div className="mt-8 flex justify-center">
          <div className="h-3 w-48 rounded bg-[var(--border)]" />
        </div>
      </div>
    </div>
  );
}

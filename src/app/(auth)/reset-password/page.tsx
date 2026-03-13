'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      setSuccess(data.message);
      setPassword('');
      setConfirmPassword('');
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // No token in URL
  if (!token) {
    return (
      <div className="w-full max-w-md px-4">
        <div
          className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-8"
          style={{ boxShadow: 'var(--shadow-lg)' }}
        >
          <div className="mb-8 flex flex-col items-center text-center">
            <Image src="/pulse-icon.png" alt="PulseBC" width={64} height={64} className="mb-3" />
            <h1 className="text-4xl font-bold tracking-tight text-[var(--accent)]">
              Pulse<span className="text-[var(--text-primary)]">BC</span>
            </h1>
          </div>
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3.5 py-2.5">
            <p className="text-sm text-red-400">
              Invalid reset link. Please request a new password reset.
            </p>
          </div>
          <div className="mt-6 text-center">
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-[var(--accent)] hover:underline"
            >
              Request New Reset Link
            </Link>
          </div>
          <p className="mt-8 text-center text-xs text-[var(--text-muted)]">
            Benjamin Chaise &amp; Associates
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md px-4">
      <div
        className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-8"
        style={{ boxShadow: 'var(--shadow-lg)' }}
      >
        {/* Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <Image src="/pulse-icon.png" alt="PulseBC" width={64} height={64} className="mb-3" />
          <h1 className="text-4xl font-bold tracking-tight text-[var(--accent)]">
            Pulse<span className="text-[var(--text-primary)]">BC</span>
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Reset Your Password</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* New Password */}
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]"
            >
              New Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting || !!success}
              required
              minLength={6}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-50"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting || !!success}
              required
              minLength={6}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-50"
            />
          </div>

          {/* Success message */}
          {success && (
            <div className="rounded-lg border border-green-500/20 bg-green-500/10 px-3.5 py-2.5">
              <p className="text-sm text-green-400">{success}</p>
              <div className="mt-3 text-center">
                <Link
                  href="/login"
                  className="text-sm font-medium text-[var(--accent)] hover:underline"
                >
                  Sign In
                </Link>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3.5 py-2.5">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Submit */}
          {!success && (
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-contrast)] transition-all hover:bg-[var(--accent-hover)] hover:shadow-lg hover:shadow-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg-card)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </button>
          )}
        </form>

        {/* Back to Sign In */}
        {!success && (
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm font-medium text-[var(--accent)] hover:underline"
            >
              Back to Sign In
            </Link>
          </div>
        )}

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-[var(--text-muted)]">
          Benjamin Chaise &amp; Associates
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md px-4">
          <div
            className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-8"
            style={{ boxShadow: 'var(--shadow-lg)' }}
          >
            <div className="flex flex-col items-center text-center">
              <Image src="/pulse-icon.png" alt="PulseBC" width={64} height={64} className="mb-3" />
              <h1 className="text-4xl font-bold tracking-tight text-[var(--accent)]">
                Pulse<span className="text-[var(--text-primary)]">BC</span>
              </h1>
              <p className="mt-4 text-sm text-[var(--text-muted)]">Loading...</p>
            </div>
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

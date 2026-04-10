'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@/lib/validators';

const TIMEZONES = [
  { value: 'PST', label: 'Pacific Time (PST)' },
  { value: 'MST', label: 'Mountain Time (MST)' },
  { value: 'CST', label: 'Central Time (CST)' },
  { value: 'EST', label: 'Eastern Time (EST)' },
];

export default function RegisterPage() {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formLoadedAt] = useState(() => Date.now());

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      lastname: '',
      email: '',
      password: '',
      confirmPassword: '',
      timezone: '',
      city: '',
      state: '',
      country: '',
    },
  });

  async function onSubmit(data: RegisterInput) {
    setError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, _t: formLoadedAt }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Something went wrong. Please try again.');
        return;
      }

      setSuccess(true);
    } catch {
      setError('An unexpected error occurred. Please try again.');
    }
  }

  if (success) {
    return (
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
          </div>

          <div className="mt-8 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-4 text-center">
            <p className="text-sm text-green-400">
              Account created. Please wait for an admin to activate your account.
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
            >
              Back to Sign in
            </Link>
          </div>
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
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Create your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Honeypot fields — hidden from humans, bots auto-fill them */}
          <div className="absolute -left-[9999px]" aria-hidden="true" tabIndex={-1}>
            <input type="text" name="website" autoComplete="off" tabIndex={-1} />
            <input type="text" name="phone2" autoComplete="off" tabIndex={-1} />
          </div>
          {/* First Name */}
          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]"
            >
              First Name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="given-name"
              placeholder="John"
              disabled={isSubmitting}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-50"
              {...register('name')}
            />
            {errors.name && (
              <p className="mt-1.5 text-xs text-red-400">{errors.name.message}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label
              htmlFor="lastname"
              className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]"
            >
              Last Name
            </label>
            <input
              id="lastname"
              type="text"
              autoComplete="family-name"
              placeholder="Doe"
              disabled={isSubmitting}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-50"
              {...register('lastname')}
            />
            {errors.lastname && (
              <p className="mt-1.5 text-xs text-red-400">{errors.lastname.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              disabled={isSubmitting}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-50"
              {...register('email')}
            />
            {errors.email && (
              <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 6 characters"
              disabled={isSubmitting}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-50"
              {...register('password')}
            />
            {errors.password && (
              <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>
            )}
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
              placeholder="Re-enter your password"
              disabled={isSubmitting}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-50"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="mt-1.5 text-xs text-red-400">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Timezone */}
          <div>
            <label
              htmlFor="timezone"
              className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]"
            >
              Timezone
            </label>
            <select
              id="timezone"
              disabled={isSubmitting}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-50"
              {...register('timezone')}
            >
              <option value="">Select timezone</option>
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
            {errors.timezone && (
              <p className="mt-1.5 text-xs text-red-400">{errors.timezone.message}</p>
            )}
          </div>

          {/* City */}
          <div>
            <label
              htmlFor="city"
              className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]"
            >
              City
            </label>
            <input
              id="city"
              type="text"
              autoComplete="address-level2"
              placeholder="Your city"
              disabled={isSubmitting}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-50"
              {...register('city')}
            />
            {errors.city && (
              <p className="mt-1.5 text-xs text-red-400">{errors.city.message}</p>
            )}
          </div>

          {/* State */}
          <div>
            <label
              htmlFor="state"
              className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]"
            >
              State
            </label>
            <input
              id="state"
              type="text"
              autoComplete="address-level1"
              placeholder="Your state"
              disabled={isSubmitting}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-50"
              {...register('state')}
            />
            {errors.state && (
              <p className="mt-1.5 text-xs text-red-400">{errors.state.message}</p>
            )}
          </div>

          {/* Country */}
          <div>
            <label
              htmlFor="country"
              className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]"
            >
              Country
            </label>
            <input
              id="country"
              type="text"
              autoComplete="country-name"
              placeholder="Your country"
              disabled={isSubmitting}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-50"
              {...register('country')}
            />
            {errors.country && (
              <p className="mt-1.5 text-xs text-red-400">{errors.country.message}</p>
            )}
          </div>

          {/* Server error */}
          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3.5 py-2.5">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-contrast)] transition-all hover:bg-[var(--accent-hover)] hover:shadow-lg hover:shadow-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg-card)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

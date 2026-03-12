'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@/lib/validators';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: LoginInput) {
    setError(null);

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
        return;
      }

      router.push('/');
    } catch {
      setError('An unexpected error occurred. Please try again.');
    }
  }

  return (
    <div className="w-full max-w-md px-4">
      <div
        className="rounded-xl border border-[#252538] bg-[#141422] p-8"
        style={{
          boxShadow: '0 0 40px rgba(0, 212, 255, 0.08), 0 0 80px rgba(0, 212, 255, 0.04)',
        }}
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-[#00d4ff]">
            BCA
          </h1>
          <p className="mt-1 text-lg font-medium text-white/80">Platform</p>
          <p className="mt-2 text-sm text-white/40">Sign in to your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-white/60"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              disabled={isSubmitting}
              className="w-full rounded-lg border border-[#252538] bg-[#0f0f1a] px-3.5 py-2.5 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-[#00d4ff]/50 focus:ring-1 focus:ring-[#00d4ff]/25 disabled:opacity-50"
              {...register('email')}
            />
            {errors.email && (
              <p className="mt-1.5 text-xs text-red-400">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-white/60"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              disabled={isSubmitting}
              className="w-full rounded-lg border border-[#252538] bg-[#0f0f1a] px-3.5 py-2.5 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-[#00d4ff]/50 focus:ring-1 focus:ring-[#00d4ff]/25 disabled:opacity-50"
              {...register('password')}
            />
            {errors.password && (
              <p className="mt-1.5 text-xs text-red-400">
                {errors.password.message}
              </p>
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
            className="w-full rounded-lg bg-[#00d4ff] px-4 py-2.5 text-sm font-semibold text-[#0a0a12] transition-all hover:bg-[#33dfff] hover:shadow-lg hover:shadow-[#00d4ff]/20 focus:outline-none focus:ring-2 focus:ring-[#00d4ff]/50 focus:ring-offset-2 focus:ring-offset-[#141422] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-white/25">
          Benjamin Chaise &amp; Associates
        </p>
      </div>
    </div>
  );
}

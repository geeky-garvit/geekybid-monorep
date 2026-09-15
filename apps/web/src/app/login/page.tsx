'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { loginSchema, LoginFormData } from '@/lib/validation';
import { useAuthGuard } from '@/hooks/useAuthGuard';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginUser } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    const toastId = toast.loading('Signing you in...');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const resData = await res.json();

      if (!res.ok || !resData.success) {
        throw new Error(resData.message || resData.error || 'Invalid email or password.');
      }

      loginUser(resData.user);

      toast.success('Welcome back!', {
        id: toastId,
        description: `Signed in as ${resData.user?.name || resData.user?.email}`,
      });

      const redirectTo = searchParams.get('redirectTo') || searchParams.get('next') || '/auctions';
      const targetPath = redirectTo.startsWith('/') ? redirectTo : '/auctions';

      router.push(targetPath);
      router.refresh();
    } catch (err: any) {
      toast.error('Login Failed', {
        id: toastId,
        description: err.message || 'An unexpected error occurred. Please try again.',
      });
    }
  };

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
          Email
        </label>
        <input
          type="email"
          {...register('email')}
          className={`w-full px-4 py-3 rounded-xl border text-slate-900 font-medium text-sm transition focus:outline-none focus:ring-2 ${
            errors.email
              ? 'border-rose-500 focus:ring-rose-200'
              : 'border-slate-200 focus:ring-purple-600'
          }`}
          placeholder="garvit@example.com"
        />
        {errors.email && (
          <p className="mt-1.5 text-xs font-semibold text-rose-600">
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
          Password
        </label>
        <input
          type="password"
          {...register('password')}
          className={`w-full px-4 py-3 rounded-xl border text-slate-900 font-medium text-sm transition focus:outline-none focus:ring-2 ${
            errors.password
              ? 'border-rose-500 focus:ring-rose-200'
              : 'border-slate-200 focus:ring-purple-600'
          }`}
          placeholder="••••••••"
        />
        {errors.password && (
          <p className="mt-1.5 text-xs font-semibold text-rose-600">
            {errors.password.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-purple-200 transition duration-150 flex justify-center items-center"
      >
        {isSubmitting ? (
          <span className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
        ) : (
          'Sign In'
        )}
      </button>
    </form>
  );
}

export default function LoginPage() {
  const { loading } = useAuthGuard(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl">
        <div className="text-center">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Welcome back</h2>
          <p className="mt-2 text-sm text-slate-500">
            Sign in to access your active bids and seller dashboard.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>

        <div className="text-center pt-2">
          <p className="text-sm text-slate-500">
            Don't have an account?{' '}
            <Link href="/register" className="font-bold text-purple-700 hover:underline">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
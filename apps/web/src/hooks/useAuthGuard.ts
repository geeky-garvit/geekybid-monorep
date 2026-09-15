'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function useAuthGuard(requireAuth: boolean = true) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();

        if (data.success && data.user) {
          setUser(data.user);
          // If user IS logged in and trying to access /login or /register
          if (!requireAuth) {
            router.replace('/dashboard');
            return;
          }
        } else {
          // If user is NOT logged in and trying to access protected pages
          if (requireAuth) {
            router.replace('/login');
            return;
          }
        }
      } catch (err) {
        if (requireAuth) router.replace('/login');
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [requireAuth, router]);

  return { user, loading };
}
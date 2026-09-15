'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  watchlist: string[];
  loginUser: (user: User) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshWatchlist: (currentUser?: User | null) => Promise<void>;
  toggleWatchlist: (auctionId: string) => Promise<boolean>;
  isWatchlisted: (auctionId: string) => boolean;
  isLoaded: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const refreshWatchlist = useCallback(async (currentUser: User | null = user) => {
    if (!currentUser?.id) {
      setWatchlist([]);
      return;
    }

    try {
      const res = await fetch(`/api/watchlist?userId=${currentUser.id}`, {
        cache: 'no-store',
        credentials: 'include',
      });
      const data = await res.json();

      if (res.ok && data.success && Array.isArray(data.watchlist)) {
        const nextIds = data.watchlist
          .map((item: any) => item.id || item.auctionId)
          .filter(Boolean);
        setWatchlist(nextIds);
        return;
      }
    } catch (err) {
      console.error('Watchlist refresh error:', err);
    }

    setWatchlist([]);
  }, [user]);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' },
        credentials: 'include',
      });
      const data = await res.json();

      if (res.ok && data.success && data.user) {
        setUser(data.user);
        await refreshWatchlist(data.user);
      } else {
        setUser(null);
        setWatchlist([]);
      }
    } catch (err) {
      console.error('Auth refresh error:', err);
      setUser(null);
      setWatchlist([]);
    } finally {
      setIsLoaded(true);
    }
  }, [refreshWatchlist]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (!user?.id) {
      setWatchlist([]);
      return;
    }

    refreshWatchlist(user);
    const intervalId = setInterval(() => refreshWatchlist(user), 5000);
    return () => clearInterval(intervalId);
  }, [user?.id, refreshWatchlist]);

  const loginUser = (newUser: User) => {
    setUser(newUser);
    setIsLoaded(true);
    void refreshWatchlist(newUser);
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setWatchlist([]);
      setIsLoaded(true);
      window.location.href = '/login';
    }
  };

  const toggleWatchlist = useCallback(async (auctionId: string) => {
    if (!user) return false;

    const previous = [...watchlist];
    const isPresent = previous.includes(auctionId);
    const optimistic = isPresent ? previous.filter((id) => id !== auctionId) : [...previous, auctionId];
    setWatchlist(optimistic);

    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ auctionId, userId: user.id }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setWatchlist(previous);
        return false;
      }

      await refreshWatchlist(user);
      return Boolean(data.isWatchlisted);
    } catch (err) {
      console.error('Watchlist toggle error:', err);
      setWatchlist(previous);
      return false;
    }
  }, [user, watchlist, refreshWatchlist]);

  const isWatchlisted = (auctionId: string) => watchlist.includes(auctionId);

  return (
    <AuthContext.Provider
      value={{
        user,
        watchlist,
        loginUser,
        logout,
        refreshUser,
        refreshWatchlist,
        toggleWatchlist,
        isWatchlisted,
        isLoaded,
        isLoading: !isLoaded,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useState, useEffect, useCallback } from 'react';
import AuctionCard from '@/app/components/auction/AuctionCard';

export default function WatchlistPage() {
  // 1. Enforce route guard: automatically redirects unauthenticated users to /login
  const { user, loading: authLoading } = useAuthGuard(true);
  const { isLoaded } = useAuth();

  const [savedAuctions, setSavedAuctions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWatchlist = useCallback(async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/watchlist?userId=${user.id}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setSavedAuctions(data.watchlist);
      }
    } catch (err) {
      console.error('Failed to load saved auctions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchWatchlist();
    }
  }, [user?.id, fetchWatchlist]);

  // Remove auction instantly from local state when un-watchlisted
  const handleWatchlistToggle = (auctionId: string, isWatchlisted: boolean) => {
    if (!isWatchlisted) {
      setSavedAuctions((prev) => prev.filter((item) => item.id !== auctionId));
    }
  };

  // 2. Prevent layout flash while checking authentication state or fetching items
  if (authLoading || !isLoaded || (isLoading && !savedAuctions.length)) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="h-8 w-48 bg-slate-200 animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-72 bg-slate-100 animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-black text-slate-900">My Watchlist</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track current high bids on items you are monitoring.
          </p>
        </div>
        <span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-full border border-purple-100">
          {savedAuctions.length} Saved Items
        </span>
      </div>

      {/* Grid or Empty State */}
      {savedAuctions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3 shadow-sm">
          <span className="text-4xl block">❤️</span>
          <h3 className="text-lg font-bold text-slate-800">Your watchlist is empty</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Browse the marketplace and click save on items to view them here.
          </p>
          <div className="pt-2">
            <Link
              href="/auctions"
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-md shadow-purple-600/20"
            >
              Explore Marketplace
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedAuctions.map((item) => (
            <AuctionCard
              key={item.id}
              auction={item}
              initialIsWatchlisted={true}
              onWatchlistToggle={handleWatchlistToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
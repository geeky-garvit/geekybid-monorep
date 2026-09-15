'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Auction } from '@/lib/store';
import AuctionCard from './AuctionCard';

interface Props {
  initialItems: Auction[];
  initialNextCursor: string | null;
}

export default function InfiniteAuctionGrid({ initialItems, initialNextCursor }: Props) {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const [items, setItems] = useState<Auction[]>(initialItems);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [loading, setLoading] = useState(false);
  const [watchlistedIds, setWatchlistedIds] = useState<string[]>([]);

  // Sync state when server props change
  useEffect(() => {
    setItems(initialItems);
    setNextCursor(initialNextCursor);
  }, [initialItems, initialNextCursor]);

  // Fetch the logged-in user's watchlisted item IDs from the database
  useEffect(() => {
    async function fetchUserWatchlist() {
      if (!user?.id) {
        setWatchlistedIds([]);
        return;
      }
      try {
        const res = await fetch(`/api/watchlist?userId=${user.id}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.success && Array.isArray(data.watchlist)) {
          // Extract the watchlisted auction IDs
          setWatchlistedIds(data.watchlist.map((item: any) => item.id));
        }
      } catch (err) {
        console.error('Failed to load initial watchlist status:', err);
      }
    }

    fetchUserWatchlist();
  }, [user?.id]);

  // Handle load more pagination
  const loadMore = useCallback(async () => {
    if (!nextCursor || loading) return;

    setLoading(true);
    const params = new URLSearchParams(searchParams.toString());
    params.set('cursor', nextCursor);
    params.set('limit', '8');

    try {
      const res = await fetch(`/api/auctions?${params.toString()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.data) {
        setItems((prev) => [...prev, ...data.data]);
        setNextCursor(data.pagination?.nextCursor || null);
      }
    } catch (err) {
      console.error('Failed to load more auctions:', err);
    } finally {
      setLoading(false);
    }
  }, [nextCursor, loading, searchParams]);

  // Infinite Scroll Intersection Observer
  const observerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const target = observerRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && nextCursor) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [loadMore, nextCursor]);

  // Callback to keep local watchlist IDs in sync when toggled from the card
  const handleWatchlistToggle = (auctionId: string, isWatchlisted: boolean) => {
    setWatchlistedIds((prev) =>
      isWatchlisted ? [...prev, auctionId] : prev.filter((id) => id !== auctionId)
    );
  };

  if (items.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3 shadow-sm">
        <span className="text-4xl block">🔍</span>
        <h3 className="text-lg font-bold text-slate-800">No auctions match your filters</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Try adjusting or resetting your selected search criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <AuctionCard
            key={item.id}
            auction={item}
            initialIsWatchlisted={watchlistedIds.includes(item.id)}
            onWatchlistToggle={handleWatchlistToggle}
          />
        ))}
      </div>

      {/* Infinite Scroll Trigger */}
      <div ref={observerRef} className="py-6 text-center">
        {loading && (
          <p className="text-xs font-bold text-purple-600 animate-pulse">
            Loading more auctions...
          </p>
        )}
      </div>
    </div>
  );
}
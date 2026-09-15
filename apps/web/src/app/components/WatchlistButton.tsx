'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface WatchlistButtonProps {
  auctionId: string;
  initialIsWatchlisted?: boolean;
}

export default function WatchlistButton({
  auctionId,
  initialIsWatchlisted = false,
}: WatchlistButtonProps) {
  const { user, watchlist, toggleWatchlist } = useAuth();

  const isCurrentlyInWatchlist =
    watchlist.includes(auctionId) || initialIsWatchlisted;

  const [isWatchlisted, setIsWatchlisted] = useState(isCurrentlyInWatchlist);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsWatchlisted(isCurrentlyInWatchlist);
  }, [isCurrentlyInWatchlist]);

  const handleToggleWatchlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      alert('Please log in to save items to your watchlist.');
      return;
    }

    const nextState = !isWatchlisted;
    setIsWatchlisted(nextState);
    setLoading(true);

    try {
      const success = await toggleWatchlist(auctionId);
      if (!success) {
        setIsWatchlisted(!nextState);
      }
    } catch (err) {
      console.error('Watchlist toggle error:', err);
      setIsWatchlisted(!nextState);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggleWatchlist}
      disabled={loading}
      title={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
      className="absolute top-3 right-3 bg-white/90 p-2 rounded-full shadow-md hover:bg-white transition text-xs hover:scale-110 active:scale-95 z-10 cursor-pointer disabled:opacity-50"
    >
      {isWatchlisted ? '❤️' : '🤍'}
    </button>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { Auction } from '@/lib/store';

interface AuctionCardProps {
  auction: Auction;
  initialIsWatchlisted?: boolean;
  onWatchlistToggle?: (auctionId: string, isWatchlisted: boolean) => void;
}

// Utility to format prices safely across large digit inputs
const formatCurrency = (amount: number = 0): string => {
  if (amount >= 1_000_000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 2,
    }).format(amount);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export default function AuctionCard({
  auction: initialAuction,
  initialIsWatchlisted = false,
  onWatchlistToggle,
}: AuctionCardProps) {
  const { user } = useAuth();
  
  const [auction, setAuction] = useState<Auction>(initialAuction);
  const [isWatchlisted, setIsWatchlisted] = useState(initialIsWatchlisted);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAuction(initialAuction);
  }, [initialAuction]);

  useEffect(() => {
    const handleBidUpdate = (event: CustomEvent<{ auctionId: string; amount: number; bidsCount?: number }>) => {
      if (event.detail && event.detail.auctionId === auction.id) {
        setAuction((prev) => ({
          ...prev,
          currentHighestBid: event.detail.amount,
          bidsCount: event.detail.bidsCount ?? prev.bidsCount + 1,
        }));
      }
    };

    window.addEventListener('auction-bid-updated' as any, handleBidUpdate);
    return () => {
      window.removeEventListener('auction-bid-updated' as any, handleBidUpdate);
    };
  }, [auction.id]);

  const isLive = (auction.status as string) === 'live' || (auction.status as string) === 'ACTIVE';
  
  const mainImage =
    auction.images && auction.images.length > 0
      ? auction.images[0]
      : 'https://picsum.photos/seed/fallback/600/600';

  const sellerAvatar = auction.sellerAvatar || 'https://picsum.photos/seed/user/100/100';

  // Safeguard: Check for native mobile file paths
  const isMainImageLocalFile = typeof mainImage === 'string' && mainImage.startsWith('file://');
  const isAvatarLocalFile = typeof sellerAvatar === 'string' && sellerAvatar.startsWith('file://');

  const handleWatchlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      alert('Please log in to add items to your watchlist.');
      return;
    }

    const nextState = !isWatchlisted;
    setIsWatchlisted(nextState);
    setLoading(true);

    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auctionId: auction.id,
          userId: user.id,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setIsWatchlisted(!nextState);
      } else if (onWatchlistToggle) {
        onWatchlistToggle(auction.id, data.isWatchlisted);
      }
    } catch (err) {
      console.error('Failed to toggle watchlist:', err);
      setIsWatchlisted(!nextState);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link
      href={`/auction/${encodeURIComponent(auction.id)}`}
      className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col h-full relative"
    >
      {/* Image Container */}
      <div className="relative w-full h-48 bg-slate-100 overflow-hidden">
        {isMainImageLocalFile ? (
          <img
            src={mainImage}
            alt={auction.title}
            className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
          />
        ) : (
          <Image
            src={mainImage}
            alt={auction.title}
            fill
            className="object-cover group-hover:scale-105 transition duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3 z-10">
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${
              isLive ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-white'
            }`}
          >
            {isLive ? 'Live' : 'Ended'}
          </span>
        </div>

        {/* Watchlist & Bids Count */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
          <button
            type="button"
            onClick={handleWatchlistClick}
            disabled={loading}
            title={isWatchlisted ? 'Remove from Watchlist' : 'Save to Watchlist'}
            className="bg-white/90 backdrop-blur-sm p-1.5 rounded-lg shadow-sm hover:bg-white transition hover:scale-105 active:scale-95 text-xs"
          >
            {isWatchlisted ? '❤️' : '🤍'}
          </button>
          
          <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold text-slate-800 shadow-sm">
            {auction.bidsCount ?? 0} bids
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow justify-between space-y-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-purple-600 block mb-1">
            {auction.category}
          </span>
          <h3 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-purple-600 transition">
            {auction.title}
          </h3>
          <p className="text-xs text-slate-500 line-clamp-2 mt-1">
            {auction.description}
          </p>
        </div>

        {/* Pricing & Seller Layout Safeguards */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase font-semibold text-slate-400">Current Bid</p>
            <p 
              className="text-sm font-black text-slate-900 truncate"
              title={formatCurrency(auction.currentHighestBid ?? auction.startingPrice ?? 0)}
            >
              {formatCurrency(auction.currentHighestBid ?? auction.startingPrice ?? 0)}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] uppercase font-semibold text-slate-400">Seller</p>
            <div className="flex items-center gap-1.5 mt-0.5 justify-end">
              <div className="relative w-4 h-4 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                {isAvatarLocalFile ? (
                  <img
                    src={sellerAvatar}
                    alt={auction.sellerName || 'Seller'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Image
                    src={sellerAvatar}
                    alt={auction.sellerName || 'Seller'}
                    fill
                    className="object-cover"
                    sizes="16px"
                  />
                )}
              </div>
              <span className="text-xs font-semibold text-slate-700 truncate max-w-[70px]">
                {auction.sellerName || 'Seller'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
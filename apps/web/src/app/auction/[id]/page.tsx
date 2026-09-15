'use client';

import React, { useState, useEffect, use, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { getAuctionById } from '@/lib/store';
import AuctionGallery from './components/AuctionGallery';
import AuctionBiddingCard from './components/AuctionBiddingCard';
import AuctionBidHistory, { Bid } from './components/AuctionBidHistory';
import { useAuctionLiveViewers } from '@/hooks/useAuctionLiveViewers';

export default function AuctionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const { user, isWatchlisted, toggleWatchlist } = useAuth();
  const { addToCart } = useCart();

  const [auction, setAuction] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [bidsHistory, setBidsHistory] = useState<Bid[]>([]);

  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isEnded: false,
  });

  const { liveViewers } = useAuctionLiveViewers(auction?.id, user?.id);

  // Fetch auction details from PostgreSQL API endpoint with Local Store fallback
  const fetchAuctionFromDb = useCallback(async () => {
    try {
      const res = await fetch(`/api/auctions/${id}`, { cache: 'no-store' });

      if (res.ok) {
        const data = await res.json();
        if (data.auction) {
          setAuction(data.auction);

          if (data.auction.bids) {
            const mappedBids: Bid[] = data.auction.bids.map((b: any) => ({
              id: b.id,
              bidderName: b.bidderName || 'Anonymous',
              bidderAvatar:
                b.bidderAvatar ||
                `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(
                  b.bidderName || 'Anonymous'
                )}`,
              amount: b.amount,
              timestamp: new Date(b.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
            }));
            setBidsHistory(mappedBids);
          }
          return;
        }
      }

      // Fallback check for newly created local storage auctions (e.g. "auction-178...")
      const localAuction = getAuctionById(id);
      if (localAuction) {
        const localItem = localAuction as any;
        setAuction({
          ...localAuction,
          currentHighestBid:
            localItem.currentHighestBid ??
            localItem.currentPrice ??
            localItem.startingBid ??
            0,
          bidsCount: localItem.bidsCount || localItem.history?.length || 0,
        });

        if (localAuction.history) {
          setBidsHistory(
            localAuction.history.map((b) => ({
              id: b.id,
              bidderName: b.bidderName,
              bidderAvatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(
                b.bidderName
              )}`,
              amount: b.amount,
              timestamp: new Date(b.time).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
            }))
          );
        }
      }
    } catch (err) {
      console.error('Failed fetch:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Initial load and 3-second database polling interval
  useEffect(() => {
    let isMounted = true;

    fetchAuctionFromDb();
    const pollInterval = setInterval(() => {
      if (isMounted) fetchAuctionFromDb();
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [fetchAuctionFromDb]);

  // Countdown timer calculation
  useEffect(() => {
    if (!auction) return;
    const calculateTimeLeft = () => {
      const isExpiredByStatus =
        auction.status === 'ENDED' ||
        auction.status === 'PAID' ||
        auction.status === 'ended' ||
        auction.status === 'paid';

      const diff = new Date(auction.endTime).getTime() - new Date().getTime();
      if (diff <= 0 || isExpiredByStatus) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isEnded: true });
        return;
      }
      setTimeLeft({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        isEnded: false,
      });
    };
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [auction]);

  // Handle placing bids directly into PostgreSQL via Prisma transaction API
  const handlePlaceBid = useCallback(
    async (amount: number) => {
      if (!auction || !user) return;
      const toastId = toast.loading('Submitting your bid...');

      try {
        const res = await fetch(`/api/auctions/${auction.id}/bid`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount,
            bidderId: user.id,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to submit bid');
        }

        toast.success('Bid placed successfully!', {
          id: toastId,
          description: `You are now the highest bidder at $${amount.toFixed(2)}`,
        });

        fetchAuctionFromDb();
      } catch (err: unknown) {
        toast.error('Bid rejected', {
          id: toastId,
          description: err instanceof Error ? err.message : 'Something went wrong.',
        });
      }
    },
    [auction, user, fetchAuctionFromDb]
  );

  const handleAddToCart = useCallback(() => {
    if (!auction) return;
    addToCart({
      id: auction.id,
      title: auction.title,
      price: auction.currentHighestBid,
      image: auction.images?.[0] || '',
      sellerName: auction.sellerName,
    });
    toast.success('Added to cart', {
      description: `${auction.title} is ready for checkout.`,
    });
  }, [auction, addToCart]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto" />
        <p className="text-sm font-semibold text-slate-600">Loading auction item...</p>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-800">Auction Listing Not Found</h2>
        <Link
          href="/auctions"
          className="inline-block bg-purple-600 text-white font-bold text-xs px-4 py-2 rounded-xl"
        >
          Back to Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link href="/auctions" className="hover:text-purple-600">
          Marketplace
        </Link>
        <span>/</span>
        <span className="capitalize">{auction.category}</span>
        <span>/</span>
        <span className="text-slate-900 font-bold truncate max-w-xs">{auction.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <AuctionGallery
            title={auction.title}
            images={auction.images || []}
            inWatchlist={isWatchlisted(auction.id)}
            onToggleWatchlist={() => toggleWatchlist(auction.id)}
          />
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-sm">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Item Details
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
              {auction.description}
            </p>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <AuctionBiddingCard
            auctionId={auction.id}
            category={auction.category}
            title={auction.title}
            currentHighestBid={auction.currentHighestBid}
            minIncrement={auction.minIncrement}
            bidsCount={auction.bidsCount}
            timeLeft={timeLeft}
            onPlaceBid={handlePlaceBid}
            onAddToCart={handleAddToCart}
            liveViewers={liveViewers}
          />
          <AuctionBidHistory bids={bidsHistory} />
        </div>
      </div>
    </div>
  );
}
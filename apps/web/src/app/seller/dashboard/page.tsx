'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useAuthGuard } from '@/hooks/useAuthGuard';

interface BidHistory {
  id: string;
  amount: number;
  bidderId: string;
  time: string;
  timestamp: string;
  bidderName: string;
  bidderAvatar: string;
}

interface Auction {
  id: string;
  title: string;
  description: string;
  category: string;
  startingBid: number;
  startingPrice: number;
  currentHighestBid: number;
  minIncrement: number;
  status: 'live' | 'ended' | 'paid';
  images: string[];
  endTime: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  bidsCount: number;
  history: BidHistory[];
}

interface ActivityItem {
  id: string;
  itemTitle: string;
  bidderName: string;
  amount: number;
  time: string;
  timestamp: number;
  auctionId: string;
}

export default function SellerDashboardPage() {
  // 1. Guard route: Automatically redirects to /login if user is not authenticated
  const { user, loading: authLoading } = useAuthGuard(true);
  const { isLoaded } = useAuth();

  const [sellerAuctions, setSellerAuctions] = useState<Auction[]>([]);
  const [activeTab, setActiveTab] = useState<'listings' | 'bids' | 'sold'>('listings');
  const [isLoading, setIsLoading] = useState(true);

  const fetchSellerAuctions = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const res = await fetch(`/api/seller/auctions?sellerId=${user.id}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setSellerAuctions(data.auctions);
      }
    } catch (error) {
      console.error('Failed to sync seller dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchSellerAuctions();
    }
  }, [user?.id, fetchSellerAuctions]);

  // 2. Fallback UI while verifying session token
  if (authLoading || !isLoaded || !user) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-500 text-xs font-semibold">Verifying seller access...</p>
      </div>
    );
  }

  const activeListings = sellerAuctions.filter((a) => a.status === 'live');
  const soldListings = sellerAuctions.filter((a) => a.status === 'ended' || a.status === 'paid');

  const totalRevenue = soldListings.reduce((sum, item) => sum + item.currentHighestBid, 0);
  const totalBidsReceived = sellerAuctions.reduce((sum, item) => sum + item.bidsCount, 0);

  const sellThroughRate =
    sellerAuctions.length > 0
      ? ((soldListings.length / sellerAuctions.length) * 100).toFixed(1)
      : '0.0';

  const realRecentBids: ActivityItem[] = sellerAuctions
    .flatMap((auction) =>
      (auction.history || []).map((bid) => {
        const parsedDate = new Date(bid.time);
        const isValidDate = !isNaN(parsedDate.getTime());
        return {
          id: bid.id,
          itemTitle: auction.title,
          bidderName: bid.bidderName,
          amount: bid.amount,
          time: isValidDate
            ? parsedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : bid.time,
          timestamp: isValidDate ? parsedDate.getTime() : 0,
          auctionId: auction.id,
        };
      })
    )
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-purple-600">
              Seller Central • {user.name}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live DB Sync
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-0.5">Seller Dashboard</h1>
        </div>

        <Link
          href="/seller/create"
          className="inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-5 py-3 rounded-xl transition shadow-md shadow-purple-600/20"
        >
          <span>＋ Create New Auction</span>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Revenue
          </span>
          <p className="text-2xl font-black text-slate-900">
            ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
            Database Verified
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Active Auctions
          </span>
          <p className="text-2xl font-black text-purple-950">{activeListings.length}</p>
          <span className="text-[10px] font-medium text-slate-500">Live on marketplace</span>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Bids Received
          </span>
          <p className="text-2xl font-black text-slate-900">{totalBidsReceived}</p>
          <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full inline-block">
            Across Your Listings
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Sell-Through Rate
          </span>
          <p className="text-2xl font-black text-slate-900">{sellThroughRate}%</p>
          <span className="text-[10px] font-medium text-slate-500">Completed vs Total</span>
        </div>
      </div>

      {/* Main Tabs Container */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 text-xs font-bold text-slate-500 bg-slate-50/50 px-6 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('listings')}
            className={`py-4 px-4 border-b-2 transition whitespace-nowrap ${
              activeTab === 'listings'
                ? 'border-purple-600 text-purple-950 bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Active Listings ({activeListings.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bids')}
            className={`py-4 px-4 border-b-2 transition whitespace-nowrap ${
              activeTab === 'bids'
                ? 'border-purple-600 text-purple-950 bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Live Bids Activity ({realRecentBids.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sold')}
            className={`py-4 px-4 border-b-2 transition whitespace-nowrap ${
              activeTab === 'sold'
                ? 'border-purple-600 text-purple-950 bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Sold & Concluded ({soldListings.length})
          </button>
        </div>

        <div className="p-6">
          {/* TAB 1: Active Listings */}
          {activeTab === 'listings' && (
            <div className="divide-y divide-slate-100">
              {isLoading ? (
                <div className="py-8 text-center text-xs text-slate-400">Syncing database listings...</div>
              ) : activeListings.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 font-medium">
                  No active listings found for user profile: <strong>{user.name}</strong>.
                </div>
              ) : (
                activeListings.map((item) => (
                  <div
                    key={item.id}
                    className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                        <Image
                          src={item.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300'}
                          alt={item.title}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-purple-600">
                          {item.category}
                        </span>
                        <h4 className="font-bold text-slate-900 text-xs">{item.title}</h4>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 font-medium">
                          <span>
                            Current High:{' '}
                            <strong className="text-slate-900">${item.currentHighestBid.toFixed(2)}</strong>
                          </span>
                          <span>•</span>
                          <span>{item.bidsCount} bids</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200/50">
                        ● Active
                      </span>
                      <Link
                        href={`/auction/${item.id}`}
                        className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-xl transition"
                      >
                        View Auction
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: Live Bids Activity */}
          {activeTab === 'bids' && (
            <div className="space-y-3">
              {realRecentBids.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 font-medium">
                  No recent bids recorded on your listings yet.
                </div>
              ) : (
                realRecentBids.map((bid) => (
                  <div
                    key={bid.id}
                    className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl text-xs border border-slate-100 hover:border-purple-200 transition"
                  >
                    <div>
                      <Link href={`/auction/${bid.auctionId}`} className="font-bold text-slate-900 hover:underline">
                        {bid.itemTitle}
                      </Link>
                      <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                        Bid placed by <strong className="text-purple-700">{bid.bidderName}</strong> at {bid.time}
                      </span>
                    </div>
                    <span className="font-black text-purple-950 text-sm">${bid.amount.toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: Sold & Concluded */}
          {activeTab === 'sold' && (
            <div className="divide-y divide-slate-100">
              {soldListings.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 font-medium">
                  No concluded auctions found.
                </div>
              ) : (
                soldListings.map((item) => (
                  <div
                    key={item.id}
                    className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                        <Image
                          src={item.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300'}
                          alt={item.title}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          Concluded
                        </span>
                        <h4 className="font-bold text-slate-900 text-xs">{item.title}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Winning Final Bid:{' '}
                          <strong className="text-purple-950">${item.currentHighestBid.toFixed(2)}</strong>
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/checkout/winner?auctionId=${item.id}`}
                      className="text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 px-4 py-2 rounded-xl transition text-center"
                    >
                      View Winner Checkout
                    </Link>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
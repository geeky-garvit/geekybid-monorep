
'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getAuctionsBySeller, getBidsByUser, getOrdersByUser, initializeStore, subscribeToStore } from '@/lib/store';
import AuctionCard from '@/app/components/auction/AuctionCard';
import Image from 'next/image';
import Link from 'next/link';

export default function UserDashboardPage() {
  const { user } = useAuth();
  const [, setVersion] = useState(0);
  useEffect(() => { initializeStore().then(() => setVersion((version) => version + 1)); return subscribeToStore(() => setVersion((version) => version + 1)); }, []);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <h2 className="text-2xl font-black text-slate-900">Please Log In</h2>
        <p className="text-slate-500 text-sm mt-2">Select a profile from the header to view your activity.</p>
      </div>
    );
  }

  const myListings = getAuctionsBySeller(user.id);
  const myBids = getBidsByUser(user.id);
  const myOrders = getOrdersByUser(user.id);
  const activeBids = myBids.filter(({ auction }) => auction.status === 'live').length;
  const amountCommitted = myBids.reduce((total, { userBids }) => total + (userBids[0]?.amount || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
      {/* Profile Header */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl flex items-center gap-4 shadow-sm">
        <div className="relative w-16 h-16 rounded-full overflow-hidden border">
          <Image src={user.avatar} alt={user.name} fill className="object-cover" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900">{user.name}</h1>
          <p className="text-xs text-purple-600 font-bold">{user.role || 'Member'}</p>
          <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
        </div>
      </div>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ['Live listings', myListings.filter((auction) => auction.status === 'live').length],
          ['Active bids', activeBids],
          ['Orders won', myOrders.length],
          ['Bid value', `$${amountCommitted.toFixed(2)}`],
        ].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-xl font-black text-purple-950">{value}</p></div>)}
      </section>

      {/* User Created Auctions */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900">My Listed Items ({myListings.length})</h2>
          <Link
            href="/seller/create"
            className="text-xs font-bold bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition"
          >
            + Create New Auction
          </Link>
        </div>

        {myListings.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 border rounded-xl text-slate-400 text-xs">
            You haven&apos;t posted any auctions yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {myListings.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        )}
      </section>

      {/* User Active Bids Activity */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">My Bidding Activity ({myBids.length})</h2>
        {myBids.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 border rounded-xl text-slate-400 text-xs">
            You haven&apos;t placed bids on any auctions yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {myBids.map(({ auction }) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

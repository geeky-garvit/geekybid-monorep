'use client';

import React from 'react';
import Image from 'next/image';
import { Auction } from '@/lib/store';

interface AuctionsTableProps {
  auctions: Auction[];
  onCloseAuction: (id: string) => void;
  onDeleteAuction: (id: string) => void;
}

export default function AdminAuctionsTable({
  auctions,
  onCloseAuction,
  onDeleteAuction,
}: AuctionsTableProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-400">
              <th className="p-4">Item</th>
              <th className="p-4">Category</th>
              <th className="p-4">Current High Bid</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {auctions.slice(0, 25).map((auction) => (
              <tr key={auction.id} className="hover:bg-slate-50/80 transition">
                <td className="p-4 flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                    {auction.images[0] && (
                      <Image
                        src={auction.images[0]}
                        alt={auction.title}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    )}
                  </div>
                  <span className="font-bold text-slate-800 truncate max-w-xs">
                    {auction.title}
                  </span>
                </td>
                <td className="p-4 text-slate-500 capitalize">{auction.category}</td>
                <td className="p-4 font-black text-purple-950">
  ${(auction.currentHighestBid ?? auction.startingPrice ?? (auction as any).currentBid ?? 0).toFixed(2)}
</td>
                <td className="p-4">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      auction.status === 'live'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {auction.status}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  {auction.status === 'live' && (
                    <button
                      onClick={() => onCloseAuction(auction.id)}
                      className="bg-amber-100 hover:bg-amber-200 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-lg transition"
                    >
                      Force End
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteAuction(auction.id)}
                    className="bg-rose-100 hover:bg-rose-200 text-rose-700 text-[10px] font-bold px-2.5 py-1 rounded-lg transition"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
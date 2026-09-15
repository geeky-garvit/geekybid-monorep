'use client';

import React from 'react';
import Image from 'next/image';

export interface Bid {
  id: string;
  bidderName: string;
  bidderAvatar: string;
  amount: number;
  timestamp: string;
}

interface AuctionBidHistoryProps {
  bids: Bid[];
}

export default function AuctionBidHistory({ bids }: AuctionBidHistoryProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
      <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex justify-between items-center">
        <span>Bid History</span>
        <span className="text-[10px] text-slate-400 font-normal">Real-time update</span>
      </h3>

      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
        {bids.map((bid) => (
          <div
            key={bid.id}
            className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="relative w-7 h-7 rounded-full overflow-hidden border bg-white">
                <Image src={bid.bidderAvatar} alt={bid.bidderName} fill sizes="28px" />
              </div>
              <div>
                <p className="font-bold text-slate-800">{bid.bidderName}</p>
                <span className="text-[10px] text-slate-400">{bid.timestamp}</span>
              </div>
            </div>
            <span className="font-black text-purple-950">${bid.amount.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
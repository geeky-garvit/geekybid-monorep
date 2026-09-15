'use client';

import React from 'react';

interface PricingSectionProps {
  startingBid: string;
  setStartingBid: (val: string) => void;
  reservePrice: string;
  setReservePrice: (val: string) => void;
}

export default function PricingSection({
  startingBid,
  setStartingBid,
  reservePrice,
  setReservePrice,
}: PricingSectionProps) {
  return (
    <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
      <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
        2. Pricing & Reserve
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Starting Price ($ USD) *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">$</span>
            <input
              type="number"
              step="0.01"
              required
              placeholder="50.00"
              value={startingBid}
              onChange={(e) => setStartingBid(e.target.value)}
              className="w-full pl-7 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Reserve Price ($ USD) <span className="font-normal text-slate-400">(Optional)</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">$</span>
            <input
              type="number"
              step="0.01"
              placeholder="200.00"
              value={reservePrice}
              onChange={(e) => setReservePrice(e.target.value)}
              className="w-full pl-7 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Minimum price required for the auction to sell. Hidden from bidders.
          </p>
        </div>
      </div>
    </div>
  );
}
'use client';

import React from 'react';

interface MetricsProps {
  totalRevenue: number;
  totalOrders: number;
  liveAuctionsCount: number;
  totalAuctionsCount: number;
}

export default function AdminMetrics({
  totalRevenue,
  totalOrders,
  liveAuctionsCount,
  totalAuctionsCount,
}: MetricsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
          Total Paid Revenue
        </span>
        <p className="text-2xl font-black text-purple-950">${totalRevenue.toFixed(2)}</p>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
          Total Orders
        </span>
        <p className="text-2xl font-black text-slate-900">{totalOrders}</p>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
          Live Auctions
        </span>
        <p className="text-2xl font-black text-emerald-600">{liveAuctionsCount}</p>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
          Total Products / Listings
        </span>
        <p className="text-2xl font-black text-slate-900">{totalAuctionsCount}</p>
      </div>
    </div>
  );
}
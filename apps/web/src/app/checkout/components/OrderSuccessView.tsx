'use client';

import React from 'react';
import Link from 'next/link';

interface OrderSuccessViewProps {
  orderId: string;
  fullName: string;
  address: string;
  city: string;
  zip: string;
  totalAmount: number;
}

export default function OrderSuccessView({
  orderId,
  fullName,
  address,
  city,
  zip,
  totalAmount,
}: OrderSuccessViewProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-2xl mx-auto text-center space-y-6 shadow-sm">
      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto">
        ✓
      </div>

      <div>
        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
          Payment Verified via Webhook
        </span>
        <h2 className="text-2xl font-black text-slate-900 mt-1">Congratulations on Winning!</h2>
        <p className="text-xs text-slate-500 mt-1">
          Order <span className="font-mono text-purple-900 font-bold">#{orderId}</span> has been confirmed.
        </p>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs space-y-2">
        <div className="flex justify-between font-bold text-slate-800 pb-2 border-b">
          <span>Item Delivered To:</span>
          <span className="text-purple-600">{fullName}</span>
        </div>
        <p className="text-slate-600">
          {address}, {city}, {zip}
        </p>
        <div className="pt-2 flex justify-between font-black text-slate-900 border-t">
          <span>Total Paid:</span>
          <span className="text-purple-950">${totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex gap-4 justify-center pt-2">
        <Link
          href="/auctions"
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-6 py-3 rounded-xl transition shadow-md shadow-purple-600/20"
        >
          Return to Marketplace
        </Link>
        <Link
          href="/seller/dashboard"
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-6 py-3 rounded-xl transition"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

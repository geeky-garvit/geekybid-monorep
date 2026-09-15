'use client';

import React from 'react';
import Image from 'next/image';
import { Auction } from '@/lib/store';

interface CheckoutOrderSummaryProps {
  auction: Auction;
  shippingFee: number;
  estimatedTax: number;
  totalAmount: number;
}

export default function CheckoutOrderSummary({
  auction,
  shippingFee,
  estimatedTax,
  totalAmount,
}: CheckoutOrderSummaryProps) {
  const winningBid = auction.currentHighestBid;

  return (
    <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
      <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
        Order Summary
      </h3>

      <div className="flex items-center gap-3 pb-4 border-b">
        <div className="relative w-14 h-14 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
          <Image
            src={auction.images[0]}
            alt={auction.title}
            fill
            className="object-cover"
            sizes="56px"
          />
        </div>
        <div>
          <h4 className="font-bold text-slate-900 text-xs line-clamp-1">{auction.title}</h4>
          <span className="text-[10px] text-purple-600 font-bold uppercase">{auction.category}</span>
        </div>
      </div>

      <div className="space-y-2 text-xs font-medium text-slate-600 border-b pb-4">
        <div className="flex justify-between">
          <span>Winning Bid Price</span>
          <span className="font-bold text-slate-900">${winningBid.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Shipping & Handling</span>
          <span className="font-bold text-slate-900">${shippingFee.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Estimated Tax (8%)</span>
          <span className="font-bold text-slate-900">${estimatedTax.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex justify-between items-center text-sm font-black text-slate-900 pt-1">
        <span>Total Amount Due</span>
        <span className="text-purple-950 text-base">${totalAmount.toFixed(2)}</span>
      </div>
    </div>
  );
}
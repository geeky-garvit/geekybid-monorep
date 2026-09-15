'use client';

import React from 'react';
import Image from 'next/image';

export interface OrderItem {
  id?: string;
  title: string;
  price: number;
  quantity?: number;
  image?: string;
}

export interface Order {
  id: string;
  createdAt?: string;
  isPaid: boolean;
  amount: number;
  items?: OrderItem[];
}

interface OrderCardProps {
  order: Order;
}

export default function OrderCard({ order }: OrderCardProps) {
  const formattedDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Recent';

  const totalAmount = order.amount ?? 0;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
      {/* Order Summary Header */}
      <div className="flex flex-wrap justify-between items-center border-b border-slate-100 pb-3 gap-2">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase">Order ID</span>
          <p className="text-xs font-mono font-bold text-slate-800">{order.id}</p>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase">Placed On</span>
          <p className="text-xs font-semibold text-slate-600">{formattedDate}</p>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Status</span>
          <span
            className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
              order.isPaid
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200/60'
                : 'bg-amber-100 text-amber-800 border border-amber-200/60'
            }`}
          >
            {order.isPaid ? '● Paid' : '○ Pending Payment'}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total</span>
          <p className="text-sm font-black text-purple-950">${totalAmount.toFixed(2)}</p>
        </div>
      </div>

      {/* Purchased Items Grid */}
      {order.items && order.items.length > 0 && (
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Purchased Items ({order.items.length})
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {order.items.map((item, idx) => {
              const itemPrice = item.price ?? 0;
              const itemQty = item.quantity ?? 1;

              return (
                <div
                  key={item.id || `item-${idx}`}
                  className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100"
                >
                  {item.image && (
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-200 bg-white">
                      <Image
                        src={item.image}
                        alt={item.title || 'Product Image'}
                        fill
                        unoptimized 
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1 text-xs">
                    <p className="font-bold text-slate-800 truncate">
                      {item.title || 'Auction Item'}
                    </p>
                    <span className="text-slate-500 font-medium text-[11px]">
                      ${itemPrice.toFixed(2)} × {itemQty}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
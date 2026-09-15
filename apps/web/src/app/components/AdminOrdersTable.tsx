'use client';

import React from 'react';
import { Order } from '@/lib/store';

interface OrdersTableProps {
  orders: Order[];
  onTogglePaymentStatus: (id: string) => void;
}

export default function AdminOrdersTable({
  orders,
  onTogglePaymentStatus,
}: OrdersTableProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-400">
              <th className="p-4">Order ID</th>
              <th className="p-4">Winner / Buyer ID</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Payment Status</th>
              <th className="p-4 text-right">Toggle Payment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">
                  No orders recorded yet.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-4 font-bold text-slate-800">{order.id}</td>
                  <td className="p-4 text-slate-500">{order.winnerId}</td>
                  <td className="p-4 font-black text-purple-950">
                    ${order.amount?.toFixed(2)}
                  </td>
                  <td className="p-4">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        order.isPaid
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {order.isPaid ? 'Paid' : 'Unpaid / Pending'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => onTogglePaymentStatus(order.id)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-lg transition"
                    >
                      Mark as {order.isPaid ? 'Unpaid' : 'Paid'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import OrderCard, { Order } from './components/OrderCard';
import { getOrdersByUser, initializeStore, subscribeToStore } from '@/lib/store';

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const userId = user?.id;

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function fetchOrders() { await initializeStore(); if (isMounted) { setOrders(getOrdersByUser(userId!)); setLoading(false); } }

    fetchOrders();

    const unsubscribe = subscribeToStore(() => setOrders(getOrdersByUser(userId!)));
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [userId]);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Order History</h1>
        <p className="text-slate-500 text-sm">Please log in to view your order history.</p>
        <Link
          href="/login"
          className="inline-block bg-purple-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-purple-700 transition"
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto" />
        <p className="text-xs font-medium text-slate-500">Fetching your orders...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">My Orders</h1>
        <span className="text-xs font-semibold text-slate-500">
          {orders.length} {orders.length === 1 ? 'order' : 'orders'} placed
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4 shadow-sm">
          <span className="text-3xl block">📦</span>
          <p className="text-slate-500 text-sm font-medium">You have no order history yet.</p>
          <Link
            href="/auctions"
            className="inline-block bg-purple-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-purple-700 transition"
          >
            Explore Marketplace
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}

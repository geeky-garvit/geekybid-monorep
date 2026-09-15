'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AdminMetrics from '../components/AdminMetrics';
import AdminAuctionsTable from '../components/AdminAuctionsTable';
import AdminOrdersTable from '../components/AdminOrdersTable';
import { adminCloseAuctionAction, adminDeleteAuctionAction } from '@/app/actions/auction';

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'auctions' | 'orders'>('auctions');
  const [auctions, setAuctions] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [passkey, setPasskey] = useState('');
  const [passkeyError, setPasskeyError] = useState('');

  // 1. Check client mount & sessionStorage safely to prevent Next.js SSR crashes
  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const unlocked = sessionStorage.getItem('geekybid_admin_unlocked') === 'true';
      setAdminUnlocked(unlocked);
    }
  }, []);

  // 2. Fetch live data with defensive error handling
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    
    // Fetch Auctions Data safely
    try {
      const res = await fetch('/api/auctions?status=all&limit=100');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAuctions(data.data || []);
        }
      }
    } catch (err) {
      console.error('Failed to fetch auctions from API:', err);
    }

    // Fetch Orders Data safely
    try {
      const ordersRes = await fetch('/api/orders');
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData.orders || ordersData.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch orders from API:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (adminUnlocked) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [adminUnlocked, fetchDashboardData]);

  // 3. Handle Closing Auctions via Server Action
  const handleCloseAuction = useCallback(async (auctionId: string) => {
    try {
      const result = await adminCloseAuctionAction(auctionId);
      if (result?.success) {
        setAuctions((prev) =>
          prev.map((item) =>
            item.id === auctionId ? { ...item, status: 'ENDED' } : item
          )
        );
      } else {
        alert(result?.error || 'Failed to close auction');
      }
    } catch (err) {
      console.error('Error closing auction:', err);
      alert('An unexpected error occurred while closing the auction.');
    }
  }, []);

  // 4. Handle Deleting Auctions via Server Action
  const handleDeleteAuction = useCallback(async (auctionId: string) => {
    if (!confirm('Are you sure you want to delete this auction listing?')) return;
    
    try {
      const result = await adminDeleteAuctionAction(auctionId);
      if (result?.success) {
        setAuctions((prev) => prev.filter((item) => item.id !== auctionId));
      } else {
        alert(result?.error || 'Failed to delete auction');
      }
    } catch (err) {
      console.error('Error deleting auction:', err);
      alert('An unexpected error occurred while deleting the auction.');
    }
  }, []);

  // 5. Handle Payment Status Toggle
  const handleTogglePaymentStatus = useCallback(async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/toggle-payment`, {
        method: 'PATCH',
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId ? { ...order, isPaid: !order.isPaid } : order
          )
        );
      }
    } catch (err) {
      console.error('Failed to toggle payment status:', err);
    }
  }, []);

  // 6. Compute metrics
  const totalRevenue = useMemo(
    () =>
      orders
        .filter((order) => order.isPaid)
        .reduce((sum, order) => sum + (order.amount || 0), 0),
    [orders]
  );

  const liveAuctionsCount = useMemo(
    () => auctions.filter((auction) => auction.status === 'ACTIVE' || auction.status === 'live').length,
    [auctions]
  );

  // Prevent hydration mismatches before mounting
  if (!isMounted) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto" />
      </div>
    );
  }

  // Passkey Lock Screen
  if (!adminUnlocked) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (passkey === 'ankur sir jindabad') {
              if (typeof window !== 'undefined') {
                sessionStorage.setItem('geekybid_admin_unlocked', 'true');
              }
              setAdminUnlocked(true);
            } else {
              setPasskeyError('Incorrect passkey.');
            }
          }}
          className="bg-white border border-slate-200 rounded-2xl shadow-sm p-7 space-y-4"
        >
          <div>
            <h1 className="text-xl font-black text-slate-900">Admin access</h1>
            <p className="text-xs text-slate-500 mt-1">
              Enter the passkey to open the admin console.
            </p>
          </div>
          <input
            type="password"
            autoFocus
            value={passkey}
            onChange={(event) => {
              setPasskey(event.target.value);
              setPasskeyError('');
            }}
            placeholder="Passkey"
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-600"
          />
          {passkeyError && (
            <p className="text-xs font-semibold text-rose-600">{passkeyError}</p>
          )}
          <button 
            type="submit"
            className="w-full rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white hover:bg-purple-700 transition"
          >
            Unlock Admin
          </button>
        </form>
      </div>
    );
  }

  // Loading State
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto" />
        <p className="text-xs font-semibold text-slate-500 mt-3">
          Loading admin metrics from database...
        </p>
      </div>
    );
  }

  // Admin Dashboard View
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Admin Console</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Manage product listings, monitor revenue, and handle store orders.
          </p>
        </div>
        <span className="bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1.5 rounded-full">
          Super Admin Mode
        </span>
      </div>

      <AdminMetrics
        totalRevenue={totalRevenue}
        totalOrders={orders.length}
        liveAuctionsCount={liveAuctionsCount}
        totalAuctionsCount={auctions.length}
      />

      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('auctions')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'auctions'
              ? 'bg-purple-600 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Auctions Management ({auctions.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'orders'
              ? 'bg-purple-600 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Orders Log ({orders.length})
        </button>
      </div>

      {activeTab === 'auctions' ? (
        <AdminAuctionsTable
          auctions={auctions}
          onCloseAuction={handleCloseAuction}
          onDeleteAuction={handleDeleteAuction}
        />
      ) : (
        <AdminOrdersTable
          orders={orders}
          onTogglePaymentStatus={handleTogglePaymentStatus}
        />
      )}
    </div>
  );
}
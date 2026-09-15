'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface ActivityItem {
  action: 'USER_REGISTERED' | 'USER_LOGGED_IN' | 'BID_PLACED' | 'AUCTION_CREATED' | 'AUCTION_WON';
  details?: string;
  amount?: number;
  timestamp: string;
}

interface ProfileData {
  profile: {
    id: string;
    name: string;
    email: string;
    avatar: string;
    role: string;
    createdAt: string;
  };
  stats: {
    totalAuctionsCreated: number;
    totalBidsPlaced: number;
  };
  activities: ActivityItem[];
}

export default function ProfilePage() {
  const { user, isLoaded } = useAuth();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/user/profile');
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.message || 'Failed to load profile.');
        }

        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (isLoaded && user) {
      fetchProfile();
    } else if (isLoaded && !user) {
      setLoading(false);
    }
  }, [user, isLoaded]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-700 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="text-center max-w-md bg-white p-8 rounded-3xl border border-slate-200 shadow-lg">
          <h2 className="text-2xl font-black text-slate-900">Access Restricted</h2>
          <p className="mt-2 text-sm text-slate-500">Please sign in to view your profile and account activity.</p>
          <Link
            href="/login"
            className="mt-6 inline-block bg-purple-700 hover:bg-purple-800 text-white font-bold px-6 py-3 rounded-xl transition"
          >
            Sign In
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Header Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative w-24 h-24 rounded-full overflow-hidden bg-slate-100 border-2 border-purple-200 flex-shrink-0">
            <Image
              src={data?.profile.avatar || user.avatar}
              alt={user.name}
              fill
              className="object-cover"
            />
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">{user.name}</h1>
                <p className="text-sm font-medium text-slate-500">{user.email}</p>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 self-center sm:self-start uppercase tracking-wider">
                {user.role || 'Collector'}
              </span>
            </div>

            {/* Account Quick Stats */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center sm:text-left">
                <span className="block text-xs font-bold uppercase text-slate-400">Auctions Hosted</span>
                <span className="text-2xl font-black text-slate-900">{data?.stats.totalAuctionsCreated ?? 0}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center sm:text-left">
                <span className="block text-xs font-bold uppercase text-slate-400">Total Bids Placed</span>
                <span className="text-2xl font-black text-purple-700">{data?.stats.totalBidsPlaced ?? 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* MongoDB Activity Log Feed */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Recent Activity Timeline</h2>
            <span className="text-xs font-semibold text-slate-400">Live from MongoDB</span>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold rounded-2xl">
              ⚠️ {error}
            </div>
          )}

          {!data?.activities || data.activities.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">No recent activity recorded yet.</p>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {data.activities.map((act, idx) => (
                <div key={idx} className="relative flex flex-col gap-1">
                  <span className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-purple-600 ring-4 ring-white" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
                      {act.action.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(act.timestamp).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  {act.details && <p className="text-sm font-medium text-slate-700">{act.details}</p>}
                  {act.amount && (
                    <span className="text-sm font-black text-slate-900">${act.amount.toLocaleString()}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
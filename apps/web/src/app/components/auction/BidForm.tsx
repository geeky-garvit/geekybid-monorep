'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { placeBidAction } from '@/app/actions/auction';

export interface Bid {
  id: string;
  bidderName: string;
  amount: number;
  time: string | Date;
}

interface Props {
  auctionId: string;
  initialHighestBid: number;
  minIncrement: number;
  initialBidsCount: number;
  initialHistory: Bid[];
  endTime?: string | Date;
}

export default function BidForm({
  auctionId,
  initialHighestBid,
  minIncrement,
  initialBidsCount,
  initialHistory,
  endTime,
}: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const [isPending, setIsPending] = useState(false);

  const [highestBid, setHighestBid] = useState(initialHighestBid);
  const [bidsCount, setBidsCount] = useState(initialBidsCount);
  const [history, setHistory] = useState<Bid[]>(initialHistory);

  const minAllowed = highestBid + minIncrement;
  const [amount, setAmount] = useState<number>(minAllowed);
  const [isAuctionExpired, setIsAuctionExpired] = useState(false);

  useEffect(() => {
    setHighestBid(initialHighestBid);
    setBidsCount(initialBidsCount);
    setHistory(initialHistory);
  }, [initialHighestBid, initialBidsCount, initialHistory]);

  useEffect(() => {
    const nextMin = highestBid + minIncrement;
    setAmount(Number(nextMin.toFixed(2)));
  }, [highestBid, minIncrement]);

  useEffect(() => {
    if (!endTime) return;
    const checkExpiry = () => {
      setIsAuctionExpired(new Date(endTime).getTime() <= Date.now());
    };
    checkExpiry();
    const interval = setInterval(checkExpiry, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  const maskName = (name: string) => {
    if (!name || name.length <= 2) return 'a***r';
    return `${name[0]}***${name[name.length - 1]}`;
  };

  const handleQuickBid = (increment: number) => {
    const nextAmount = minAllowed + increment;
    setAmount(Number(nextAmount.toFixed(2)));
  };

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isAuctionExpired) {
      toast.error('Auction Has Ended!');
      return;
    }

    if (!user) {
      toast.error('You must be signed in to place a bid!', {
        action: {
          label: 'Sign In',
          onClick: () => router.push(`/login?redirectTo=/auctions/${auctionId}`),
        },
      });
      return;
    }

    if (amount < minAllowed) {
      toast.error(`Bid must be at least $${minAllowed.toFixed(2)}.`);
      return;
    }

    setIsPending(true);

    try {
      const res = await placeBidAction(auctionId, amount);

      if (!res.success) {
        toast.error(res.message);
        if (res.message.includes('Authentication required') || res.message.includes('sign in')) {
          router.push(`/login?redirectTo=/auctions/${auctionId}`);
        }
        return;
      }

      const newHighest = res.highestBid ?? amount;
      setHighestBid(newHighest);
      setBidsCount((prev) => prev + 1);

      const newBidRecord: Bid = {
        id: Date.now().toString(),
        bidderName: user.name || 'You',
        amount: newHighest,
        time: new Date().toISOString(),
      };

      setHistory((prev) => [newBidRecord, ...prev]);
      toast.success(res.message);
      router.refresh();
    } catch (error) {
      console.error('Bid Submission Error:', error);
      toast.error('An unexpected error occurred while placing your bid.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Current Highest Bid
            </span>
            <span className="text-3xl font-black text-purple-950">
              ${highestBid.toFixed(2)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Total Bids
            </span>
            <span className="text-xl font-black text-purple-900">{bidsCount}</span>
          </div>
        </div>

        <form onSubmit={handleAction} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Your Bid ($) — Min: ${minAllowed.toFixed(2)}
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full p-3 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-purple-600 outline-none transition disabled:bg-slate-50"
              disabled={isPending || isAuctionExpired}
              required
            />
          </div>

          <div className="flex gap-2">
            {[5, 10, 25].map((inc) => (
              <button
                key={inc}
                type="button"
                disabled={isPending || isAuctionExpired}
                onClick={() => handleQuickBid(inc)}
                className="flex-1 py-1.5 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                +${inc}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={isPending || isAuctionExpired}
            className={`w-full font-bold py-3 rounded-xl transition shadow-sm ${
              isAuctionExpired
                ? 'bg-red-100 text-red-600 cursor-not-allowed'
                : user
                ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/20'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isAuctionExpired
              ? 'Auction Ended'
              : isPending
              ? 'Placing Bid...'
              : user
              ? 'Place Bid'
              : 'Sign In to Place Bid'}
          </button>
        </form>
      </div>

      <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl">
        <h3 className="text-sm font-bold text-slate-800 mb-3">
          Bid History ({history.length})
        </h3>
        {history.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No bids placed yet. Be the first!</p>
        ) : (
          <div className="space-y-2">
            {history.map((bid) => (
              <div
                key={bid.id}
                className="flex justify-between items-center text-xs py-1.5 border-b border-slate-200/60 last:border-b-0"
              >
                <span className="font-semibold text-slate-700">{maskName(bid.bidderName)}</span>
                <span className="font-bold text-purple-950">${bid.amount.toFixed(2)}</span>
                <span className="text-[10px] text-slate-400">
                  {new Date(bid.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
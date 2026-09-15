// src/components/auction/AuctionTimer.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { User } from '@/lib/store';

interface Props {
  endTime: string;
  initialStatus: 'live' | 'ended';
  winner?: User | null;
  seller: User;
}

export default function AuctionTimer({ endTime, initialStatus, winner, seller }: Props) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isEnded, setIsEnded] = useState(initialStatus === 'ended');

  useEffect(() => {
    const updateTimer = () => {
      const diff = new Date(endTime).getTime() - new Date().getTime();

      if (diff <= 0) {
        setTimeLeft('Auction Ended');
        setIsEnded(true);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs
          .toString()
          .padStart(2, '0')}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  return (
    <div className="space-y-4">
      {/* Seller Badge */}
      <div className="flex items-center gap-3 p-3 bg-slate-100 rounded-xl">
        <div className="relative w-10 h-10 rounded-full border border-slate-300 overflow-hidden shrink-0">
          <Image
            src={seller.avatar || 'https://api.dicebear.com/9.x/avataaars/svg?seed=Seller'}
            alt={seller.name || 'Seller'}
            fill
            className="object-cover"
            sizes="40px"
          />
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 block uppercase">
            Listed By Seller
          </span>
          <span className="text-sm font-bold text-slate-800">{seller.name}</span>
        </div>
      </div>

      {/* Countdown / Winner Status */}
      {!isEnded ? (
        <div className="bg-purple-950 text-white p-4 rounded-2xl flex justify-between items-center shadow-inner">
          <div>
            <span className="text-xs font-bold text-purple-300 uppercase block">
              Time Remaining
            </span>
            <span className="text-2xl font-black font-mono tracking-wider text-emerald-400">
              {timeLeft}
            </span>
          </div>
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-3 py-1 rounded-full animate-pulse">
            LIVE BIDDING
          </span>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏆</span>
            <h4 className="font-bold text-amber-900 text-sm">Auction Completed</h4>
          </div>
          {winner ? (
            <div className="flex items-center gap-3 pt-2 border-t border-amber-200/60">
              <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border border-amber-300">
                <Image
                  src={winner.avatar || 'https://api.dicebear.com/9.x/avataaars/svg?seed=Winner'}
                  alt={winner.name}
                  fill
                  className="object-cover"
                  sizes="32px"
                />
              </div>
              <p className="text-xs text-amber-800">
                Winning Bidder: <strong className="text-amber-950">{winner.name}</strong>
              </p>
            </div>
          ) : (
            <p className="text-xs text-amber-700 italic">No bids were placed before time expired.</p>
          )}
        </div>
      )}
    </div>
  );
}
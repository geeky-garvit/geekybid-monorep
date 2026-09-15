
'use client';

import { useState, useEffect } from 'react';
import { calculateTimeRemaining, TimeLeft } from '@/lib/auction-timer';
import { getServerTime } from '@/app/actions/time';

interface SynchronizedTimerProps {
  endTimeISO: string; 
  onAuctionEnd?: () => void;
}

export default function SynchronizedTimer({ endTimeISO, onAuctionEnd }: SynchronizedTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    let timerId: NodeJS.Timeout;

    async function initTimer() {
      
      const initialServerTime = await getServerTime();
      let localOffset = Date.now() - initialServerTime;

      const updateClock = () => {
        
        const currentSyncedTime = Date.now() - localOffset;
        const computed = calculateTimeRemaining(endTimeISO, currentSyncedTime);

        setTimeLeft(computed);

        if (computed.isEnded) {
          if (onAuctionEnd) onAuctionEnd();
          clearInterval(timerId);
        }
      };

      
      updateClock();

     
      timerId = setInterval(updateClock, 1000);
    }

    initTimer();

    return () => clearInterval(timerId);
  }, [endTimeISO, onAuctionEnd]);

  if (!timeLeft) {
    return <span className="text-xs text-slate-400 font-bold animate-pulse">Syncing clock...</span>;
  }

  if (timeLeft.isEnded) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
        🔒 Auction Ended
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-mono font-bold shadow-sm">
      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
      <span>
        {timeLeft.days > 0 && `${timeLeft.days}d `}
        {String(timeLeft.hours).padStart(2, '0')}:
        {String(timeLeft.minutes).padStart(2, '0')}:
        {String(timeLeft.seconds).padStart(2, '0')}
      </span>
    </div>
  );
}
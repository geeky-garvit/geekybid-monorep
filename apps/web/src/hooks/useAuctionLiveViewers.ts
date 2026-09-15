'use client';

import { useState, useEffect, useRef } from 'react';

function getSessionId(userId?: string): string {
  if (userId) return userId;
  if (typeof window === 'undefined') return `guest-${Math.random().toString(36).slice(2)}`;
  return `guest-${Math.random().toString(36).slice(2)}`;
}

export function useAuctionLiveViewers(auctionId: string | undefined, userId?: string) {
  const [liveViewers, setLiveViewers] = useState<number>(1);
  const sessionIdRef = useRef<string>('');

  useEffect(() => {
    if (!auctionId) return;

    const sessionId = getSessionId(userId);
    sessionIdRef.current = sessionId;

    const registerView = async () => {
      try {
        await fetch(`/api/auctions/${encodeURIComponent(auctionId)}/view`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
      } catch (err) {
        console.error('Failed to register view', err);
      }
    };

    const fetchLiveViewers = async () => {
      try {
        const res = await fetch(`/api/auctions/${encodeURIComponent(auctionId)}/live-viewers`);
        if (res.ok) {
          const data = await res.json();
          if (typeof data.liveViewers === 'number') {
            setLiveViewers(data.liveViewers);
          }
        }
      } catch (err) {
        console.error('Failed to fetch live viewers', err);
      }
    };

    const sendHeartbeat = async () => {
      try {
        await fetch(`/api/auctions/${encodeURIComponent(auctionId)}/heartbeat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: sessionIdRef.current }),
        });
      } catch (err) {
        console.error('Heartbeat failed', err);
      }
    };

    registerView();
    fetchLiveViewers();

    const heartbeatTimer = setInterval(sendHeartbeat, 30000);
    const pollTimer = setInterval(fetchLiveViewers, 15000);

    return () => {
      clearInterval(heartbeatTimer);
      clearInterval(pollTimer);
    };
  }, [auctionId, userId]);

  return { liveViewers };
}

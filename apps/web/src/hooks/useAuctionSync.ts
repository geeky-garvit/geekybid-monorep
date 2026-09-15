// src/hooks/useAuctionSync.ts
'use client';

import { useEffect, useState } from 'react';

export function useAuctionSync(intervalMs: number = 3000) {
  const [lastSync, setLastSync] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setLastSync(new Date());
    }, intervalMs);

    return () => clearInterval(timer);
  }, [intervalMs]);

  return lastSync;
}
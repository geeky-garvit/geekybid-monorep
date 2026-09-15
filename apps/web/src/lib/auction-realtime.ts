type AuctionEventType = 'NEW_BID' | 'AUCTION_CREATED' | 'AUCTION_UPDATED';

export interface AuctionSocketEvent {
  type: AuctionEventType;
  auctionId: string;
  payload: Record<string, unknown>;
  sentAt: string;
}

const auctionSubscribers = new Map<string, Set<(event: AuctionSocketEvent) => void>>();

export function subscribeAuction(auctionId: string, listener: (event: AuctionSocketEvent) => void) {
  const listeners = auctionSubscribers.get(auctionId) ?? new Set();
  listeners.add(listener);
  auctionSubscribers.set(auctionId, listeners);

  return () => {
    const next = auctionSubscribers.get(auctionId);
    if (!next) return;

    next.delete(listener);
    if (next.size === 0) {
      auctionSubscribers.delete(auctionId);
    }
  };
}

export function emitAuctionEvent(auctionId: string, type: AuctionEventType, payload: Record<string, unknown>) {
  const event: AuctionSocketEvent = {
    type,
    auctionId,
    payload,
    sentAt: new Date().toISOString(),
  };

  const listeners = auctionSubscribers.get(auctionId);
  if (!listeners) return;

  for (const listener of listeners) {
    listener(event);
  }
}

export function serializeAuctionEvent(event: AuctionSocketEvent) {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
}

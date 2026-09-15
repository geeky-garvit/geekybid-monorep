/** Shared in-memory marketplace data for the app shell. */
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface Bid {
  id: string;
  bidderId: string;
  bidderName: string;
  amount: number;
  time: string;
}

export interface Auction {
  id: string;
  title: string;
  description: string;
  category: string;
  startingPrice: number;
  currentHighestBid: number;
  minIncrement: number;
  bidsCount: number;
  images: string[];
  endTime: string;
  status: 'live' | 'ended' | 'paid';
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  history: Bid[];
}

export interface Watchlist {
  userId: string;
  auctionId: string;
}

export interface Order {
  id: string;
  auctionId: string;
  winnerId: string;
  amount: number;
  isPaid: boolean;
  createdAt: string;
}

interface GlobalStore {
  users: User[];
  auctions: Auction[];
  watchlists: Watchlist[];
  orders: Order[];
  currentUser: User | null;
  isInitialized: boolean;
}

interface FilterOptions {
  category?: string;
  status?: string;
  search?: string;
}

export interface CreateAuctionPayload {
  title: string;
  description: string;
  category: string;
  startingPrice: number;
  minIncrement: number;
  images: string[];
  endTime: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
}

export function getAvatarUrl(seed: string) {
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}

const users: User[] = [
  { id: 'user_bidder1', name: 'Alex Vance', email: 'alex@example.com', avatar: getAvatarUrl('Alex') },
  { id: 'user_seller1', name: 'Sarah Connor', email: 'sarah@example.com', avatar: getAvatarUrl('Sarah') },
  { id: 'user_bidder2', name: 'David Light', email: 'david@example.com', avatar: getAvatarUrl('David') },
];

export const store: GlobalStore = {
  users,
  auctions: [],
  watchlists: [],
  orders: [],
  currentUser: users[0],
  isInitialized: false,
};

function persist() {
  return;
}

export function subscribeToStore(listener: () => void) {
  return () => {};
}

export async function initializeStore() {
  if (store.isInitialized) return;
  store.isInitialized = true;
  closeExpiredAuctions();
}

export function saveAuctions(auctions: Auction[]) {
  store.auctions = auctions;
}

export function getAuctions(filter?: FilterOptions) {
  closeExpiredAuctions();
  let result = store.auctions.map((a) => ({
    ...a,
    history: [...a.history],
    images: [...a.images],
    bidsCount: a.history.length,
  }));

  if (filter?.category && filter.category !== 'all') {
    result = result.filter((a) => a.category === filter.category);
  }
  if (filter?.status && filter.status !== 'all') {
    result = result.filter((a) => a.status === filter.status);
  }
  if (filter?.search) {
    const q = filter.search.toLowerCase();
    result = result.filter(
      (a) => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
    );
  }
  return result;
}

export function getAuctionById(id: string) {
  closeExpiredAuctions();
  return store.auctions.find((a) => a.id === decodeURIComponent(id));
}

export function getAuctionsBySeller(id: string) {
  return getAuctions().filter((a) => a.sellerId === id);
}

export function getBidsByUser(id: string) {
  return getAuctions()
    .filter((a) => a.history.some((b) => b.bidderId === id))
    .map((auction) => ({
      auction,
      userBids: auction.history.filter((b) => b.bidderId === id),
    }));
}

export function getOrdersByUser(id: string) {
  return store.orders.filter((o) => o.winnerId === id);
}

export function getWatchlistByUser(id: string) {
  return getAuctions().filter((a) =>
    store.watchlists.some((w) => w.userId === id && w.auctionId === a.id)
  );
}

export function toggleWatchlist(userId: string, auctionId: string) {
  const found = store.watchlists.findIndex(
    (w) => w.userId === userId && w.auctionId === auctionId
  );
  if (found >= 0) {
    store.watchlists.splice(found, 1);
    persist();
    return false;
  }
  store.watchlists.push({ userId, auctionId });
  persist();
  return true;
}

export function placeBid(auctionId: string, amount: number, userId: string, userName: string) {
  const auction = getAuctionById(auctionId);
  if (!auction) throw new Error('Auction not found.');
  if (auction.status !== 'live' || Date.now() >= new Date(auction.endTime).getTime()) {
    throw new Error('Bidding closed! This auction has ended.');
  }
  if (auction.sellerId === userId) {
    throw new Error('Sellers cannot bid on their own auctions.');
  }

  const minimum = auction.currentHighestBid + auction.minIncrement;
  if (!Number.isFinite(amount) || amount < minimum) {
    throw new Error(`Bid must be at least $${minimum.toFixed(2)}.`);
  }

  if (new Date(auction.endTime).getTime() - Date.now() <= 120000) {
    auction.endTime = new Date(new Date(auction.endTime).getTime() + 120000).toISOString();
  }

  auction.currentHighestBid = amount;
  auction.history.unshift({
    id: `bid-${Date.now()}`,
    bidderId: userId,
    bidderName: userName,
    amount,
    time: new Date().toISOString(),
  });
  auction.bidsCount = auction.history.length;
  persist();
  return auction;
}

export function createAuction(data: CreateAuctionPayload) {
  const auction: Auction = {
    ...data,
    id: `auction-${Date.now()}`,
    currentHighestBid: data.startingPrice,
    bidsCount: 0,
    status: 'live',
    history: [],
  };
  store.auctions.unshift(auction);
  persist();
  return auction;
}

export function updateAuctionDetails(
  id: string,
  sellerId: string,
  updates: Pick<Auction, 'title' | 'category' | 'description'>
) {
  const auction = getAuctionById(id);
  if (!auction) throw new Error('Auction not found.');
  if (auction.sellerId !== sellerId) throw new Error('You can only edit your own auctions.');
  if (auction.history.length) throw new Error('Cannot edit an auction with existing bids.');
  Object.assign(auction, updates);
  persist();
  return auction;
}

export function closeExpiredAuctions() {
  const closed: { auctionId: string; winner: string | null; amount: number }[] = [];
  store.auctions.forEach((a) => {
    if (a.status === 'live' && new Date(a.endTime).getTime() <= Date.now()) {
      a.status = 'ended';
      const winner = a.history[0];
      if (winner && !store.orders.some((o) => o.auctionId === a.id)) {
        store.orders.unshift({
          id: `order-${Date.now()}-${a.id}`,
          auctionId: a.id,
          winnerId: winner.bidderId,
          amount: winner.amount,
          isPaid: false,
          createdAt: new Date().toISOString(),
        });
      }
      closed.push({
        auctionId: a.id,
        winner: winner?.bidderName || null,
        amount: winner?.amount || 0,
      });
    }
  });
  if (closed.length) persist();
  return closed;
}

export function createOrder(auctionId: string, winnerId: string, amount: number) {
  const existing = store.orders.find((o) => o.auctionId === auctionId && o.winnerId === winnerId);
  if (existing) return existing;
  const order = {
    id: `order-${Date.now()}`,
    auctionId,
    winnerId,
    amount,
    isPaid: false,
    createdAt: new Date().toISOString(),
  };
  store.orders.unshift(order);
  persist();
  return order;
}

export function markOrderPaid(id: string) {
  const order = store.orders.find((o) => o.id === id);
  if (!order) throw new Error('Order not found.');
  order.isPaid = true;
  const auction = store.auctions.find((a) => a.id === order.auctionId);
  if (auction) auction.status = 'paid';
  persist();
  return order;
}

export function setOrderPaymentStatus(id: string, isPaid: boolean) {
  const order = store.orders.find((o) => o.id === id);
  if (!order) throw new Error('Order not found.');
  order.isPaid = isPaid;
  const auction = store.auctions.find((a) => a.id === order.auctionId);
  if (auction && !isPaid && auction.status === 'paid') auction.status = 'ended';
  if (auction && isPaid) auction.status = 'paid';
  persist();
  return order;
}

export function deleteAuction(id: string) {
  store.auctions = store.auctions.filter((a) => a.id !== id);
  persist();
}
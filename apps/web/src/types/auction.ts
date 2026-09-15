/**
 * Shared Auction & Bidding Domain Models
 */

export type AuctionCategory =
  | 'photography'
  | 'electronics'
  | 'art'
  | 'collectibles'
  | 'jewelry'
  | 'fashion';

export type AuctionStatus = 'live' | 'ended' | 'upcoming';

export interface Bid {
  id: string;
  auctionId: string;
  bidderId: string;
  bidderName: string;
  amount: number;
  createdAt: Date | string;
}

export interface Auction {
  id: string;
  title: string;
  description: string;
  category: AuctionCategory;
  status: AuctionStatus;
  startingPrice: number;
  currentHighestBid: number;
  minIncrement: number;
  bidsCount: number;
  images: string[];
  sellerId: string;
  sellerName?: string;
  sellerAvatar?: string;
  endTime: Date | string;
  createdAt: Date | string;
  updatedAt?: Date | string;
  history?: Bid[];
}

export interface AuctionFilters {
  category?: AuctionCategory | 'all';
  status?: AuctionStatus | 'all';
  search?: string;
  sortBy?: 'endingSoon' | 'priceLow' | 'priceHigh' | 'mostBids' | 'newest';
  page?: number;
  limit?: number;
}
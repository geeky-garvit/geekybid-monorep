import React from 'react';
import { prisma } from '@/lib/db';
import { AuctionStatus } from '@prisma/client';
import InfiniteAuctionGrid from '@/app/components/auction/InfiniteAuctionGrid';
import AuctionHorizontalFilter from './components/AuctionSidebarFilter';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

interface SearchParams {
  category?: string;
  status?: string;
  minPrice?: string;
  maxPrice?: string;
  endingWithin?: string;
  sortBy?: string;
  search?: string;
  t?: string; // Cache buster timestamp parameter
}

export default async function AuctionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const queryParams = await searchParams;

  const category = queryParams.category || 'all';
  const status = queryParams.status || 'live';
  const minPrice = queryParams.minPrice ? parseFloat(queryParams.minPrice) : undefined;
  const maxPrice = queryParams.maxPrice ? parseFloat(queryParams.maxPrice) : undefined;
  const endingWithin = queryParams.endingWithin ? parseInt(queryParams.endingWithin, 10) : undefined;
  const sortBy = queryParams.sortBy || 'endingSoon';
  const search = queryParams.search || '';
  const timestamp = queryParams.t || Date.now().toString();

  const whereFilter: any = {};
  const now = new Date();

  // 1. Category Filter
  if (category !== 'all') {
    whereFilter.category = { equals: category, mode: 'insensitive' };
  }

  // 2. Status & Expiration Filter (FIXED: Using strictly typed AuctionStatus values)
  if (status === 'live' || status === 'ACTIVE') {
    whereFilter.status = { in: [AuctionStatus.ACTIVE] };
    whereFilter.endTime = { gt: now };
  } else if (status === 'ended') {
    whereFilter.OR = [
      { status: { in: [AuctionStatus.ENDED, AuctionStatus.CANCELLED] } },
      { endTime: { lte: now } },
    ];
  } else if (status !== 'all') {
    // Sanitize string if custom status parameter is passed
    const upperStatus = status.toUpperCase() as AuctionStatus;
    if (Object.values(AuctionStatus).includes(upperStatus)) {
      whereFilter.status = { equals: upperStatus };
    }
  }

  // 3. Search Query
  if (search.trim()) {
    whereFilter.OR = [
      { title: { contains: search.trim(), mode: 'insensitive' } },
      { description: { contains: search.trim(), mode: 'insensitive' } },
    ];
  }

  // 4. Price Range Filter
  if ((minPrice !== undefined && !isNaN(minPrice)) || (maxPrice !== undefined && !isNaN(maxPrice))) {
    whereFilter.currentPrice = {};
    if (minPrice !== undefined && !isNaN(minPrice)) {
      whereFilter.currentPrice.gte = minPrice;
    }
    if (maxPrice !== undefined && !isNaN(maxPrice)) {
      whereFilter.currentPrice.lte = maxPrice;
    }
  }

  // 5. Time Limit Filter
  if (endingWithin !== undefined && !isNaN(endingWithin)) {
    const cutoffDate = new Date(Date.now() + endingWithin * 3600 * 1000);
    whereFilter.endTime = {
      ...(whereFilter.endTime || {}),
      lte: cutoffDate,
      gt: now,
    };
  }

  // 6. Sorting Order
  let orderBy: any = { endTime: 'asc' };
  if (sortBy === 'priceAsc') orderBy = { currentPrice: 'asc' };
  if (sortBy === 'priceDesc') orderBy = { currentPrice: 'desc' };
  if (sortBy === 'newest') orderBy = { createdAt: 'desc' };

  // Fetch count and paginated items in parallel
  const limit = 8;
  const [totalCount, dbAuctions] = await Promise.all([
    prisma.auction.count({ where: whereFilter }),
    prisma.auction.findMany({
      where: whereFilter,
      orderBy,
      take: limit + 1,
      include: {
        seller: { select: { id: true, name: true, avatar: true } },
        bids: {
          orderBy: { timestamp: 'desc' },
          include: { user: { select: { name: true, avatar: true } } },
        },
        _count: { select: { bids: true } },
      },
    }),
  ]);

  const hasMore = dbAuctions.length > limit;
  const rawItems = hasMore ? dbAuctions.slice(0, limit) : dbAuctions;
  const initialNextCursor = hasMore ? rawItems[rawItems.length - 1].id : null;

  const items = rawItems.map((a: any) => {
    let mappedStatus: 'live' | 'ended' | 'paid' = 'live';

    if (a.status === AuctionStatus.ENDED || a.status === AuctionStatus.CANCELLED) {
      mappedStatus = 'ended';
    } else if (new Date(a.endTime) <= now) {
      mappedStatus = 'ended';
    }

    return {
      id: a.id,
      title: a.title,
      description: a.description,
      category: a.category,
      startingBid: a.startingBid,
      startingPrice: a.startingBid,
      currentHighestBid: a.currentPrice,
      minIncrement: a.minIncrement,
      status: mappedStatus,
      images: a.images,
      endTime: a.endTime.toISOString(),
      sellerId: a.sellerId,
      sellerName: a.seller?.name || 'Seller',
      sellerAvatar: a.seller?.avatar || '',
      bidsCount: a._count.bids,
      history: a.bids.map((b: any) => {
        const isoTimeString = b.timestamp.toISOString();
        return {
          id: b.id,
          amount: b.amount,
          bidderId: b.userId,
          time: isoTimeString,
          timestamp: isoTimeString,
          bidderName: b.user?.name || 'Anonymous',
          bidderAvatar: b.user?.avatar || '',
        };
      }),
    };
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <AuctionHorizontalFilter
          search={search}
          category={category}
          status={status}
          minPrice={minPrice}
          maxPrice={maxPrice}
          endingWithin={endingWithin}
          sortBy={sortBy}
        />

        <section className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-black text-slate-900">
              Auction Marketplace{' '}
              <span className="text-xs font-normal text-slate-500">
                ({totalCount} {totalCount === 1 ? 'item' : 'items'})
              </span>
            </h1>
          </div>

          <InfiniteAuctionGrid
            key={`grid-${category}-${status}-${search}-${sortBy}-${minPrice}-${maxPrice}-${timestamp}-${items.length}`}
            initialItems={items}
            initialNextCursor={initialNextCursor}
          />
        </section>
      </main>
    </div>
  );
}
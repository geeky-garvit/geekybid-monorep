import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// Helper to determine the model dynamically if schema casing varies
function getWatchlistModel() {
  return (prisma as any).watchlist || (prisma as any).watchList;
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    const { searchParams } = new URL(request.url);
    const userId = authUser?.id || searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const watchlistModel = getWatchlistModel();
    if (!watchlistModel) {
      return NextResponse.json(
        { success: false, error: 'Watchlist model not found on Prisma Client' },
        { status: 500 }
      );
    }

    const items = await watchlistModel.findMany({
      where: { userId },
      include: {
        auction: {
          include: {
            seller: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
            _count: {
              select: { bids: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const normalizedAuctions = items
      .filter((w: any) => Boolean(w.auction))
      .map((w: any) => {
        const a = w.auction;
        return {
          id: a.id,
          title: a.title,
          description: a.description,
          category: a.category,
          startingBid: a.startingBid ?? a.startingPrice ?? 0,
          startingPrice: a.startingPrice ?? a.startingBid ?? 0,
          currentHighestBid: a.currentPrice ?? a.currentHighestBid ?? a.startingBid ?? 0,
          minIncrement: a.minIncrement ?? 1,
          status: typeof a.status === 'string' ? a.status.toLowerCase() : 'live',
          images: Array.isArray(a.images) ? a.images : [],
          endTime: a.endTime ? new Date(a.endTime).toISOString() : new Date().toISOString(),
          sellerId: a.sellerId,
          sellerName: a.seller?.name || 'Seller',
          sellerAvatar: a.seller?.avatar || '',
          bidsCount: a._count?.bids ?? 0,
        };
      });

    return NextResponse.json({ success: true, watchlist: normalizedAuctions });
  } catch (error) {
    console.error('Watchlist GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch watchlist' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    const body = await request.json().catch(() => ({}));
    const { auctionId, userId: bodyUserId } = body;

    const userId = authUser?.id || bodyUserId;

    if (!userId || !auctionId) {
      return NextResponse.json(
        { success: false, error: 'Missing userId or auctionId' },
        { status: 400 }
      );
    }

    const watchlistModel = getWatchlistModel();
    if (!watchlistModel) {
      return NextResponse.json(
        { success: false, error: 'Watchlist model not found on Prisma Client' },
        { status: 500 }
      );
    }

    const existing = await watchlistModel.findFirst({
      where: { userId, auctionId },
    });

    if (existing) {
      await watchlistModel.delete({
        where: { id: existing.id },
      });
      revalidatePath('/watchlist');
      return NextResponse.json({ success: true, isWatchlisted: false });
    }

    await watchlistModel.create({
      data: { userId, auctionId },
    });

    revalidatePath('/watchlist');
    return NextResponse.json({ success: true, isWatchlisted: true });
  } catch (error) {
    console.error('Watchlist toggle error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update watchlist' },
      { status: 500 }
    );
  }
}
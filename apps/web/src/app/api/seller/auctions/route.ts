import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get('sellerId');

    if (!sellerId) {
      return NextResponse.json(
        { success: false, error: 'Seller ID parameter is required.' },
        { status: 400 }
      );
    }

    const auctions = await prisma.auction.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
      include: {
        seller: { select: { id: true, name: true, avatar: true } },
        bids: {
          orderBy: { timestamp: 'desc' },
          include: { user: { select: { name: true, avatar: true } } },
        },
        _count: { select: { bids: true } },
      },
    });

    const now = new Date();

    const normalizedAuctions = auctions.map((a :any) => {
      let mappedStatus: 'live' | 'ended' | 'paid' = 'live';
      const normalized = a.status.toLowerCase();

      if (normalized === 'ended' || normalized === 'closed') {
        mappedStatus = 'ended';
      } else if (normalized === 'paid' || normalized === 'completed') {
        mappedStatus = 'paid';
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
        history: a.bids.map((b : any) => {
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

    return NextResponse.json({ success: true, auctions: normalizedAuctions });
  } catch (error) {
    console.error('Error fetching seller auctions:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
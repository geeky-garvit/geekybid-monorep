import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Direct database fetch with relational sorting by timestamp
    let auction = await prisma.auction.findUnique({
      where: { id },
      include: {
        seller: {
          select: { id: true, name: true, avatar: true, email: true },
        },
        bids: {
          orderBy: { timestamp: 'desc' },
          include: {
            user: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
      },
    });

    if (!auction) {
      return NextResponse.json(
        { success: false, error: 'Auction not found in database' },
        { status: 404 }
      );
    }

    // Auto-update auction status in database if expired
    const isExpired = new Date(auction.endTime) <= new Date();
    if (isExpired && auction.status === 'ACTIVE') {
      auction = await prisma.auction.update({
        where: { id },
        data: { status: 'ENDED' },
        include: {
          seller: { select: { id: true, name: true, avatar: true, email: true } },
          bids: {
            orderBy: { timestamp: 'desc' },
            include: {
              user: { select: { id: true, name: true, avatar: true } },
            },
          },
        },
      });
    }

    // Map status string to union type: 'live' | 'ended' | 'paid'
    let mappedStatus: 'live' | 'ended' | 'paid' = 'live';
    const normalizedStatus = auction.status ? auction.status.toLowerCase() : '';

    if (normalizedStatus === 'paid' || normalizedStatus === 'completed') {
      mappedStatus = 'paid';
    } else if (normalizedStatus === 'ended' || normalizedStatus === 'closed' || isExpired) {
      mappedStatus = 'ended';
    }

    // Map formatted bid array
    const formattedBids = auction.bids.map((b:any) => {
      const isoTimeString = new Date(b.timestamp).toISOString();
      return {
        id: b.id,
        amount: Number(b.amount),
        time: isoTimeString,
        timestamp: isoTimeString,
        bidderId: b.userId,
        bidderName: b.user?.name || 'Anonymous',
        bidderAvatar: b.user?.avatar || '',
      };
    });

    const formattedAuction = {
      id: auction.id,
      title: auction.title,
      description: auction.description,
      category: auction.category,
      startingBid: Number(auction.startingBid ?? 0),
      startingPrice: Number(auction.startingBid ?? 0),
      currentPrice: Number(auction.currentPrice ?? auction.startingBid ?? 0),
      currentHighestBid: Number(auction.currentPrice ?? auction.startingBid ?? 0),
      minIncrement: Number(auction.minIncrement ?? 1),
      status: mappedStatus,
      rawStatus: auction.status,
      images: Array.isArray(auction.images) ? auction.images : [],
      attributes: (auction as Record<string, unknown>).attributes || {},
      endTime: auction.endTime ? new Date(auction.endTime).toISOString() : new Date().toISOString(),
      sellerId: auction.sellerId,
      sellerName: auction.seller?.name || 'Seller',
      sellerAvatar: auction.seller?.avatar || '',
      bidsCount: formattedBids.length,
      bids: formattedBids,
      history: formattedBids,
    };

    return NextResponse.json(
      { success: true, auction: formattedAuction },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error) {
    console.error('Error fetching auction by ID:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
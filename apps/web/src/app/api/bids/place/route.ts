import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { emitAuctionEvent } from '@/lib/auction-realtime';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please sign in to place a bid.' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body.auctionId !== 'string' || typeof body.amount !== 'number') {
      return NextResponse.json(
        { success: false, message: 'auctionId and amount are required.' },
        { status: 400 }
      );
    }

    const { auctionId, amount } = body;
    if (Number.isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Bid amount must be greater than zero.' },
        { status: 400 }
      );
    }

    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        bids: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!auction) {
      return NextResponse.json({ success: false, message: 'Auction not found.' }, { status: 404 });
    }

    if (auction.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, message: 'This auction is no longer accepting bids.' },
        { status: 400 }
      );
    }

    if (new Date(auction.endTime).getTime() <= Date.now()) {
      return NextResponse.json(
        { success: false, message: 'This auction has already ended.' },
        { status: 400 }
      );
    }

    const minimumBid = Math.max(auction.startingBid, auction.currentPrice || auction.startingBid) + (auction.minIncrement ?? 1);
    if (amount < minimumBid) {
      return NextResponse.json(
        { success: false, message: `Bid must be at least ₹${minimumBid.toFixed(2)}.` },
        { status: 400 }
      );
    }

    if (auction.sellerId === authUser.id) {
      return NextResponse.json(
        { success: false, message: 'You cannot bid on your own auction.' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const bid = await tx.bid.create({
        data: {
          amount,
          auctionId: auction.id,
          userId: authUser.id,
        },
      });

      const updatedAuction = await tx.auction.update({
        where: { id: auction.id },
        data: {
          currentPrice: amount,
          highestBidderId: authUser.id,
        },
      });

      return { bid, updatedAuction };
    });

    emitAuctionEvent(auctionId, 'NEW_BID', {
      auctionId,
      currentPrice: result.updatedAuction.currentPrice,
      amount,
      bidCount: (auction.bids?.length ?? 0) + 1,
      highestBidder: {
        id: authUser.id,
        name: authUser.name ?? 'Bidder',
        avatar: authUser.avatar ?? null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Bid placed successfully.',
      data: {
        auctionId,
        currentPrice: result.updatedAuction.currentPrice,
        bidId: result.bid.id,
      },
    });
  } catch (error) {
    console.error('Bid placement failed:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to place bid.' },
      { status: 500 }
    );
  }
}

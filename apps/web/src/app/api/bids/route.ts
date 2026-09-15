import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate via JWT Cookie
    const token =
      request.cookies.get('token')?.value ||
      request.cookies.get('user_session')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please sign in to place a bid.' },
        { status: 401 }
      );
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired session token.' },
        { status: 401 }
      );
    }

    // 2. Parse & Validate Input
    const body = await request.json().catch(() => null);
    const { amount, auctionId } = body || {};

    if (!auctionId || typeof auctionId !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Auction ID is required.' },
        { status: 400 }
      );
    }

    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Valid numeric bid amount is required.' },
        { status: 400 }
      );
    }

    // 3. Atomic Database Operations
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findFirst({
        where: {
          OR: [{ email: decoded.email }, { id: decoded.id || decoded.userId }],
        },
      });

      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      const auction = await tx.auction.findUnique({
        where: { id: auctionId },
        include: { bids: true },
      });

      if (!auction) {
        throw new Error('AUCTION_NOT_FOUND');
      }

      if (auction.sellerId === user.id) {
        throw new Error('SELF_BIDDING_FORBIDDEN');
      }

      const isEnded =
        auction.status === 'ENDED' ||
        (auction.endTime && new Date(auction.endTime).getTime() <= Date.now());

      if (isEnded) {
        throw new Error('AUCTION_ENDED');
      }

      const minIncrement = auction.minIncrement || 1;
      const currentHighPrice = auction.currentPrice ?? auction.startingBid ?? 0;
      const minRequiredBid = currentHighPrice + minIncrement;

      if (amount < minRequiredBid) {
        throw new Error(`BID_TOO_LOW:$${minRequiredBid.toFixed(2)}`);
      }

      const newBid = await tx.bid.create({
        data: {
          amount,
          auctionId: auction.id,
          userId: user.id,
        },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
      });

      const updatedAuction = await tx.auction.update({
        where: { id: auction.id },
        data: {
          currentPrice: amount,
          highestBidderId: user.id,
        },
        include: { bids: true },
      });

      await tx.activity.create({
        data: {
          userId: user.id,
          action: 'BID_PLACED',
          amount,
          details: `Placed bid of ₹${amount} on "${auction.title}"`,
        },
      });

      return { newBid, updatedAuction };
    });

    return NextResponse.json({
      success: true,
      message: 'Bid placed successfully!',
      data: {
        bid: {
          id: result.newBid.id,
          amount: result.newBid.amount,
          bidderId: result.newBid.userId,
          bidderName: result.newBid.user?.name || 'Anonymous',
          bidderAvatar: result.newBid.user?.avatar || '',
          timestamp: new Date(result.newBid.timestamp).toISOString(),
        },
        auction: {
          id: result.updatedAuction.id,
          currentHighestBid: result.updatedAuction.currentPrice,
          bidsCount: result.updatedAuction.bids.length,
          status: result.updatedAuction.status,
        },
      },
    });
  } catch (error: any) {
    if (error.message === 'USER_NOT_FOUND') {
      return NextResponse.json({ success: false, message: 'User account not found.' }, { status: 404 });
    }
    if (error.message === 'AUCTION_NOT_FOUND') {
      return NextResponse.json({ success: false, message: 'Auction not found.' }, { status: 404 });
    }
    if (error.message === 'SELF_BIDDING_FORBIDDEN') {
      return NextResponse.json({ success: false, message: 'You cannot place a bid on your own auction.' }, { status: 400 });
    }
    if (error.message === 'AUCTION_ENDED') {
      return NextResponse.json({ success: false, message: 'This auction has already concluded.' }, { status: 400 });
    }
    if (error.message?.startsWith('BID_TOO_LOW:')) {
      const minBid = error.message.split(':')[1];
      return NextResponse.json({ success: false, message: `Bid must be at least ${minBid}.` }, { status: 400 });
    }

    console.error('Bidding Error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to process bid submission.' },
      { status: 500 }
    );
  }
}

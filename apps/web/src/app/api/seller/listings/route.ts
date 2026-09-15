import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { AuctionStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get('sellerId');

    if (!sellerId) {
      return NextResponse.json(
        { error: 'sellerId query parameter is required' },
        { status: 400 }
      );
    }

    const rawListings = await prisma.auction.findMany({
      where: { sellerId },
      include: {
        bids: true,
        _count: { select: { bids: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const listings = rawListings.map((listing) => ({
      ...listing,
      image: listing.images[0] || null, // Updated from listing.image to listing.images[0]
      startingBid: listing.startingBid, // Updated from listing.startPrice
      currentPrice: listing.currentPrice || listing.startingBid,
      endTime: listing.endTime, // Updated from listing.endDate
      bidCount: listing._count.bids,
    }));

    return NextResponse.json({ listings });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch listings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, category, startingBid, images, endTime, sellerId } = body;

    if (!title || !category || !startingBid || !sellerId || !endTime) {
      return NextResponse.json(
        { error: 'Missing required auction fields.' },
        { status: 400 }
      );
    }

    const newAuction = await prisma.auction.create({
      data: {
        title,
        description: description || '',
        category,
        startingBid: Number(startingBid), // Updated from startPrice
        currentPrice: Number(startingBid),
        images: Array.isArray(images) ? images : [images].filter(Boolean),
        endTime: new Date(endTime),
        status: AuctionStatus.ACTIVE,
        sellerId,
      },
    });

    return NextResponse.json({ auction: newAuction }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create listing';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
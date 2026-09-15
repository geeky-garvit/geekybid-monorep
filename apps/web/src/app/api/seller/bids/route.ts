import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bids = await prisma.bid.findMany({
      where: {
        auction: {
          sellerId: user.id,
        },
      },
      include: {
        auction: {
          select: { title: true, id: true },
        },
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });

    const formattedBids = bids.map((bid) => ({
      id: bid.id,
      listingId: bid.auction.id,
      listingTitle: bid.auction.title,
      bidderName: bid.user?.name || bid.user?.email || 'Anonymous',
      amount: bid.amount,
      createdAt: bid.timestamp.toISOString(),
    }));

    return NextResponse.json(formattedBids);
  } catch (error) {
    console.error('Error fetching seller bids:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
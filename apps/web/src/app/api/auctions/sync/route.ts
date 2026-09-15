import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

// Mock bot accounts for simulating live marketplace bidding activity
const BOT_BIDDERS = [
  { name: 'CollectorPro', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=CollectorPro' },
  { name: 'VintageVault', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=VintageVault' },
  { name: 'BidMaster99', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=BidMaster99' },
  { name: 'RareFindsHQ', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=RareFindsHQ' },
];

async function syncAndSimulateAuctions() {
  const now = new Date();

  // Step 1: Automatically close expired auctions in bulk
  await prisma.auction.updateMany({
    where: {
      status: 'ACTIVE',
      endTime: { lte: now },
    },
    data: {
      status: 'ENDED',
    },
  });

  // Step 2: Fetch all active auctions to simulate activity
  const activeAuctions = await prisma.auction.findMany({
    where: {
      status: 'ACTIVE',
      endTime: { gt: now },
    },
    include: {
      seller: { select: { id: true, name: true, avatar: true } },
      bids: {
        orderBy: { timestamp: 'desc' },
        take: 5,
        include: { user: { select: { id: true, name: true, avatar: true } } },
      },
      _count: { select: { bids: true } },
    },
  });

  // Step 3: Simulate occasional bot bids (30% chance per sync call per active auction)
  for (const auction of activeAuctions) {
    const shouldSimulateBid = Math.random() < 0.3;

    if (shouldSimulateBid) {
      const bot = BOT_BIDDERS[Math.floor(Math.random() * BOT_BIDDERS.length)];

      // Ensure bot user exists in database
      const botUser = await prisma.user.upsert({
        where: { email: `${bot.name.toLowerCase()}@bot.marketplace` },
        update: {},
        create: {
          name: bot.name,
          email: `${bot.name.toLowerCase()}@bot.marketplace`,
          passwordHash: '$2a$10$botpasswordhashmock123',
          avatar: bot.avatar,
        },
      });

      // Calculate next valid bid amount
      const currentPrice = auction.currentPrice ?? auction.startingBid ?? 0;
      const minIncrement = auction.minIncrement ?? 1;
      const nextBidAmount = currentPrice + minIncrement;

      // Create simulated bid and update current price atomically
      await prisma.$transaction([
        prisma.bid.create({
          data: {
            amount: nextBidAmount,
            auctionId: auction.id,
            userId: botUser.id,
          },
        }),
        prisma.auction.update({
          where: { id: auction.id },
          data: {
            currentPrice: nextBidAmount,
            highestBidderId: botUser.id,
          },
        }),
      ]);

      revalidatePath(`/auction/${auction.id}`);
    }
  }

  // Step 4: Fetch final normalized auction list after sync operations
  const allAuctions = await prisma.auction.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      seller: { select: { id: true, name: true, avatar: true } },
      _count: { select: { bids: true } },
    },
  });

  revalidatePath('/auctions');

  return allAuctions.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    category: a.category,
    startingBid: a.startingBid,
    currentPrice: a.currentPrice ?? a.startingBid,
    minIncrement: a.minIncrement,
    status: new Date(a.endTime) <= now ? 'ended' : a.status.toLowerCase(),
    images: a.images || [],
    endTime: a.endTime.toISOString(),
    sellerId: a.sellerId,
    sellerName: a.seller?.name || 'Seller',
    bidsCount: a._count.bids,
  }));
}

export async function GET(request: NextRequest) {
  try {
    const auctions = await syncAndSimulateAuctions();
    return NextResponse.json({ success: true, auctions });
  } catch (error) {
    console.error('Failed to sync auctions:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to sync auctions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auctions = await syncAndSimulateAuctions();
    return NextResponse.json({ success: true, auctions });
  } catch (error) {
    console.error('Failed to sync auctions:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to sync auctions' },
      { status: 500 }
    );
  }
}
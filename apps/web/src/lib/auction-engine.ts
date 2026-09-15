'use server';

import { prisma, closeExpiredAuctions, logUserActivity } from '@/lib/db';

export async function syncAndSimulateAuctions() {
  try {
    // 1. Close any auctions whose endTime has passed in the database
    await closeExpiredAuctions();

    // 2. Fetch all currently active auctions
    const liveAuctions = await prisma.auction.findMany({
      where: {
        status: 'ACTIVE',
        endTime: { gt: new Date() },
      },
    });

    // 3. Perform random automated bid simulation if live auctions exist
    if (liveAuctions.length > 0) {
      const randomAuction = liveAuctions[Math.floor(Math.random() * liveAuctions.length)];
      
      // Select a random registered user to simulate bidding
      const users = await prisma.user.findMany({ take: 20 });
      const eligibleUsers = users.filter((u) => u.id !== randomAuction.sellerId);

      if (eligibleUsers.length > 0) {
        const randomUser = eligibleUsers[Math.floor(Math.random() * eligibleUsers.length)];
        
        const currentPrice = randomAuction.currentPrice ?? randomAuction.startingBid;
        const nextBidAmount = parseFloat((currentPrice + randomAuction.minIncrement).toFixed(2));

        // Place simulated bid inside an atomic Prisma transaction
        await prisma.$transaction(async (tx) => {
          await tx.bid.create({
            data: {
              amount: nextBidAmount,
              auctionId: randomAuction.id,
              userId: randomUser.id,
            },
          });

          await tx.auction.update({
            where: { id: randomAuction.id },
            data: {
              currentPrice: nextBidAmount,
              highestBidderId: randomUser.id,
            },
          });
        });

        await logUserActivity({
          userId: randomUser.id,
          action: 'BID_PLACED',
          amount: nextBidAmount,
          details: `Simulated bid placed on ${randomAuction.title}`,
        });
      }
    }

    // 4. Return the updated list of active auctions
    const updatedAuctions = await prisma.auction.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      include: {
        seller: { select: { id: true, name: true, avatar: true } },
        bids: { take: 1, orderBy: { timestamp: 'desc' } },
      },
    });

    return updatedAuctions;
  } catch (error) {
    console.error('Error during auction sync and simulation:', error);
    return [];
  }
}
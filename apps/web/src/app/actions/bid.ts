'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { type TransactionClient } from '@/lib/db';
export interface PlaceBidResponse {
  success: boolean;
  message: string;
  highestBid?: number;
  newEndTime?: Date;
  timeExtended?: boolean;
}

export async function placeBidAction(
  auctionId: string,
  amount: number
): Promise<PlaceBidResponse> {
  try {
    // 1. Authenticate user
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        message: 'Authentication required. Please sign in to place a bid.',
      };
    }

    // 2. Perform Atomic Transaction with Pessimistic Locking
    const result = await prisma.$transaction(async (tx: TransactionClient) => {
      // Lock auction row (SELECT ... FOR UPDATE) to eliminate concurrent race conditions
      const auctions: any[] = await tx.$queryRaw`
        SELECT * FROM "Auction" WHERE id = ${auctionId} FOR UPDATE
      `;
      const auction = auctions[0];

      if (!auction) {
        throw new Error('Auction listing not found.');
      }

      // Prevent seller from bidding on their own item
      if (auction.sellerId === currentUser.id) {
        throw new Error('You cannot place a bid on your own auction.');
      }

      const now = new Date();
      const endTime = new Date(auction.endTime);
      const statusUpper = auction.status ? auction.status.toUpperCase() : '';

      if (now >= endTime || (statusUpper !== 'ACTIVE' && statusUpper !== 'LIVE')) {
        throw new Error('Bidding closed! This auction has ended.');
      }

      const minBidRequired = Number(auction.currentPrice) + Number(auction.minIncrement);
      if (amount < minBidRequired) {
        throw new Error(`Bid must be at least $${minBidRequired.toFixed(2)}.`);
      }

      // Anti-sniping rule: extend by 2 minutes if bid placed within last 2 minutes
      let newEndTime = new Date(endTime);
      let timeExtended = false;
      const timeRemainingMs = endTime.getTime() - now.getTime();

      if (timeRemainingMs < 2 * 60 * 1000) {
        newEndTime = new Date(now.getTime() + 2 * 60 * 1000);
        timeExtended = true;
      }

      // A. Create Bid Record
      await tx.bid.create({
        data: {
          amount,
          auctionId,
          userId: currentUser.id,
        },
      });

      // B. Update Auction Record
      const updatedAuction = await tx.auction.update({
        where: { id: auctionId },
        data: {
          currentPrice: amount,
          highestBidderId: currentUser.id,
          endTime: newEndTime,
        },
      });

      // C. Record User Activity Log
      await tx.activity.create({
        data: {
          userId: currentUser.id,
          action: 'PLACED_BID',
          details: `Placed bid of $${amount} on "${auction.title}"`,
          amount,
        },
      });

      return { updatedAuction, timeExtended };
    });

    // 3. Purge Next.js static cache
    revalidatePath(`/auction/${auctionId}`);
    revalidatePath('/auctions');
    revalidatePath('/seller/dashboard');
    revalidatePath('/');

    return {
      success: true,
      message: result.timeExtended
        ? `Bid accepted! ⚡ Anti-sniping protection activated: Time extended by 2 minutes.`
        : `Bid placed successfully. New highest bid: $${Number(result.updatedAuction.currentPrice).toFixed(2)}`,
      highestBid: Number(result.updatedAuction.currentPrice),
      newEndTime: result.updatedAuction.endTime,
      timeExtended: result.timeExtended,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while placing your bid.',
    };
  }
}
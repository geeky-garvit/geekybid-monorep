'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { type TransactionClient } from '@/lib/db';
export interface CreateAuctionInput {
  title: string;
  description: string;
  category: string;
  startingBid: number;
  minIncrement?: number;
  images: string[];
  endTime: string;
}

export interface UpdateAuctionPayload {
  id: string;
  title: string;
  category: string;
  description: string;
}

export interface PlaceBidResponse {
  success: boolean;
  message: string;
  highestBid?: number;
  newEndTime?: Date;
  timeExtended?: boolean;
}

// 1. Place Bid Action (Row-locked & Enum-safe)
export async function placeBidAction(
  auctionId: string,
  amount: number
): Promise<PlaceBidResponse> {
  try {
    // --------------------------------------------------
    // 1. AUTHENTICATION
    // --------------------------------------------------
    const currentUser = await getCurrentUser();

    if (!currentUser?.id) {
      return {
        success: false,
        message: 'Authentication required. Please sign in again.',
      };
    }

    // --------------------------------------------------
    // 2. VALIDATE INPUT
    // --------------------------------------------------
    if (!auctionId) {
      return { success: false, message: 'Auction ID is required.' };
    }

    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
      return { success: false, message: 'Please enter a valid bid amount.' };
    }

    // --------------------------------------------------
    // 3. VERIFY USER EXISTS IN DATABASE
    // --------------------------------------------------
    const dbUser = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { id: true, name: true },
    });

    if (!dbUser) {
      return {
        success: false,
        message: 'User account not found. Please sign in again.',
      };
    }

    // --------------------------------------------------
    // 4. ATOMIC TRANSACTION WITH ROW LOCKING
    // --------------------------------------------------
    const result = await prisma.$transaction(async (tx: TransactionClient) => {
      // Lock auction row to prevent race conditions
      const auctions = await tx.$queryRaw<
        Array<{
          id: string;
          title: string;
          sellerId: string;
          currentPrice: number;
          startingBid: number;
          minIncrement: number;
          status: string;
          endTime: Date;
        }>
      >`
        SELECT id, title, "sellerId", "currentPrice", "startingBid", "minIncrement", status, "endTime"
        FROM "Auction"
        WHERE id = ${auctionId}
        FOR UPDATE
      `;

      const auction = auctions[0];

      if (!auction) {
        throw new Error('AUCTION_NOT_FOUND');
      }

      if (auction.sellerId === dbUser.id) {
        throw new Error('SELF_BIDDING');
      }

      const now = new Date();
      const endTime = new Date(auction.endTime);
      const status = String(auction.status || '').toUpperCase();

      if (now >= endTime || !['ACTIVE', 'LIVE'].includes(status)) {
        throw new Error('AUCTION_ENDED');
      }

      const currentPrice = Number(auction.currentPrice ?? auction.startingBid ?? 0);
      const minIncrement = Number(auction.minIncrement ?? 1);
      const minimumBid = currentPrice + minIncrement;

      if (amount < minimumBid) {
        throw new Error(`BID_TOO_LOW:${minimumBid.toFixed(2)}`);
      }

      // Anti-sniping extension (2 minutes)
      let newEndTime = endTime;
      let timeExtended = false;
      const remainingTime = endTime.getTime() - now.getTime();

      if (remainingTime < 2 * 60 * 1000) {
        newEndTime = new Date(now.getTime() + 2 * 60 * 1000);
        timeExtended = true;
      }

      // Create Bid
      const newBid = await tx.bid.create({
        data: {
          amount,
          auctionId: auction.id,
          userId: dbUser.id,
        },
      });

      // Update Auction
      const updatedAuction = await tx.auction.update({
        where: { id: auction.id },
        data: {
          currentPrice: amount,
          highestBidderId: dbUser.id,
          endTime: newEndTime,
        },
      });

      // Activity Log (BID_PLACED - exact enum match)
      await tx.activity.create({
        data: {
          userId: dbUser.id,
          action: 'BID_PLACED',
          details: `Placed bid of $${amount.toFixed(2)} on "${auction.title}"`,
          amount,
        },
      });

      return { updatedAuction, newBid, timeExtended };
    });

    // --------------------------------------------------
    // 5. REVALIDATE PATHS & RETURN
    // --------------------------------------------------
    revalidatePath(`/auction/${auctionId}`);
    revalidatePath(`/auctions/${auctionId}`);
    revalidatePath('/auctions');
    revalidatePath('/seller/dashboard');
    revalidatePath('/');

    return {
      success: true,
      message: result.timeExtended
        ? 'Bid accepted! Auction extended by 2 minutes.'
        : 'Bid placed successfully!',
      highestBid: Number(result.updatedAuction.currentPrice),
      newEndTime: result.updatedAuction.endTime,
      timeExtended: result.timeExtended,
    };
  } catch (error) {
    console.error('[placeBidAction Error]:', error);
    const message = error instanceof Error ? error.message : '';

    if (message === 'AUCTION_NOT_FOUND') return { success: false, message: 'Auction not found.' };
    if (message === 'SELF_BIDDING') return { success: false, message: 'You cannot bid on your own auction.' };
    if (message === 'AUCTION_ENDED') return { success: false, message: 'This auction has already ended.' };
    if (message.startsWith('BID_TOO_LOW:')) {
      return { success: false, message: `Bid must be at least $${message.split(':')[1]}.` };
    }

    return { success: false, message: 'Server error while processing your bid.' };
  }
}

// 2. Create Auction
export async function createAuctionAction(data: CreateAuctionInput) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Authentication required to create an auction.' };
    }

    const endTimeDate = new Date(data.endTime);
    if (isNaN(endTimeDate.getTime())) {
      return { success: false, error: 'Invalid end date format provided.' };
    }

    const minAllowedTime = new Date(Date.now() + 5 * 60 * 1000);
    if (endTimeDate < minAllowedTime) {
      return { success: false, error: 'Auction end time must be at least 5 minutes from now.' };
    }

    const startPrice = Number(data.startingBid);
    const increment = Number(data.minIncrement || 5.0);

    const newAuction = await prisma.$transaction(async (tx: TransactionClient) => {
      const auction = await tx.auction.create({
        data: {
          title: data.title.trim(),
          description: data.description.trim(),
          category: data.category.trim(),
          startingBid: startPrice,
          currentPrice: startPrice,
          minIncrement: increment,
          images: data.images.length > 0 ? data.images : ['https://cdn.dummyjson.com/product-images/1/thumbnail.jpg'],
          endTime: endTimeDate,
          status: 'ACTIVE',
          sellerId: currentUser.id,
        },
      });

      await tx.activity.create({
        data: {
          action: 'AUCTION_CREATED',
          details: `Created auction "${auction.title}"`,
          amount: startPrice,
          userId: currentUser.id,
        },
      });

      return auction;
    });

    revalidatePath('/auctions');
    revalidatePath('/seller/dashboard');
    revalidatePath('/');

    return { success: true, auction: newAuction };
  } catch (error) {
    console.error('[createAuctionAction error]:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create auction listing.',
    };
  }
}

// 3. Update Auction
export async function updateAuctionAction(payload: UpdateAuctionPayload) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Authentication required to edit an auction.' };
    }

    const existing = await prisma.auction.findUnique({ where: { id: payload.id } });
    if (!existing || existing.sellerId !== currentUser.id) {
      return { success: false, error: 'Unauthorized to edit this auction.' };
    }

    await prisma.auction.update({
      where: { id: payload.id },
      data: {
        title: payload.title.trim(),
        category: payload.category.trim(),
        description: payload.description.trim(),
      },
    });

    revalidatePath(`/auction/${payload.id}`);
    revalidatePath(`/auctions/${payload.id}`);
    revalidatePath('/seller/dashboard');
    revalidatePath('/auctions');

    return { success: true };
  } catch (err) {
    console.error('[updateAuctionAction error]:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update auction.',
    };
  }
}

// 4. Admin Actions
export async function adminCloseAuctionAction(auctionId: string) {
  try {
    await prisma.auction.update({
      where: { id: auctionId },
      data: { status: 'ENDED' },
    });

    revalidatePath('/auctions');
    revalidatePath(`/auction/${auctionId}`);
    revalidatePath(`/auctions/${auctionId}`);
    revalidatePath('/admin');
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('[adminCloseAuctionAction error]:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to close auction.',
    };
  }
}

export async function adminDeleteAuctionAction(auctionId: string) {
  try {
    await prisma.auction.delete({ where: { id: auctionId } });

    revalidatePath('/auctions');
    revalidatePath('/admin');
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('[adminDeleteAuctionAction error]:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete auction.',
    };
  }
}
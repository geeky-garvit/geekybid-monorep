import 'server-only';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import bcrypt from 'bcryptjs';

export type TransactionClient = Prisma.TransactionClient;
export { PrismaClient, Prisma };

if (typeof window === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is missing.');
}

const adapter = new PrismaNeon({ connectionString });

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/* ============================================================================
 * USER OPERATIONS
 * ============================================================================ */

export interface UserDoc {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  avatar: string | null;
  role: string;
  createdAt: Date;
}

export async function findUserByEmail(email: string) {
  if (!email) return null;
  const cleanEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (!user) return null;

  return {
    ...user,
    passwordHash: user.passwordHash,
  };
}

export async function createUser(data: {
  name: string;
  email: string;
  passwordRaw: string;
  avatar?: string;
  role?: string;
}) {
  const cleanEmail = data.email.toLowerCase().trim();

  const existingUser = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (existingUser) {
    throw new Error('User already exists with this email.');
  }

  const passwordHash = await bcrypt.hash(data.passwordRaw, 10);
  const avatarUrl =
    data.avatar ||
    `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(data.name.trim())}`;

  const newUser = await prisma.user.create({
    data: {
      name: data.name.trim(),
      email: cleanEmail,
      passwordHash,
      avatar: avatarUrl,
      role: data.role || 'collector',
    },
  });

  await logUserActivity({
    userId: newUser.id,
    action: 'USER_REGISTERED',
    details: 'User created an account on GeekyBid',
  });

  const { passwordHash: _, ...safeUser } = newUser;
  return safeUser;
}

/* ============================================================================
 * AUCTION OPERATIONS
 * ============================================================================ */

export interface CreateAuctionInput {
  title: string;
  description: string;
  category: string;
  startingBid: number;
  minIncrement?: number;
  images: string[];
  attributes?: Record<string, unknown>;
  endTime: Date;
  sellerId: string;
}

export async function createAuction(input: CreateAuctionInput) {
  const newAuction = await prisma.auction.create({
    data: {
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category.trim(),
      startingBid: input.startingBid,
      currentPrice: input.startingBid,
      minIncrement: input.minIncrement ?? 5.0,
      images: input.images,
      attributes: (input.attributes as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      endTime: input.endTime,
      sellerId: input.sellerId,
    },
  });

  await logUserActivity({
    userId: input.sellerId,
    action: 'AUCTION_CREATED',
    auctionId: newAuction.id,
    amount: input.startingBid,
    details: `Created auction: ${newAuction.title}`,
  });

  return newAuction;
}

export async function getAuctionById(id: string) {
  return await prisma.auction.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      startingBid: true,
      currentPrice: true,
      minIncrement: true,
      status: true,
      images: true,
      attributes: true,
      endTime: true,
      createdAt: true,
      updatedAt: true,
      sellerId: true,
      highestBidderId: true,
      seller: {
        select: { id: true, name: true, avatar: true },
      },
      bids: {
        orderBy: { timestamp: 'desc' },
        select: {
          id: true,
          amount: true,
          timestamp: true,
          userId: true,
          user: { select: { id: true, name: true, avatar: true } },
        },
      },
      _count: {
        select: { bids: true },
      },
    },
  });
}

export async function getActiveAuctions(category?: string) {
  return await prisma.auction.findMany({
    where: {
      status: 'ACTIVE',
      ...(category ? { category } : {}),
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      startingBid: true,
      currentPrice: true,
      minIncrement: true,
      status: true,
      images: true,
      attributes: true,
      endTime: true,
      createdAt: true,
      sellerId: true,
      seller: {
        select: { id: true, name: true, avatar: true },
      },
      _count: {
        select: { bids: true },
      },
    },
  });
}

export async function getAuctionResult(id: string) {
  const auction = await prisma.auction.findUnique({
    where: {
      id,
      status: 'ENDED',
    },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      images: true,
      currentPrice: true,
      status: true,
      endTime: true,
      bids: {
        orderBy: { amount: 'desc' },
        take: 1,
        select: {
          id: true,
          amount: true,
          timestamp: true,
          user: {
            select: { id: true, name: true, avatar: true },
          },
        },
      },
    },
  });

  if (!auction) return null;

  const winningBid = auction.bids[0] ?? null;

  return {
    ...auction,
    winningBid,
  };
}

export async function closeExpiredAuctions() {
  const expiredAuctions = await prisma.auction.findMany({
    where: {
      status: 'ACTIVE',
      endTime: {
        lte: new Date(),
      },
    },
    select: {
      id: true,
      title: true,
      bids: {
        orderBy: { amount: 'desc' },
        take: 1,
        select: { userId: true, amount: true },
      },
    },
  });

  for (const auction of expiredAuctions) {
    const winningBid = auction.bids[0];

    await prisma.auction.update({
      where: { id: auction.id },
      data: {
        status: 'ENDED',
        highestBidderId: winningBid?.userId ?? null,
        ...(winningBid ? { currentPrice: winningBid.amount } : {}),
      },
    });

    if (winningBid) {
      await logUserActivity({
        userId: winningBid.userId,
        action: 'AUCTION_WON',
        amount: winningBid.amount,
        details: `Won auction "${auction.title}"`,
      });
    }
  }

  return expiredAuctions.length;
}

export type CompletedAuctionItem = Prisma.PromiseReturnType<typeof getCompletedAuctions>[number];

export async function getCompletedAuctions() {
  await closeExpiredAuctions();

  const auctions = await prisma.auction.findMany({
    where: {
      status: 'ENDED',
    },
    orderBy: {
      endTime: 'desc',
    },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      startingBid: true,
      currentPrice: true,
      status: true,
      images: true,
      endTime: true,
      highestBidderId: true,
      highestBidder: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  });

  return auctions.map((auction: typeof auctions[number]) => ({
    ...auction,
    winner: auction.highestBidder,
  }));
}

/* ============================================================================
 * ACTIVITY LOGGING OPERATIONS
 * ============================================================================ */

export interface ActivityInput {
  userId: string;
  action: 'USER_REGISTERED' | 'USER_LOGGED_IN' | 'BID_PLACED' | 'AUCTION_CREATED' | 'AUCTION_WON';
  auctionId?: string;
  amount?: number;
  details?: string;
}

export async function logUserActivity(activity: ActivityInput) {
  try {
    return await prisma.activity.create({
      data: {
        userId: activity.userId,
        action: activity.action,
        details: activity.details,
        amount: activity.amount,
      },
    });
  } catch (err) {
    console.error('Failed to log activity to SQL:', err);
  }
}

export async function getUserActivityHistory(userId: string) {
  return await prisma.activity.findMany({
    where: { userId },
    orderBy: { timestamp: 'desc' },
    take: 50,
  });
}

/* ============================================================================
 * SELLER COMMUNITY OPERATIONS
 * ============================================================================ */

export async function createSellerCommunity(sellerId: string, title: string) {
  try {
    const communityId = `comm_${sellerId}`;

    const community = await prisma.community.upsert({
      where: { id: communityId },
      update: {},
      create: {
        id: communityId,
        sellerId,
        title,
      },
    });

    await prisma.communityMember.upsert({
      where: {
        communityId_userId: {
          communityId,
          userId: sellerId,
        },
      },
      update: {},
      create: {
        communityId,
        userId: sellerId,
        role: 'SELLER',
      },
    });

    return community.id;
  } catch (err) {
    console.error('Failed to create seller community in SQL:', err);
  }
}
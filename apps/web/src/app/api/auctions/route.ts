import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { AuctionStatus } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search')?.trim() || '';
    const category = searchParams.get('category');
    const status = searchParams.get('status') || 'ACTIVE';
    const sortBy = searchParams.get('sortBy') || 'endingSoon';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10', 10));

    // Auto-close any expired auctions before reading
    await prisma.auction.updateMany({
      where: {
        status: AuctionStatus.ACTIVE,
        endTime: { lte: new Date() },
      },
      data: {
        status: AuctionStatus.ENDED,
      },
    });

    const where: any = {};

    // Map status strictly against Prisma's expected Enum values
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus === 'live' || normalizedStatus === 'active') {
      where.status = AuctionStatus.ACTIVE;
      where.endTime = { gt: new Date() };
    } else if (normalizedStatus === 'ended') {
      where.OR = [
        { status: AuctionStatus.ENDED },
        { endTime: { lte: new Date() } },
      ];
    } else if (normalizedStatus !== 'all') {
      // Fallback for explicitly passed enum values (e.g. DRAFT, CANCELLED)
      const matchedEnum = Object.values(AuctionStatus).find(
        (val) => val.toLowerCase() === normalizedStatus
      );
      if (matchedEnum) {
        where.status = matchedEnum;
      }
    }

    // Category filter
    if (category && category !== 'all') {
      where.category = { equals: category, mode: 'insensitive' };
    }

    // Case-insensitive search
    if (search) {
      const searchConditions = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];

      if (where.OR) {
        // If status filter (like 'ended') already populated where.OR, wrap with AND to preserve both
        where.AND = [
          { OR: where.OR },
          { OR: searchConditions },
        ];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    // Sorting
    let orderBy: any = { endTime: 'asc' };
    switch (sortBy) {
      case 'endingSoon':
        orderBy = { endTime: 'asc' };
        break;
      case 'priceLow':
      case 'priceAsc':
        orderBy = { currentPrice: 'asc' };
        break;
      case 'priceHigh':
      case 'priceDesc':
        orderBy = { currentPrice: 'desc' };
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
    }

    const skip = (page - 1) * limit;

    const [auctions, total] = await Promise.all([
      prisma.auction.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          seller: { select: { id: true, name: true, avatar: true, email: true } },
          _count: { select: { bids: true } },
        },
      }),
      prisma.auction.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: auctions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch auctions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch auctions from database' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: 'Invalid payload.' },
        { status: 400 }
      );
    }

    const {
      title,
      category,
      description,
      startingPrice,
      startingBid,
      minIncrement,
      endTime,
      images,
      sellerId: bodySellerId,
    } = body;

    const sellerId = authUser?.id || bodySellerId;

    if (!sellerId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Seller identity missing.' },
        { status: 401 }
      );
    }

    const price = parseFloat(startingPrice || startingBid);
    const parsedEndTime = new Date(endTime);

    if (!title || isNaN(price) || price <= 0 || isNaN(parsedEndTime.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid required fields (title, positive price, valid end time).' },
        { status: 400 }
      );
    }

    // Verify user exists in DB
    let seller = await prisma.user.findUnique({
      where: { id: sellerId },
    });

    if (!seller) {
      seller = await prisma.user.create({
        data: {
          id: sellerId,
          name: authUser?.name || 'Seller',
          email: authUser?.email || `${sellerId}@example.com`,
          passwordHash: '$2a$10$placeholderhashplaceholderhash',
          avatar: authUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
        },
      });
    }

    const auction = await prisma.auction.create({
      data: {
        title: title.trim(),
        category: category || 'general',
        description: description?.trim() || '',
        startingBid: price,
        currentPrice: price,
        minIncrement: parseFloat(minIncrement) || 5,
        endTime: parsedEndTime,
        images: Array.isArray(images) ? images : [],
        status: AuctionStatus.ACTIVE,
        sellerId: seller.id,
      },
      include: {
        seller: { select: { id: true, name: true, avatar: true } },
      },
    });

    revalidatePath('/auctions');
    revalidatePath('/seller/dashboard');

    return NextResponse.json({ success: true, auction }, { status: 201 });
  } catch (error) {
    console.error('Failed to create auction in DB:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create auction in database' },
      { status: 500 }
    );
  }
}
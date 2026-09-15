import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Safely check if order model exists on prisma instance
    const db = prisma as any;
    if (!db.order) {
      return NextResponse.json({ success: true, orders: [] });
    }

    const whereCondition = user.role === 'admin' ? {} : { userId: user.id };

    const orders = await db.order.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        auction: { select: { id: true, title: true, images: true } },
      },
    });

    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.auctionId || !body.amount) {
      return NextResponse.json(
        { success: false, error: 'Missing auctionId or amount' },
        { status: 400 }
      );
    }

    const { auctionId, amount, shippingAddress } = body;
    const db = prisma as any;

    const result = await prisma.$transaction(async (tx: any) => {
      const auction = await tx.auction.findUnique({
        where: { id: auctionId },
      });

      if (!auction) {
        throw new Error('Auction not found');
      }

      let order = null;

      // Create order if model exists, otherwise update auction directly
      if (tx.order) {
        order = await tx.order.create({
          data: {
            userId: user.id,
            auctionId,
            amount: parseFloat(amount),
            isPaid: true,
            shippingAddress: shippingAddress || 'Digital Delivery',
          },
        });
      }

      await tx.auction.update({
        where: { id: auctionId },
        data: { status: 'PAID' },
      });

      return order || { id: `ord_${Date.now()}`, auctionId, amount, isPaid: true };
    });

    return NextResponse.json({ success: true, order: result }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create order:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process order' },
      { status: 500 }
    );
  }
}
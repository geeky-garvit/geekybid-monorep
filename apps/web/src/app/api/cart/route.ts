import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ items: [] });
    }

    const db = prisma as any;
    const cartItems = await db.cartItem.findMany({
      where: { userId: user.id },
      include: {
        auction: {
          include: { seller: { select: { name: true } } },
        },
      },
    });

    const formattedItems = (cartItems || [])
      .filter((ci: any) => ci.auction !== null)
      .map((ci: any) => ({
        id: ci.auction.id,
        title: ci.auction.title,
        price: Number(ci.auction.currentPrice),
        image: ci.auction.images?.[0] || '',
        quantity: ci.quantity,
        sellerName: ci.auction.seller?.name || 'Seller',
      }));

    return NextResponse.json({ items: formattedItems });
  } catch (error) {
    console.error('GET /api/cart error:', error);
    return NextResponse.json({ error: 'Failed to fetch cart items' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { itemId, quantity = 1 } = await req.json();

    if (!itemId) {
      return NextResponse.json(
        { success: false, message: 'Item ID (auctionId) is required' },
        { status: 400 }
      );
    }

    // Verify auction exists in DB to prevent foreign key constraint violations
    const auctionExists = await prisma.auction.findUnique({
      where: { id: itemId },
      select: { id: true },
    });

    if (!auctionExists) {
      return NextResponse.json(
        { success: false, message: `Auction with ID '${itemId}' does not exist.` },
        { status: 404 }
      );
    }

    const db = prisma as any;
    const cartItem = await db.cartItem.upsert({
      where: { userId_auctionId: { userId: user.id, auctionId: itemId } },
      create: { userId: user.id, auctionId: itemId, quantity },
      update: { quantity: { increment: quantity } },
    });

    return NextResponse.json({ success: true, cartItem });
  } catch (error) {
    console.error('POST /api/cart error:', error);
    return NextResponse.json({ success: false, message: 'Failed to add item to cart' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { itemId, quantity } = await req.json();

    if (!itemId) {
      return NextResponse.json({ success: false, message: 'Item ID is required' }, { status: 400 });
    }

    const db = prisma as any;
    if (quantity <= 0) {
      await db.cartItem.deleteMany({
        where: { userId: user.id, auctionId: itemId },
      });
    } else {
      await db.cartItem.update({
        where: { userId_auctionId: { userId: user.id, auctionId: itemId } },
        data: { quantity },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/cart error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update cart' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('itemId');

    if (itemId) {
      const db = prisma as any;
      await db.cartItem.deleteMany({
        where: { userId: user.id, auctionId: itemId },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/cart error:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete cart item' }, { status: 500 });
  }
}
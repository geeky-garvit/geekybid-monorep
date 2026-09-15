import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: auctionId } = await params;
    const body = await request.json().catch(() => ({}));
    const sessionId = body.sessionId || request.headers.get('x-session-id') || 'anonymous';

    if (!auctionId) {
      return NextResponse.json({ error: 'Auction ID is required' }, { status: 400 });
    }

    // 1. Verify the auction exists before creating a viewer record
    const auctionExists = await prisma.auction.findUnique({
      where: { id: auctionId },
      select: { id: true },
    });

    if (!auctionExists) {
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 });
    }

    // 2. Safe upsert now that FK validation is guaranteed
    const viewer = await prisma.auctionViewer.upsert({
      where: {
        auctionId_sessionId: {
          auctionId,
          sessionId,
        },
      },
      update: {
        lastSeen: new Date(),
      },
      create: {
        auctionId,
        sessionId,
        lastSeen: new Date(),
      },
    });

    return NextResponse.json({ success: true, viewer }, { status: 200 });
  } catch (error) {
    console.error('Error tracking auction viewer:', error);
    return NextResponse.json(
      { error: 'Failed to record viewer' },
      { status: 500 }
    );
  }
}
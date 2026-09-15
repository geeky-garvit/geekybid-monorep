import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: auctionId } = await params;
        const body = await request.json();
        const { sessionId } = body;

        if (!sessionId) {
            return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
        }

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
            },
        });

        return NextResponse.json({ success: true, viewer });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to update heartbeat' },
            { status: 500 }
        );
    }
}

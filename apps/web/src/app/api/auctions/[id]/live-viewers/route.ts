import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: auctionId } = await params;
        const activeSince = new Date(Date.now() - 60 * 1000);

        const viewerCount = await prisma.auctionViewer.count({
            where: {
                auctionId,
                lastSeen: {
                    gte: activeSince,
                },
            },
        });

        return NextResponse.json({ liveViewers: viewerCount });
    } catch (error) {
        console.error('Error fetching live viewers:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch viewer count' },
            { status: 500 }
        );
    }
}

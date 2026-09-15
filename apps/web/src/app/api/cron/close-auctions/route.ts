import { NextResponse } from 'next/server';
import { closeExpiredAuctions } from '@/lib/store';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const secretKey = process.env.CRON_SECRET;

    if (!secretKey) {
      return NextResponse.json({ error: 'Cron is not configured' }, { status: 503 });
    }

    if (authHeader !== `Bearer ${secretKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const closed = closeExpiredAuctions();

    return NextResponse.json({
      success: true,
      closedCount: closed.length,
      closed,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

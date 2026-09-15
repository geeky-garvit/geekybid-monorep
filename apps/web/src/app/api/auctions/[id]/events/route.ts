import { NextRequest } from 'next/server';
import { serializeAuctionEvent, subscribeAuction } from '@/lib/auction-realtime';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const sendEvent = (event: any) => {
        controller.enqueue(encoder.encode(serializeAuctionEvent(event)));
      };

      const unsubscribe = subscribeAuction(id, sendEvent);
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(': heartbeat\n\n'));
      }, 15000);

      const cleanup = () => {
        clearInterval(heartbeat);
        unsubscribe();
        controller.close();
      };

      request.signal.addEventListener('abort', cleanup, { once: true });
      controller.enqueue(encoder.encode('retry: 2000\n\n'));

      return cleanup;
    },
    cancel() {
      // the stream closes cleanly when the client disconnects
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

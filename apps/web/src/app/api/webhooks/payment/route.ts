
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { markOrderPaid } from '@/lib/store';

const DEMO_WEBHOOK_SECRET = 'geekybid-demo-webhook-secret';

interface PaymentWebhookPayload {
  event: string;
  data: {
    orderId: string;
    [key: string]: unknown;
  };
}

export async function POST(request: Request) {
  try {
    const bodyText = await request.text();
    const signature = request.headers.get('x-payment-signature');
    const secret = process.env.WEBHOOK_SECRET ?? DEMO_WEBHOOK_SECRET;

    if (!signature) {
      return NextResponse.json({ error: 'Missing x-payment-signature header' }, { status: 401 });
    }

    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(bodyText)
      .digest('hex');

  
    if (
  signature.length !== expectedSig.length ||
  !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))
) {
  return NextResponse.json({ error: 'Invalid HMAC signature' }, { status: 401 });
}

    const payload = JSON.parse(bodyText) as PaymentWebhookPayload;

    if (payload.event === 'payment.succeeded') {
      const { orderId } = payload.data;
      markOrderPaid(orderId);

      return NextResponse.json({ success: true, orderId });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to process webhook' },
      { status: error instanceof Error && error.message === 'Order not found.' ? 404 : 500 }
    );
  }
}

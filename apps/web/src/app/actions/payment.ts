'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { markOrderPaid, store } from '@/lib/store';

/** Completes the built-in demo payment flow without requiring a payment provider. */
export async function confirmMockPaymentAction(orderId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { success: false, error: 'Authentication required.' };

  const order = store.orders.find((item) => item.id === orderId);
  if (!order || order.winnerId !== currentUser.id) {
    return { success: false, error: 'Order not found.' };
  }

  markOrderPaid(orderId);
  revalidatePath('/orders');
  revalidatePath('/dashboard');
  revalidatePath(`/auction/${order.auctionId}`);
  return { success: true };
}

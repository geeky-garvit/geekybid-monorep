'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useCart } from '@/context/CartContext';
import { createOrder } from '@/lib/store';
import { useNotifications } from '@/context/NotificationContext';

export default function CheckoutPage() {
  const router = useRouter();
  // Destructure 'loading' as 'authLoading' directly from useAuthGuard
  const { user, loading: authLoading } = useAuthGuard(true);
  const { cart, subtotal, clearCart } = useCart();
  const { notify } = useNotifications();

  const [loading, setLoading] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({
    address: '123 Tech Lane',
    city: 'San Francisco',
    zip: '94105',
  });

  const estimatedTax = subtotal * 0.08;
  const totalAmount = subtotal + estimatedTax;

  const handleProcessCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      router.push('/login');
      return;
    }

    if (cart.length === 0) {
      alert('Your cart is empty.');
      return;
    }

    setLoading(true);

    try {
      cart.forEach((item) => createOrder(item.id, user.id, item.price * item.quantity));
      notify('Order placed', `${cart.length} item${cart.length === 1 ? '' : 's'} added to your local order history.`);
     
      clearCart();
      alert('🎉 Order placed successfully!');
      router.push('/orders');
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred during checkout.';
      alert(`Checkout failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Prevent UI flashing while checking authentication state
  if (authLoading || !user) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <p className="text-slate-500 font-medium text-sm">Verifying session...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Order Items Summary */}
        <div className="bg-white p-6 border rounded-2xl shadow-sm space-y-4">
          <h2 className="text-lg font-bold">Items Summary</h2>
          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {cart.map((item, index) => (
              <div key={`${item.id}-${index}`} className="flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-slate-800">{item.title}</p>
                  <span className="text-slate-400">Qty: {item.quantity}</span>
                </div>
                <span className="font-bold text-purple-950">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t pt-3 space-y-1 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tax (8%)</span>
              <span>${estimatedTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 border-t pt-2">
              <span>Total Amount</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Form Controls */}
        <form onSubmit={handleProcessCheckout} className="bg-white p-6 border rounded-2xl shadow-sm space-y-4">
          <h2 className="text-lg font-bold">Shipping Details</h2>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Street Address</label>
            <input
              type="text"
              required
              value={shippingInfo.address}
              onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
              className="w-full px-3 py-2 border rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
              <input
                type="text"
                required
                value={shippingInfo.city}
                onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ZIP Code</label>
              <input
                type="text"
                required
                value={shippingInfo.zip}
                onChange={(e) => setShippingInfo({ ...shippingInfo, zip: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || cart.length === 0}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs transition mt-4 disabled:opacity-50"
          >
            {loading ? 'Processing Order...' : `Pay $${totalAmount.toFixed(2)}`}
          </button>
        </form>
      </div>
    </div>
  );
}
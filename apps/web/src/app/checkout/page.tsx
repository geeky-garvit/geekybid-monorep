'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { getAuctions, Auction, createOrder, initializeStore, markOrderPaid } from '@/lib/store';
import { useAuth } from '@/context/AuthContext';
import OrderSuccessView from './components/OrderSuccessView';
import CheckoutOrderSummary from './components/CheckoutOrderSummary';
import WebhookConsole, { WebhookLog } from './components/WebhookConsole';
import CheckoutForm from './components/CheckoutForm';

type PaymentStatus = 'idle' | 'processing' | 'webhook_received' | 'completed' | 'failed';

export default function WinnerCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ auctionId?: string }>;
}) {
  const query = use(searchParams);
  const { user } = useAuth();

  const auctionId = query.auctionId || 'auc_1';
  const [auction, setAuction] = useState<Auction | undefined>(undefined);

  const [fullName, setFullName] = useState<string>('Alex Vance');
  const [address, setAddress] = useState<string>('123 Innovation Way, Tech District');
  const [city, setCity] = useState<string>('San Francisco');
  const [zip, setZip] = useState<string>('94105');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'crypto'>('card');

  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.name) {
      setFullName(user.name);
    }
  }, [user]);

  useEffect(() => {
    initializeStore().then(() => setAuction(getAuctions().find((a) => a.id === auctionId)));
  }, [auctionId]);

  if (!auction) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <span className="text-4xl">🛍️</span>
        <h2 className="text-lg font-bold text-slate-800">No Auction Selected for Checkout</h2>
        <Link
          href="/auctions"
          className="inline-block bg-purple-600 text-white font-bold text-xs px-4 py-2 rounded-xl"
        >
          Return to Marketplace
        </Link>
      </div>
    );
  }

  const winningBid = auction.currentHighestBid;
  const shippingFee = 15.0;
  const estimatedTax = winningBid * 0.08;
  const totalAmount = winningBid + shippingFee + estimatedTax;

  const handleSimulatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentStatus('processing');
    setWebhookLogs([]);
    let createdOrderId: string | null = null;

    const addLog = (event: string) => {
      const log: WebhookLog = {
        id: `wh_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        event,
        status: 'success',
        timestamp: new Date().toLocaleTimeString(),
      };
      setWebhookLogs((prev) => [...prev, log]);
    };

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      addLog('payment_intent.created');

      await new Promise((resolve) => setTimeout(resolve, 1200));
      addLog('charge.authorized');
      setPaymentStatus('webhook_received');

      if (user?.id) {
        createdOrderId = createOrder(auction.id, user.id, totalAmount).id;
        setOrderId(createdOrderId);
      } else {
        throw new Error('Authentication required to complete checkout.');
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (!createdOrderId) throw new Error('Order creation did not return an ID.');
      markOrderPaid(createdOrderId);
      addLog('payment_intent.succeeded');
      setPaymentStatus('completed');
    } catch {
      setPaymentStatus('failed');
      alert('Failed to process payment simulation.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4 flex justify-between items-center">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">
            Winner Checkout
          </span>
          <h1 className="text-xl font-black text-slate-900">Complete Your Order</h1>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span>🔒 256-bit Encrypted</span>
        </div>
      </div>

      {paymentStatus === 'completed' && orderId ? (
        <OrderSuccessView
          orderId={orderId}
          fullName={fullName}
          address={address}
          city={city}
          zip={zip}
          totalAmount={totalAmount}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <CheckoutForm
              fullName={fullName}
              setFullName={setFullName}
              address={address}
              setAddress={setAddress}
              city={city}
              setCity={setCity}
              zip={zip}
              setZip={setZip}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              paymentStatus={paymentStatus}
              totalAmount={totalAmount}
              onSubmit={handleSimulatePayment}
            />
          </div>

          <div className="lg:col-span-5 space-y-6">
            <CheckoutOrderSummary
              auction={auction}
              shippingFee={shippingFee}
              estimatedTax={estimatedTax}
              totalAmount={totalAmount}
            />
            <WebhookConsole logs={webhookLogs} />
          </div>
        </div>
      )}
    </div>
  );
}

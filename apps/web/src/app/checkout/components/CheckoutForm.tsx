'use client';

import React from 'react';

type PaymentStatus = 'idle' | 'processing' | 'webhook_received' | 'completed' | 'failed';

interface CheckoutFormProps {
  fullName: string;
  setFullName: (val: string) => void;
  address: string;
  setAddress: (val: string) => void;
  city: string;
  setCity: (val: string) => void;
  zip: string;
  setZip: (val: string) => void;
  paymentMethod: 'card' | 'crypto';
  setPaymentMethod: (val: 'card' | 'crypto') => void;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  onSubmit: (e: React.FormEvent) => void;
}

export default function CheckoutForm({
  fullName,
  setFullName,
  address,
  setAddress,
  city,
  setCity,
  zip,
  setZip,
  paymentMethod,
  setPaymentMethod,
  paymentStatus,
  totalAmount,
  onSubmit,
}: CheckoutFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Shipping Address */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
          1. Shipping Information
        </h3>

        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Street Address</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">City</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">ZIP Code</label>
              <input
                type="text"
                required
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
          2. Payment Method
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPaymentMethod('card')}
            className={`p-3 rounded-xl border text-xs font-bold text-left flex items-center justify-between transition ${
              paymentMethod === 'card'
                ? 'border-purple-600 bg-purple-50 text-purple-950'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>💳 Credit Card</span>
            {paymentMethod === 'card' && <span className="text-purple-600">✓</span>}
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod('crypto')}
            className={`p-3 rounded-xl border text-xs font-bold text-left flex items-center justify-between transition ${
              paymentMethod === 'crypto'
                ? 'border-purple-600 bg-purple-50 text-purple-950'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>⚡ Instant Crypto</span>
            {paymentMethod === 'crypto' && <span className="text-purple-600">✓</span>}
          </button>
        </div>

        <div className="bg-slate-50 p-3 rounded-xl text-[11px] text-slate-500 font-medium">
          {paymentMethod === 'card'
            ? '🔒 Standard mock test card will be authorized automatically upon submission.'
            : '⚡ Simulates an instant smart contract escrow release webhook event.'}
        </div>
      </div>

      <button
        type="submit"
        disabled={paymentStatus !== 'idle'}
        className={`w-full font-bold py-3.5 rounded-xl text-xs transition shadow-md ${
          paymentStatus !== 'idle'
            ? 'bg-purple-300 text-white cursor-not-allowed'
            : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/20'
        }`}
      >
        {paymentStatus === 'idle'
          ? `Pay & Complete Order ($${totalAmount.toFixed(2)})`
          : 'Processing Payment Webhook...'}
      </button>
    </form>
  );
}
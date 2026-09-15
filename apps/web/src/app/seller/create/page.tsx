'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import ItemDetailsSection from './components/ItemDetailsSection';
import PricingSection from './components/PricingSection';
import ImageUploaderSection from './components/ImageUploaderSection';

const CATEGORIES = ['electronics', 'art', 'collectibles', 'fashion', 'jewelry'];
const MIN_DURATION_MINUTES = 5;

export default function CreateAuctionPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [isPending, setIsPending] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [startingBid, setStartingBid] = useState('');
  const [reservePrice, setReservePrice] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);

  const [imageUrls, setImageUrls] = useState<string[]>([
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop',
  ]);

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-500 text-xs font-semibold">Checking seller profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <span className="text-3xl block">👤</span>
        <p className="text-slate-600 font-bold text-sm">
          Please select or log into a seller profile to create an auction listing.
        </p>
        <Link
          href={`/login?redirectTo=${encodeURIComponent('/seller/create')}`}
          className="inline-block bg-purple-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-purple-700 transition"
        >
          Sign In to List Items
        </Link>
      </div>
    );
  }

  const handleAddImageUrl = (url: string) => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;
    if (imageUrls.includes(trimmedUrl)) {
      toast.error('This image URL has already been added.');
      return;
    }
    setImageUrls((prev) => [...prev, trimmedUrl]);
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isPending) return;

    if (!title.trim()) {
      toast.error('Please enter a listing title.');
      return;
    }

    const parsedDuration = Number(durationMinutes);
    if (isNaN(parsedDuration) || parsedDuration < MIN_DURATION_MINUTES) {
      toast.error('Invalid Duration!', {
        description: `Minimum auction duration must be at least ${MIN_DURATION_MINUTES} minutes.`,
      });
      return;
    }

    const startPrice = parseFloat(startingBid);
    if (isNaN(startPrice) || startPrice <= 0) {
      toast.error('Please enter a valid starting price greater than $0.');
      return;
    }

    const parsedReserve = reservePrice ? parseFloat(reservePrice) : undefined;
    if (parsedReserve !== undefined && (isNaN(parsedReserve) || parsedReserve < startPrice)) {
      toast.error('Reserve price must be greater than or equal to the starting bid.');
      return;
    }

    if (imageUrls.length === 0) {
      toast.error('Please provide at least one image URL for the auction item.');
      return;
    }

    const endTime = new Date(Date.now() + parsedDuration * 60 * 1000).toISOString();

    setIsPending(true);
    const toastId = toast.loading('Publishing auction to database...');

    try {
      const response = await fetch('/api/auctions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          category,
          description: description.trim(),
          startingBid: startPrice,
          minIncrement: 5,
          endTime,
          images: imageUrls,
          sellerId: user.id,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to save auction to database.');
      }

      toast.success('Auction saved to database successfully!', { id: toastId });
      
      // Force hard navigation to clear Next.js client router memory cache
      window.location.href = `/auctions?t=${Date.now()}`;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create auction.', {
        id: toastId,
      });
      setIsPending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-purple-600">
            Seller Portal • {user.name}
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-0.5">List a New Item</h1>
        </div>
        <Link
          href="/seller/dashboard"
          className="text-xs font-bold text-slate-600 hover:text-purple-600 transition"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <fieldset disabled={isPending} className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <ItemDetailsSection
            title={title}
            setTitle={setTitle}
            category={category}
            setCategory={setCategory}
            durationMinutes={durationMinutes}
            setDurationMinutes={setDurationMinutes}
            minDurationMinutes={MIN_DURATION_MINUTES}
            description={description}
            setDescription={setDescription}
            categories={CATEGORIES}
          />

          <PricingSection
            startingBid={startingBid}
            setStartingBid={setStartingBid}
            reservePrice={reservePrice}
            setReservePrice={setReservePrice}
          />

          <ImageUploaderSection
            imageUrls={imageUrls}
            onAddImage={handleAddImageUrl}
            onRemoveImage={handleRemoveImage}
          />

          <div className="flex gap-3 justify-end pt-2">
            <Link
              href="/seller/dashboard"
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-6 py-3 rounded-xl transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isPending}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs px-8 py-3 rounded-xl transition shadow-md shadow-purple-600/20 flex items-center gap-2"
            >
              {isPending && (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {isPending ? 'Publishing...' : 'Publish Live Auction'}
            </button>
          </div>
        </form>
      </fieldset>
    </div>
  );
}
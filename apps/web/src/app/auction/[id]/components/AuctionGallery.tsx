'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

interface AuctionGalleryProps {
  title: string;
  images: string[];
  inWatchlist: boolean;
  onToggleWatchlist: () => void;
}

export default function AuctionGallery({
  title,
  images,
  inWatchlist,
  onToggleWatchlist,
}: AuctionGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string>(images[0] || '');
  const { user } = useAuth();
  const router = useRouter();

  const handleWatchlistClick = () => {
    // 1. Unauthenticated check
    if (!user) {
      toast.error('Sign in required for Watchlist!', {
        description: 'Please sign in to save items to your personal watchlist.',
        action: {
          label: 'Sign In',
          onClick: () => router.push('/login'),
        },
      });
      return;
    }

    // 2. Toggle watchlist callback
    onToggleWatchlist();

    // 3. Trigger Sonner notification based on updated state
    if (inWatchlist) {
      toast.info('Removed from Watchlist', {
        description: `"${title}" has been removed from your watchlist.`,
      });
    } else {
      toast.success('Added to Watchlist ❤️', {
        description: `"${title}" has been saved to your watchlist.`,
        action: {
          label: 'View Watchlist',
          onClick: () => router.push('/watchlist'),
        },
      });
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-sm">
      {/* Main Image Container */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-100">
        {selectedImage && (
          <Image
            src={selectedImage}
            alt={title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        )}

        {/* Heart / Watchlist Button */}
        <button
          type="button"
          onClick={handleWatchlistClick}
          className="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-2.5 rounded-full shadow hover:bg-white transition"
          aria-label={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
        >
          <svg
            className={`w-5 h-5 transition ${
              inWatchlist
                ? 'fill-rose-500 text-rose-500 scale-110'
                : 'fill-transparent text-slate-600 hover:text-rose-500'
            }`}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </button>
      </div>

      {/* Thumbnail Previews */}
      {images.length > 1 && (
        <div className="flex gap-3">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedImage(img)}
              className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition ${
                selectedImage === img
                  ? 'border-purple-600'
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <Image
                src={img}
                alt={`${title} preview ${idx + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
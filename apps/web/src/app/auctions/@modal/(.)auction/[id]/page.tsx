import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import Modal from '@/app/components/ui/Modal';
import BidForm from '@/app/components/auction/BidForm';
import SellerBadge from './components/SellerBadge';

export const dynamic = 'force-dynamic';

export default async function QuickViewAuctionModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch auction with current high bids and seller profile directly from DB
  const dbAuction = await prisma.auction.findUnique({
    where: { id },
    include: {
      seller: { select: { id: true, name: true, avatar: true } },
      bids: {
        orderBy: { timestamp: 'desc' },
        include: { user: { select: { name: true, avatar: true } } },
      },
      _count: { select: { bids: true } },
    },
  });

  if (!dbAuction) {
    return (
      <Modal>
        <div className="p-8 text-center space-y-2">
          <h3 className="text-lg font-bold text-rose-600">Auction Listing Not Found</h3>
          <p className="text-xs text-slate-500">
            This auction may have been removed or does not exist.
          </p>
        </div>
      </Modal>
    );
  }

  // Normalize Prisma object to match client component structures
  const history = dbAuction.bids.map((b:any) => {
    const isoTimeString = b.timestamp.toISOString();
    return {
      id: b.id,
      amount: b.amount,
      bidderId: b.userId,
      time: isoTimeString,
      timestamp: isoTimeString,
      bidderName: b.user?.name || 'Anonymous',
      bidderAvatar: b.user?.avatar || '',
    };
  });

  const auction = {
    id: dbAuction.id,
    title: dbAuction.title,
    description: dbAuction.description,
    category: dbAuction.category,
    startingBid: dbAuction.startingBid,
    currentHighestBid: dbAuction.currentPrice,
    minIncrement: dbAuction.minIncrement,
    images: dbAuction.images,
    sellerName: dbAuction.seller?.name || 'Seller',
    sellerAvatar: dbAuction.seller?.avatar || '',
    bidsCount: dbAuction._count.bids,
    history,
  };

  return (
    <Modal>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start pt-2">
        {/* Left: Image & Quick Details */}
        <div className="space-y-4">
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
            <Image
              src={auction.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'}
              alt={auction.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 640px) 100vw, 50vw"
            />
            <div className="absolute top-3 left-3 bg-purple-900/90 text-white font-bold text-[10px] px-2.5 py-1 rounded-full backdrop-blur-sm">
              Quick View
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">
              {auction.category}
            </span>
            <h2 className="text-lg font-black text-slate-900 leading-snug">{auction.title}</h2>
            <p className="text-xs text-slate-500 line-clamp-3 mt-1">{auction.description}</p>
          </div>

          <SellerBadge name={auction.sellerName} avatar={auction.sellerAvatar} />
        </div>

        {/* Right: Bidding Module */}
        <div className="space-y-4">
          <BidForm
            key={`modal-${auction.id}-${auction.currentHighestBid}-${auction.bidsCount}`}
            auctionId={auction.id}
            initialHighestBid={auction.currentHighestBid}
            minIncrement={auction.minIncrement}
            initialBidsCount={auction.bidsCount}
            initialHistory={auction.history}
          />

          <div className="text-center pt-2">
            <Link
              href={`/auction/${auction.id}`}
              className="text-xs font-bold text-purple-600 hover:underline inline-block py-1"
            >
              Open Full Details Page →
            </Link>
          </div>
        </div>
      </div>
    </Modal>
  );
}
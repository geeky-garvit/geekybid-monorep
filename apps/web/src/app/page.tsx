import Link from 'next/link';
import Image from 'next/image';
import { AuctionStatus } from '@prisma/client';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

type HomeAuction = {
  id: string;
  title: string;
  description: string;
  category: string;
  startingBid: number;
  currentHighestBid: number;
  minIncrement: number;
  status: 'live';
  images: string[];
  endTime: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  bidsCount: number;
};

/* =========================================================
   DATABASE
========================================================= */

async function getHomepageAuctions(): Promise<HomeAuction[]> {
  const now = new Date();

  const auctions = await prisma.auction.findMany({
    where: {
      status: AuctionStatus.ACTIVE,
      endTime: {
        gt: now,
      },
    },

    orderBy: {
      createdAt: 'desc',
    },

    include: {
      seller: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },

      _count: {
        select: {
          bids: true,
        },
      },
    },
  });

  return auctions.map((auction: any) => ({
    id: auction.id,
    title: auction.title,
    description: auction.description,
    category: auction.category,

    startingBid: auction.startingBid,
    currentHighestBid: auction.currentPrice,
    minIncrement: auction.minIncrement,

    status: 'live',

    images: auction.images,

    endTime: auction.endTime.toISOString(),

    sellerId: auction.sellerId,
    sellerName: auction.seller?.name || 'Seller',
    sellerAvatar: auction.seller?.avatar || '',

    bidsCount: auction._count.bids,
  }));
}

/* =========================================================
   HELPERS
========================================================= */

function getTimeLeft(endTime: string) {
  const diff = new Date(endTime).getTime() - Date.now();

  if (diff <= 0) {
    return 'Ended';
  }

  const totalMinutes = Math.floor(diff / (1000 * 60));

  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h left`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  }

  return `${minutes}m left`;
}

/* =========================================================
   CATEGORY ICON
========================================================= */

function getCategoryIcon(category: string) {
  const key = category.toLowerCase();

  if (
    key.includes('laptop') ||
    key.includes('tech') ||
    key.includes('electronic')
  ) {
    return (
      <svg
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    );
  }

  if (key.includes('phone') || key.includes('mobile')) {
    return (
      <svg
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
      </svg>
    );
  }

  if (
    key.includes('beauty') ||
    key.includes('fragrance') ||
    key.includes('cosmetic')
  ) {
    return (
      <svg
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
        />
      </svg>
    );
  }

  if (
    key.includes('home') ||
    key.includes('decor') ||
    key.includes('furniture')
  ) {
    return (
      <svg
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10"
        />
      </svg>
    );
  }

  if (
    key.includes('fashion') ||
    key.includes('clothing') ||
    key.includes('shoe')
  ) {
    return (
      <svg
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M6 3l6 4 6-4 3 5-5 3v10H8V11L3 8l3-5z"
        />
      </svg>
    );
  }

  return (
    <svg
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    </svg>
  );
}

/* =========================================================
   AUCTION CARD
========================================================= */

function AuctionCard({
  item,
  badgeText,
  badgeClass,
}: {
  item: HomeAuction;
  badgeText: string;
  badgeClass: string;
}) {
  const imageSrc =
    item.images?.length > 0
      ? item.images[0]
      : 'https://cdn.dummyjson.com/product-images/1/thumbnail.jpg';

  const isLocalFileUri =
    typeof imageSrc === 'string' && imageSrc.startsWith('file://');

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-purple-200 hover:shadow-xl">
      {/* IMAGE */}

      <Link href={`/auction/${encodeURIComponent(item.id)}`}>
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          {isLocalFileUri ? (
            <img
              src={imageSrc}
              alt={item.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <Image
              src={imageSrc}
              alt={item.title}
              fill
              className="object-cover transition duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          )}

          {/* Overlay */}

          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3 z-10">
            <span
              className={`rounded-full px-3 py-1.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-md ${badgeClass}`}
            >
              {badgeText}
            </span>

            <span className="rounded-full border border-white/30 bg-white/90 px-2.5 py-1 text-[10px] font-bold text-slate-700 shadow-sm backdrop-blur">
              LIVE
            </span>
          </div>

          {/* Bottom gradient */}

          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent z-10" />

          <div className="absolute bottom-3 left-3 right-3 z-20">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">
              {item.category}
            </p>
          </div>
        </div>
      </Link>

      {/* CONTENT */}

      <div className="p-4">
        <Link href={`/auction/${encodeURIComponent(item.id)}`}>
          <h3 className="line-clamp-1 text-sm font-black text-slate-900 transition group-hover:text-purple-700">
            {item.title}
          </h3>
        </Link>

        <p className="mt-1 line-clamp-2 min-h-[32px] text-xs leading-4 text-slate-500">
          {item.description || 'No description available.'}
        </p>

        {/* Seller */}

        <div className="mt-3 flex items-center gap-2">
          {item.sellerAvatar ? (
            item.sellerAvatar.startsWith('file://') ? (
              <img
                src={item.sellerAvatar}
                alt={item.sellerName}
                className="h-[22px] w-[22px] rounded-full border border-slate-200 object-cover"
              />
            ) : (
              <Image
                src={item.sellerAvatar}
                alt={item.sellerName}
                width={22}
                height={22}
                className="rounded-full border border-slate-200 object-cover"
              />
            )
          ) : (
            <div className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-purple-100 text-[9px] font-bold text-purple-700">
              {item.sellerName.charAt(0).toUpperCase()}
            </div>
          )}

          <span className="max-w-[140px] truncate text-[10px] font-semibold text-slate-500">
            {item.sellerName}
          </span>
        </div>

        {/* Price */}

        <div className="mt-4 flex items-end justify-between border-t border-slate-100 pt-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Current bid
            </p>

            <p className="mt-0.5 text-lg font-black text-slate-950">
              ${item.currentHighestBid.toFixed(2)}
            </p>

            <p className="text-[10px] text-slate-400">
              {item.bidsCount}{' '}
              {item.bidsCount === 1 ? 'bid' : 'bids'}
            </p>
          </div>

          <Link
            href={`/auction/${encodeURIComponent(item.id)}`}
            className="rounded-xl bg-purple-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-purple-700 hover:shadow-md"
          >
            Place Bid
          </Link>
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyAuctions({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 text-purple-600">
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M20 13V7a2 2 0 00-2-2h-3V3H9v2H6a2 2 0 00-2 2v6m16 0v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4m16 0H4m6-3h4"
          />
        </svg>
      </div>

      <h3 className="mt-4 text-sm font-bold text-slate-900">
        {title}
      </h3>

      <p className="mt-1 text-xs text-slate-500">
        {description ||
          'Check the marketplace for more auctions.'}
      </p>

      <Link
        href="/auctions"
        className="mt-4 inline-flex rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-purple-700"
      >
        Browse Auctions
      </Link>
    </div>
  );
}

/* =========================================================
   HOME PAGE
========================================================= */

export default async function HomePage() {
  const allAuctions = await getHomepageAuctions();

  /* -------------------------------------------------------
     ENDING SOON
  ------------------------------------------------------- */

  const endingSoon = [...allAuctions]
    .sort(
      (a, b) =>
        new Date(a.endTime).getTime() -
        new Date(b.endTime).getTime()
    )
    .slice(0, 4);

  /* -------------------------------------------------------
     HOT AUCTIONS
  ------------------------------------------------------- */

  const hotAuctions = [...allAuctions]
    .sort((a, b) => {
      if (b.bidsCount !== a.bidsCount) {
        return b.bidsCount - a.bidsCount;
      }

      return (
        new Date(a.endTime).getTime() -
        new Date(b.endTime).getTime()
      );
    })
    .slice(0, 4);

  /* -------------------------------------------------------
     CATEGORIES
  ------------------------------------------------------- */

  const categoryMap = new Map<string, number>();

  for (const auction of allAuctions) {
    const category = auction.category?.trim();

    if (!category) continue;

    categoryMap.set(
      category,
      (categoryMap.get(category) || 0) + 1
    );
  }

  const categories = Array.from(categoryMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({
      name,
      count,
    }));

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ===================================================
          HERO
      =================================================== */}

      <section className="bg-gradient-to-b from-purple-900 via-purple-800 to-purple-950 text-white py-16 px-4">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
            Bid in Real-Time. <br />
            <span className="text-purple-400">Win Rare Items Today.</span>
          </h1>

          <div className="pt-4 flex justify-center gap-4">
            <Link
              href="/auctions"
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-3 rounded-xl text-sm transition shadow-lg shadow-purple-600/30"
            >
              Explore All Auctions
            </Link>
            <Link
              href="/seller/create"
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3 rounded-xl text-sm transition border border-white/10"
            >
              Start Selling
            </Link>
          </div>
        </div>
      </section>

      {/* ===================================================
          MAIN CONTENT
      =================================================== */}

      <main className="mx-auto max-w-7xl space-y-16 px-4 py-12 sm:px-6 lg:px-8">

        {/* =================================================
            CATEGORIES
        ================================================= */}

        <section>

          <div className="mb-6 flex items-end justify-between">

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600">
                Browse
              </p>

              <h2 className="mt-1 text-2xl font-black text-slate-950">
                Shop by Category
              </h2>
            </div>

            <Link
              href="/auctions"
              className="text-xs font-bold text-purple-600 transition hover:text-purple-800"
            >
              View all →
            </Link>

          </div>

          {categories.length > 0 ? (

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">

              {categories.map((category) => (

                <Link
                  key={category.name}
                  href={`/auctions?category=${encodeURIComponent(
                    category.name
                  )}`}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-purple-200 hover:shadow-md"
                >

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600 transition group-hover:bg-purple-600 group-hover:text-white">
                    {getCategoryIcon(category.name)}
                  </div>

                  <h3 className="mt-4 line-clamp-2 text-sm font-black text-slate-900">
                    {category.name}
                  </h3>

                  <p className="mt-1 text-[10px] font-semibold text-slate-400">
                    {category.count}{' '}
                    {category.count === 1
                      ? 'auction'
                      : 'auctions'}
                  </p>

                </Link>

              ))}

            </div>

          ) : (

            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="text-sm font-bold text-slate-500">
                Categories will appear when auctions are available.
              </p>
            </div>

          )}

        </section>

        {/* =================================================
            ENDING SOON
        ================================================= */}

        <section>

          <div className="mb-6 flex items-end justify-between">

            <div>

              <div className="flex items-center gap-2">

                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                  ⏱
                </span>

                <h2 className="text-2xl font-black text-slate-950">
                  Ending Soon
                </h2>

              </div>

              <p className="mt-1 text-xs text-slate-500">
                Don't miss your chance to place the winning bid.
              </p>

            </div>

            <Link
              href="/auctions?status=live&sortBy=endingSoon"
              className="text-xs font-bold text-purple-600 transition hover:text-purple-800"
            >
              View all →
            </Link>

          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">

            {endingSoon.length > 0 ? (

              endingSoon.map((item) => (

                <AuctionCard
                  key={item.id}
                  item={item}
                  badgeText={`⏰ ${getTimeLeft(item.endTime)}`}
                  badgeClass="bg-rose-500/90"
                />

              ))

            ) : (

              <EmptyAuctions
                title="No auctions are ending soon"
              />

            )}

          </div>

        </section>

        {/* =================================================
            HOT AUCTIONS
        ================================================= */}

        <section>

          <div className="mb-6 flex items-end justify-between">

            <div>

              <div className="flex items-center gap-2">

                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                  🔥
                </span>

                <h2 className="text-2xl font-black text-slate-950">
                  Hot Auctions
                </h2>

              </div>

              <p className="mt-1 text-xs text-slate-500">
                The auctions getting the most attention right now.
              </p>

            </div>

            <Link
              href="/auctions?status=live"
              className="text-xs font-bold text-purple-600 transition hover:text-purple-800"
            >
              Explore marketplace →
            </Link>

          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">

            {hotAuctions.length > 0 ? (

              hotAuctions.map((item) => (

                <AuctionCard
                  key={item.id}
                  item={item}
                  badgeText={`🔥 ${item.bidsCount} ${
                    item.bidsCount === 1
                      ? 'Bid'
                      : 'Bids'
                  }`}
                  badgeClass="bg-purple-700/90"
                />

              ))

            ) : (

              <EmptyAuctions
                title="No hot auctions yet"
              />

            )}

          </div>

        </section>

        {/* =================================================
            SELLER CTA
        ================================================= */}

        <section className="overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#ede4ff_0%,#ddd0ff_50%,#d6c7ff_100%)]">

          <div className="relative px-6 py-10 sm:px-10 lg:px-14">

            <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-white/40 blur-2xl" />

            <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">

              <div className="max-w-xl">

                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-700">
                  Sell on GeekyBid
                </p>

                <h2 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">
                  Have something worth bidding on?
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Create an auction, set your starting price,
                  and let the community compete for it.
                </p>

              </div>

              <Link
                href="/seller/create"
                className="shrink-0 rounded-xl bg-purple-700 px-6 py-3 text-sm font-black text-white shadow-lg shadow-purple-700/20 transition hover:-translate-y-0.5 hover:bg-purple-800"
              >
                Create Auction →
              </Link>

            </div>

          </div>

        </section>

      </main>

      {/* ===================================================
          FOOTER
      =================================================== */}

      <footer className="border-t border-slate-200 bg-white">

        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-center sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8 sm:text-left">

          <div>

            <p className="text-sm font-black text-slate-900">
              GeekyBid
            </p>

            <p className="mt-1 text-[10px] text-slate-400">
              Real-time auctions. Real competition.
            </p>

          </div>

          <p className="text-[10px] text-slate-400">
            © 2026 GeekyBid - Garvit Chawla.
          </p>

        </div>

      </footer>

    </div>
  );
}
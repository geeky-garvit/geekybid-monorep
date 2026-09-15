/* eslint-disable @next/next/no-img-element */
import { getCompletedAuctions } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface Winner {
  id: string;
  name: string;
  avatar: string | null;
}

interface CompletedAuction {
  id: string;
  title: string;
  description: string;
  category: string;
  startingBid: number;
  currentPrice: number;
  status: string;
  images: string[];
  endTime: Date;
  highestBidderId: string | null;
  winner?: Winner | null;
}

export default async function WinnersPage() {
  const rawAuctions = await getCompletedAuctions();
  const auctions: CompletedAuction[] = rawAuctions;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Auction Winners
        </h1>

        <p className="mt-2 text-slate-500">
          Winners of completed auctions.
        </p>

        {auctions.length === 0 ? (
          <div className="mt-8 rounded-xl bg-white p-8 text-center">
            <p className="text-slate-500">
              No completed auctions yet.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {auctions.map((auction) => (
              <article
                key={auction.id}
                className="overflow-hidden rounded-xl bg-white shadow-sm"
              >
                {auction.images && auction.images[0] && (
                  <img
                    src={auction.images[0]}
                    alt={auction.title}
                    className="h-56 w-full object-cover"
                  />
                )}

                <div className="p-5">
                  <h2 className="text-lg font-bold text-slate-900">
                    {auction.title}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {auction.category}
                  </p>

                  {auction.winner && (
                    <div className="mt-5 flex items-center gap-3">
                      {auction.winner.avatar && (
                        <img
                          src={auction.winner.avatar}
                          alt={auction.winner.name}
                          className="h-10 w-10 rounded-full"
                        />
                      )}

                      <div>
                        <p className="text-xs text-slate-500">
                          Winner
                        </p>

                        <p className="font-semibold text-slate-900">
                          {auction.winner.name}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-5 border-t pt-4">
                    <p className="text-xs text-slate-500">
                      Winning bid
                    </p>

                    <p className="text-xl font-bold text-slate-900">
                      ${auction.currentPrice.toLocaleString()}
                    </p>
                    <Link
                      href={`/winners/${auction.id}`}
                      className="mt-5 block rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      View Result
                    </Link>
                  </div>

                  <p className="mt-3 text-xs text-slate-400">
                    Ended{' '}
                    {new Date(auction.endTime).toLocaleDateString()}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
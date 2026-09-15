import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAuctionResult } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function WinnerResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const auction = await getAuctionResult(id);

  if (!auction) {
    notFound();
  }

  const winningBid = auction.winningBid;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Link
          href="/winners"
          className="text-sm font-semibold text-slate-500 hover:text-slate-900"
        >
          ← Back to Winners
        </Link>

        <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm">
          {auction.images && auction.images[0] && (
            <img
              src={auction.images[0]}
              alt={auction.title}
              className="h-80 w-full object-cover"
            />
          )}

          <div className="p-8">
            <p className="text-sm font-medium text-slate-500">
              {auction.category}
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              {auction.title}
            </h1>

            <p className="mt-4 text-slate-600">
              {auction.description}
            </p>

            <div className="mt-8 border-t pt-6">
              {winningBid ? (
                <>
                  <p className="text-sm font-medium text-slate-500">
                    Auction Winner
                  </p>

                  <div className="mt-4 flex items-center gap-4">
                    {winningBid.user.avatar && (
                      <img
                        src={winningBid.user.avatar}
                        alt={winningBid.user.name}
                        className="h-12 w-12 rounded-full"
                      />
                    )}

                    <div>
                      <p className="text-lg font-bold text-slate-900">
                        {winningBid.user.name}
                      </p>

                      <p className="text-sm text-slate-500">
                        Winning bidder
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 rounded-xl bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">
                      Winning bid
                    </p>

                    <p className="mt-1 text-3xl font-black text-slate-900">
                      ${winningBid.amount.toLocaleString()}
                    </p>
                  </div>
                </>
              ) : (
                <div className="rounded-xl bg-slate-50 p-6 text-center">
                  <p className="text-lg font-bold text-slate-900">
                    No winner
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    No one put a bid on this auction.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 border-t pt-5">
              <p className="text-xs text-slate-400">
                Auction ended{' '}
                {new Date(auction.endTime).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
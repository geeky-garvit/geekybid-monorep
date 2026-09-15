// src/app/auctions/loading.tsx
export default function AuctionsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header Skeleton */}
      <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse mb-6" />

      {/* Auction Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm h-80 flex flex-col justify-between p-4 animate-pulse"
          >
            {/* Image Placeholder */}
            <div className="w-full h-44 bg-slate-200 rounded-xl mb-4" />

            {/* Title & Category Placeholders */}
            <div className="space-y-2">
              <div className="h-3 w-1/4 bg-slate-200 rounded" />
              <div className="h-4 w-3/4 bg-slate-200 rounded" />
            </div>

            {/* Footer Placeholder */}
            <div className="pt-3 border-t border-slate-100 flex justify-between items-center mt-4">
              <div className="h-4 w-16 bg-slate-200 rounded" />
              <div className="h-4 w-12 bg-slate-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
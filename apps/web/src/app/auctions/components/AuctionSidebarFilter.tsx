'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface AuctionFilterProps {
  search: string;
  category: string;
  status: string;
  minPrice?: number;
  maxPrice?: number;
  endingWithin?: number;
  sortBy: string;
}

export default function AuctionHorizontalFilter({
  search,
  category,
  status,
  endingWithin,
  sortBy,
}: AuctionFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(search);
  const [categoryValue, setCategoryValue] = useState(category);
  const [statusValue, setStatusValue] = useState(status);
  const [endingWithinValue, setEndingWithinValue] = useState<string>(
    endingWithin?.toString() || ''
  );
  const [sortByValue, setSortByValue] = useState(sortBy);

  useEffect(() => {
    setSearchValue(searchParams.get('search') || '');
    setCategoryValue(searchParams.get('category') || 'all');
    setStatusValue(searchParams.get('status') || 'live');
    setEndingWithinValue(searchParams.get('endingWithin') || '');
    setSortByValue(searchParams.get('sortBy') || 'endingSoon');
  }, [searchParams]);

  // Close dropdown when clicking anywhere outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateFilters = (updates: {
    search?: string;
    category?: string;
    status?: string;
    endingWithin?: string;
    sortBy?: string;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    const nextSearch = updates.search !== undefined ? updates.search : searchValue;
    const nextCategory = updates.category !== undefined ? updates.category : categoryValue;
    const nextStatus = updates.status !== undefined ? updates.status : statusValue;
    const nextEndingWithin = updates.endingWithin !== undefined ? updates.endingWithin : endingWithinValue;
    const nextSortBy = updates.sortBy !== undefined ? updates.sortBy : sortByValue;

    if (nextSearch.trim()) params.set('search', nextSearch.trim());
    else params.delete('search');

    if (nextCategory && nextCategory !== 'all') params.set('category', nextCategory);
    else params.delete('category');

    if (nextStatus && nextStatus !== 'live') params.set('status', nextStatus);
    else params.delete('status');

    if (nextEndingWithin) params.set('endingWithin', nextEndingWithin);
    else params.delete('endingWithin');

    if (nextSortBy && nextSortBy !== 'endingSoon') params.set('sortBy', nextSortBy);
    else params.delete('sortBy');

    const queryString = params.toString();
    router.push(queryString ? `/auctions?${queryString}` : '/auctions', { scroll: false });
  };

  const activeFilterCount = [
    searchValue.trim() !== '',
    categoryValue !== 'all',
    statusValue !== 'live',
    endingWithinValue !== '',
    sortByValue !== 'endingSoon',
  ].filter(Boolean).length;

  return (
    <div className="w-full bg-transparent p-0">
      {/* Top Controls Container */}
      <div className="flex sm:grid sm:grid-cols-6 items-center gap-3 sm:gap-4">
        {/* Search Bar: 2/6 width on desktop */}
        <div className="flex-1 sm:col-span-2 sm:col-start-1 relative group">
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-purple-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => {
              const val = e.target.value;
              setSearchValue(val);
              updateFilters({ search: val });
            }}
            placeholder="Search auctions..."
            className="w-full pl-10 pr-8 py-2.5 bg-transparent border border-slate-300/70 rounded-xl text-xs text-slate-800 font-medium placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all duration-200"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => {
                setSearchValue('');
                updateFilters({ search: '' });
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold transition-transform active:scale-90"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Trigger Button & Dropdown Container: 1/6 width on desktop */}
        <div className="shrink-0 sm:col-span-1 sm:col-start-6 flex justify-end relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all duration-200 bg-transparent ${
              isOpen || activeFilterCount > 0
                ? 'border-purple-500 text-purple-700 ring-2 ring-purple-500/10'
                : 'border-slate-300/70 text-slate-700 hover:border-slate-400'
            }`}
          >
            <svg
              className={`w-4 h-4 text-purple-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-purple-600 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Floating Dropdown Popover (Does NOT disturb page layout) */}
          {isOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <span className="text-xs font-bold text-slate-800">Filter Options</span>
                {activeFilterCount > 0 && (
                  <Link
                    href="/auctions"
                    onClick={() => setIsOpen(false)}
                    className="text-[11px] font-bold text-purple-600 hover:text-purple-700 transition-colors"
                  >
                    Reset All
                  </Link>
                )}
              </div>

              <div className="space-y-3">
                {/* Category */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={categoryValue}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCategoryValue(val);
                      updateFilters({ category: val });
                    }}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:border-purple-500 outline-none transition-all"
                  >
                    <option value="all">All Categories</option>
                    <option value="electronics">Electronics</option>
                    <option value="photography">Photography</option>
                    <option value="collectibles">Collectibles</option>
                    <option value="art">Art</option>
                    <option value="fashion">Fashion</option>
                    <option value="jewelry">Jewelry</option>
                    <option value="general">General</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={statusValue}
                    onChange={(e) => {
                      const val = e.target.value;
                      setStatusValue(val);
                      updateFilters({ status: val });
                    }}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:border-purple-500 outline-none transition-all"
                  >
                    <option value="live">● Live</option>
                    <option value="ended">Ended</option>
                    <option value="all">All</option>
                  </select>
                </div>

                {/* Ending Within */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Ending Within
                  </label>
                  <select
                    value={endingWithinValue}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEndingWithinValue(val);
                      updateFilters({ endingWithin: val });
                    }}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:border-purple-500 outline-none transition-all"
                  >
                    <option value="">Anytime</option>
                    <option value="1">⏱ Within 1 Hr</option>
                    <option value="6">⏱ Within 6 Hrs</option>
                    <option value="24">⏱ Within 24 Hrs</option>
                  </select>
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Sort Order
                  </label>
                  <select
                    value={sortByValue}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSortByValue(val);
                      updateFilters({ sortBy: val });
                    }}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:border-purple-500 outline-none transition-all"
                  >
                    <option value="endingSoon">Ending Soonest</option>
                    <option value="mostBids">Most Bids (Hot)</option>
                    <option value="priceAsc">Price: Low to High</option>
                    <option value="priceDesc">Price: High to Low</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
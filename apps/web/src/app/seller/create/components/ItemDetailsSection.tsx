'use client';

import React from 'react';

interface ItemDetailsSectionProps {
  title: string;
  setTitle: (val: string) => void;
  category: string;
  setCategory: (val: string) => void;
  durationMinutes: number;
  setDurationMinutes: (val: number) => void;
  minDurationMinutes?: number;
  description: string;
  setDescription: (val: string) => void;
  categories: string[];
}

export default function ItemDetailsSection({
  title,
  setTitle,
  category,
  setCategory,
  durationMinutes,
  setDurationMinutes,
  minDurationMinutes = 5,
  description,
  setDescription,
  categories,
}: ItemDetailsSectionProps) {
  return (
    <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
      <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
        1. Item Details
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Auction Title *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Rare Vintage Chronograph Watch (1972)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-purple-600"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-purple-600 capitalize bg-white"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Auction Duration *
            </label>
            <select
              value={durationMinutes}
              onChange={(e) => {
                const val = Number(e.target.value);
                setDurationMinutes(val < minDurationMinutes ? minDurationMinutes : val);
              }}
              className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-purple-600 bg-white"
            >
              <option value={5}>5 Minutes (Flash Blitz)</option>
              <option value={15}>15 Minutes</option>
              <option value={60}>1 Hour</option>
              <option value={1440}>1 Day (Express)</option>
              <option value={4320}>3 Days (Recommended)</option>
              <option value={10080}>7 Days (1 Week)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Item Description *
          </label>
          <textarea
            required
            rows={4}
            placeholder="Describe condition, history, authenticity, and key features..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-purple-600"
          />
        </div>
      </div>
    </div>
  );
}
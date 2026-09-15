'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface ImageUploaderSectionProps {
  imageUrls: string[];
  onAddImage: (url: string) => void;
  onRemoveImage: (index: number) => void;
}

export default function ImageUploaderSection({
  imageUrls,
  onAddImage,
  onRemoveImage,
}: ImageUploaderSectionProps) {
  const [customImageUrl, setCustomImageUrl] = useState('');

  const handleAdd = () => {
    if (!customImageUrl.trim()) return;
    onAddImage(customImageUrl.trim());
    setCustomImageUrl('');
  };

  return (
    <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
      <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
        3. Product Images
      </h3>

      <div className="flex gap-2">
        <input
          type="url"
          placeholder="Paste image URL (e.g., Unsplash image address)"
          value={customImageUrl}
          onChange={(e) => setCustomImageUrl(e.target.value)}
          className="flex-1 p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-600"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition"
        >
          Add URL
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        {imageUrls.map((url, idx) => (
          <div
            key={idx}
            className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group"
          >
            <Image
              src={url}
              alt={`Preview ${idx + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, 25vw"
            />
            <button
              type="button"
              onClick={() => onRemoveImage(idx)}
              className="absolute top-1.5 right-1.5 bg-rose-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition shadow"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
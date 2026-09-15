'use client';

import React from 'react';
import Image from 'next/image';

interface SellerBadgeProps {
  name: string;
  avatar: string;
}

export default function SellerBadge({ name, avatar }: SellerBadgeProps) {
  return (
    <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
      <div className="relative w-8 h-8 rounded-full overflow-hidden border border-slate-200 bg-slate-100">
        <Image
          src={avatar}
          alt={name}
          fill
          className="object-cover"
          sizes="32px"
        />
      </div>
      <div>
        <span className="text-[10px] text-slate-400 block font-semibold">Listed by</span>
        <span className="text-xs font-bold text-slate-800">{name}</span>
      </div>
    </div>
  );
}
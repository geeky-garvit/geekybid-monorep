'use client';

import { useState } from 'react';
import { useNotifications } from '@/context/NotificationContext';

export default function NotificationMenu() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAllRead, clearNotifications } = useNotifications();
  return <div className="relative"><button onClick={() => { setOpen(!open); if (!open) markAllRead(); }} aria-label="Notifications" className="relative rounded-full border border-slate-200 bg-slate-100 p-2 text-sm hover:bg-slate-200">🔔{unreadCount > 0 && <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">{unreadCount}</span>}</button>{open && <><button aria-label="Close notifications" onClick={() => setOpen(false)} className="fixed inset-0 z-40 cursor-default" /><div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"><div className="flex items-center justify-between border-b border-slate-100 p-3"><span className="text-xs font-black text-slate-900">Notifications</span>{notifications.length > 0 && <button onClick={clearNotifications} className="text-[10px] font-bold text-purple-600">Clear</button>}</div><div className="max-h-80 overflow-y-auto">{notifications.length ? notifications.map((item) => <div key={item.id} className="border-b border-slate-100 p-3 last:border-0"><p className="text-xs font-bold text-slate-800">{item.title}</p><p className="mt-0.5 text-[11px] text-slate-500">{item.detail}</p><p className="mt-1 text-[10px] text-slate-400">{new Date(item.createdAt).toLocaleString()}</p></div>) : <p className="p-6 text-center text-xs text-slate-400">You&apos;re all caught up.</p>}</div></div></>}</div>;
}

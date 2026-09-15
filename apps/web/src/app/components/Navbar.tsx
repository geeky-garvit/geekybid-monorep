'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import NotificationMenu from './NotificationMenu';

export default function Navbar() {
  const { user, watchlist, logout } = useAuth();
  const { cartCount } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const safeWatchlistCount = watchlist?.length ?? 0;
  const safeCartCount = cartCount ?? 0;

  return (
    <header className="relative bg-white border-none sticky top-0 z-40">
      <div className="absolute inset-x-0 bottom-0 h-2 bg-gradient-to-b from-transparent to-purple-50/60 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <Link
          href="/"
          className="text-xl font-black text-purple-950 flex items-center gap-2 shrink-0"
        >
          GeekyBid
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600">
          <Link href="/auctions" className="hover:text-purple-600 transition">
            Explore Marketplace
          </Link>

          <Link href="/watchlist" className="hover:text-purple-600 transition flex items-center gap-1.5">
            <span>Watchlist</span>
            {safeWatchlistCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {safeWatchlistCount}
              </span>
            )}
          </Link>

          <Link href="/winners" className="hover:text-purple-600 transition">
            Winners
          </Link>

          <Link href="/orders" className="hover:text-purple-600 transition">
            My Orders
          </Link>

          <Link href="/cart" className="hover:text-purple-600 transition flex items-center gap-1.5">
            <span>Cart</span>
            {safeCartCount > 0 && (
              <span className="bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {safeCartCount}
              </span>
            )}
          </Link>

          <Link href="/seller/dashboard" className="hover:text-purple-600 transition">
            Seller Dashboard
          </Link>
        </nav>

        {/* User Account Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-3">
              {/* User Avatar + Name */}
              <div className="flex items-center gap-2 bg-slate-100 px-2.5 sm:px-3 py-1.5 rounded-full border border-slate-200">
                <div className="relative w-5 h-5 sm:w-6 sm:h-6 rounded-full overflow-hidden border border-slate-300 shrink-0">
                  <Image
                    src={user.avatar || 'https://api.dicebear.com/9.x/avataaars/svg?seed=User'}
                    alt={user.name || 'User'}
                    fill
                    className="object-cover"
                  />
                </div>

                <span className="text-xs font-bold text-slate-800 hidden sm:inline">
                  {user.name}
                </span>
              </div>

              <NotificationMenu />

              {/* Admin Panel */}
              {user.role === 'admin' && (
                <Link
                  href="/admin"
                  className="hidden lg:flex text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-lg hover:bg-purple-100 transition items-center gap-1"
                >
                  Admin Panel
                </Link>
              )}

              {/* Sign Out */}
              <button
                onClick={logout}
                className="text-xs font-bold text-slate-500 hover:text-rose-600 transition px-2 py-1"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-xs font-bold text-slate-700 hover:text-purple-600 transition px-3 py-1.5 rounded-lg"
              >
                Sign In
              </Link>

              <Link
                href="/register"
                className="text-xs bg-purple-600 hover:bg-purple-700 text-white font-bold px-3.5 py-1.5 rounded-xl transition shadow-sm"
              >
                Register
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-700 rounded-xl hover:bg-slate-100 transition"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="relative md:hidden bg-white border-none px-4 pt-2 pb-6 space-y-4 shadow-lg">
          {!user && (
            <div className="pt-2 border-b border-slate-100 pb-3 flex gap-2">
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex-1 text-center text-xs font-bold bg-slate-100 text-slate-800 py-2 rounded-xl"
              >
                Sign In
              </Link>

              <Link
                href="/register"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex-1 text-center text-xs font-bold bg-purple-600 text-white py-2 rounded-xl"
              >
                Register
              </Link>
            </div>
          )}

          <nav className="flex flex-col gap-1 text-sm font-bold text-slate-700">
            <Link
              href="/auctions"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-purple-50 hover:text-purple-600 transition"
            >
              <svg className="w-5 h-5 fill-purple-600" viewBox="0 0 24 24">
                <path d="M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z" />
              </svg>
              <span>Explore Marketplace</span>
            </Link>

            <Link
              href="/watchlist"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-purple-50 hover:text-purple-600 transition"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 fill-rose-500" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                <span>Watchlist</span>
              </div>
              {safeWatchlistCount > 0 && (
                <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  {safeWatchlistCount}
                </span>
              )}
            </Link>

            <Link
              href="/orders"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-purple-50 hover:text-purple-600 transition"
            >
              <svg className="w-5 h-5 fill-purple-600" viewBox="0 0 24 24">
                <path d="M20 8l-8-5-8 5v10l8 5 8-5V8zm-8-3.3l5.3 3.3-2.3 1.4-5.3-3.3 2.3-1.4zm-6 4.7l5 3.1v6.2l-5-3.1V9.4zm12 9.3l-5 3.1v-6.2l5-3.1v6.2z" />
              </svg>
              <span>My Orders</span>
            </Link>

            <Link
              href="/cart"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-purple-50 hover:text-purple-600 transition"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 fill-purple-600" viewBox="0 0 24 24">
                  <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2zm-9.83-3.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1v2h2l3.6 7.59-1.35 2.44C4.52 15.37 5.48 17 7 17h12v-2H7c-.14 0-.25-.11-.25-.25z" />
                </svg>
                <span>Cart</span>
              </div>
              {safeCartCount > 0 && (
                <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  {safeCartCount}
                </span>
              )}
            </Link>

            <Link
              href="/seller/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-purple-50 hover:text-purple-600 transition"
            >
              <svg className="w-5 h-5 fill-purple-600" viewBox="0 0 24 24">
                <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
              </svg>
              <span>Seller Dashboard</span>
            </Link>

            {user?.role === 'admin' && (
              <Link
                href="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 p-2.5 rounded-xl text-purple-700 bg-purple-50 hover:bg-purple-100 transition font-bold"
              >
                <svg className="w-5 h-5 fill-purple-700" viewBox="0 0 24 24">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-1-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                </svg>
                <span>Admin Panel</span>
              </Link>
            )}

            {user && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                }}
                className="flex items-center gap-3 p-2.5 rounded-xl text-rose-600 hover:bg-rose-50 transition font-bold"
              >
                <span>Sign Out</span>
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
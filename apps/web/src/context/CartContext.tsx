'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';

export interface CartItem {
  id: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
  sellerName?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  updateQuantity: (id: string, delta: number) => Promise<void>;
  clearCart: () => Promise<void>;
  cartCount: number;
  subtotal: number;
  isLoaded: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!user?.id) {
      setCart([]);
      setIsLoaded(true);
      return;
    }

    try {
      const res = await fetch('/api/cart', { cache: 'no-store', credentials: 'include' });
      const data = await res.json();
      setCart(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      console.error('Failed to refresh cart:', err);
      setCart([]);
    } finally {
      setIsLoaded(true);
    }
  }, [user?.id]);

  useEffect(() => {
    setIsLoaded(false);
    refreshCart();

    if (!user?.id) return;

    const intervalId = setInterval(() => {
      void refreshCart();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [user?.id, refreshCart]);

  const addToCart = useCallback(async (newItem: Omit<CartItem, 'quantity'>) => {
    if (!user) return;

    try {
      await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ itemId: newItem.id, quantity: 1 }),
      });
      await refreshCart();
    } catch (err) {
      console.error('Add to cart error:', err);
    }
  }, [refreshCart, user]);

  const removeFromCart = useCallback(async (id: string) => {
    if (!user) return;

    try {
      await fetch(`/api/cart?itemId=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      await refreshCart();
    } catch (err) {
      console.error('Remove cart item error:', err);
    }
  }, [refreshCart, user]);

  const updateQuantity = useCallback(async (id: string, delta: number) => {
    if (!user) return;

    try {
      const currentItem = cart.find((item) => item.id === id);
      const nextQty = (currentItem?.quantity ?? 1) + delta;
      if (nextQty <= 0) {
        await fetch(`/api/cart?itemId=${encodeURIComponent(id)}`, {
          method: 'DELETE',
          credentials: 'include',
        });
      } else {
        await fetch('/api/cart', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ itemId: id, quantity: nextQty }),
        });
      }
      await refreshCart();
    } catch (err) {
      console.error('Update cart quantity error:', err);
    }
  }, [cart, refreshCart, user]);

  const clearCart = useCallback(async () => {
    if (!user) return;

    try {
      await fetch('/api/cart/clear', { method: 'DELETE', credentials: 'include' });
      await refreshCart();
    } catch (err) {
      console.error('Clear cart error:', err);
    }
  }, [refreshCart, user]);

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        subtotal,
        isLoaded,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
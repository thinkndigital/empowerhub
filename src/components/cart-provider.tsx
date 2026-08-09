"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  deliveryCost: number;
  quantity: number;
  imageUrl?: string;
  storeId?: string;
  storeName?: string;
  beneficiaryId: string;
  organizationId?: string;
  stock?: number;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  deliveryTotal: number;
  total: number;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "empowerhub-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* ignore */ }
  }, [items, loaded]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">, qty = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === item.productId);
      if (existing) {
        return prev.map(i => (i.productId === item.productId ? { ...i, quantity: i.quantity + qty } : i));
      }
      return [...prev, { ...item, quantity: qty }];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, qty: number) => {
    setItems(prev =>
      qty <= 0
        ? prev.filter(i => i.productId !== productId)
        : prev.map(i => (i.productId === productId ? { ...i, quantity: qty } : i))
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const deliveryTotal = items.reduce((s, i) => s + (i.deliveryCost || 0), 0);
  const total = subtotal + deliveryTotal;

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clear, count, subtotal, deliveryTotal, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

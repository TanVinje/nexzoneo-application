import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { CartItem, Product } from "./api";

const CART_KEY = "nexzoneo_cart";

interface CartContextType {
  items: CartItem[];
  hydrated: boolean;
  addItem: (product: Product, quantity?: number) => boolean;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  total: number;
  companyId: string | null;
  hasMixedSellers: boolean;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(CART_KEY).then((raw) => {
      if (raw) {
        try {
          setItems(JSON.parse(raw));
        } catch {
          AsyncStorage.removeItem(CART_KEY);
        }
      }
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (items.length === 0) AsyncStorage.removeItem(CART_KEY);
    else AsyncStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = (product: Product, quantity = 1): boolean => {
    const existingCompany = items.length > 0 ? items[0].product.company_id : null;
    if (existingCompany && existingCompany !== product.company_id) {
      Alert.alert(
        "Different seller",
        "Your cart already has items from another seller. Please checkout or clear your cart before adding products from a different seller.",
        [{ text: "OK" }]
      );
      return false;
    }
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { product, quantity }];
    });
    return true;
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) return removeItem(productId);
    setItems((prev) => prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i)));
  };

  const clear = () => setItems([]);
  const total = items.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0);
  const companyId = items.length > 0 ? items[0].product.company_id : null;
  const sellerIds = new Set(items.map((i) => i.product.company_id));
  const hasMixedSellers = sellerIds.size > 1;

  return (
    <CartContext.Provider value={{ items, hydrated, addItem, removeItem, updateQuantity, clear, total, companyId, hasMixedSellers }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

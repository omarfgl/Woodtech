import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode
} from "react";
import type { CartItem } from "../types";

type CartAction =
  | { type: "add"; productId: string; qty: number }
  | { type: "remove"; productId: string }
  | { type: "setQty"; productId: string; qty: number }
  | { type: "clear" };

type CartContextValue = {
  items: CartItem[];
  addItem: (productId: string, qty?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, qty: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

// Reducer tres simple pour ajouter/retirer des items du panier.
function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case "setQty": {
      const nextQty = Math.max(0, Math.round(action.qty));
      if (nextQty === 0) {
        return state.filter((item) => item.productId !== action.productId);
      }
      const existing = state.find((item) => item.productId === action.productId);
      if (existing) {
        return state.map((item) =>
          item.productId === action.productId ? { ...item, qty: nextQty } : item
        );
      }
      return [...state, { productId: action.productId, qty: nextQty }];
    }
    case "add": {
      const existing = state.find((item) => item.productId === action.productId);
      if (existing) {
        return state.map((item) =>
          item.productId === action.productId
            ? { ...item, qty: item.qty + action.qty }
            : item
        );
      }
      return [...state, { productId: action.productId, qty: action.qty }];
    }
    case "remove":
      return state.filter((item) => item.productId !== action.productId);
    case "clear":
      return [];
    default:
      return state;
  }
}

// Fournit le contexte panier a l'ensemble de l'application.
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = useReducer(cartReducer, []);

  // Actions exposees aux composants (ajout, suppression, reinit).
  const addItem = useCallback((productId: string, qty = 1) => {
    dispatch({ type: "add", productId, qty });
  }, []);

  const removeItem = useCallback((productId: string) => {
    dispatch({ type: "remove", productId });
  }, []);

  const setQuantity = useCallback((productId: string, qty: number) => {
    const clamped = Math.max(1, Math.round(qty));
    dispatch({ type: "setQty", productId, qty: clamped });
  }, []);

  const clear = useCallback(() => {
    dispatch({ type: "clear" });
  }, []);

  const value = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      setQuantity,
      clear
    }),
    [items, addItem, removeItem, setQuantity, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// Hook pratique avec message clair si oublie du provider.
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}

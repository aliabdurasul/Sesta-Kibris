// ══════════════════════════════════════════════════════════════
// CartContext — Client-Side Cart State
// ══════════════════════════════════════════════════════════════

import React, { createContext, useContext, useReducer, useMemo, useCallback } from 'react';

const CartContext = createContext(null);

const initialCart = { merchant_id: null, merchant_name: null, items: [] };

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { merchant_id, merchant_name, product } = action;
      // Reset if switching merchant
      if (state.merchant_id && state.merchant_id !== merchant_id) {
        return {
          merchant_id, merchant_name,
          items: [{ ...product, quantity: 1 }],
        };
      }
      const existing = state.items.find(i => i.product_id === product.product_id);
      if (existing) {
        return {
          ...state, merchant_id, merchant_name,
          items: state.items.map(i =>
            i.product_id === product.product_id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return {
        ...state, merchant_id, merchant_name,
        items: [...state.items, { ...product, quantity: 1 }],
      };
    }
    case 'DECREMENT': {
      const items = state.items
        .map(i => i.product_id === action.product_id ? { ...i, quantity: i.quantity - 1 } : i)
        .filter(i => i.quantity > 0);
      return { ...state, items, merchant_id: items.length ? state.merchant_id : null };
    }
    case 'REMOVE':
      const items = state.items.filter(i => i.product_id !== action.product_id);
      return { ...state, items, merchant_id: items.length ? state.merchant_id : null };
    case 'CLEAR':
      return initialCart;
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [cart, dispatch] = useReducer(cartReducer, initialCart);

  const addItem = useCallback((merchantId, merchantName, product) => {
    dispatch({ type: 'ADD_ITEM', merchant_id: merchantId, merchant_name: merchantName, product });
  }, []);

  const decrementItem = useCallback((productId) => {
    dispatch({ type: 'DECREMENT', product_id: productId });
  }, []);

  const removeItem = useCallback((productId) => {
    dispatch({ type: 'REMOVE', product_id: productId });
  }, []);

  const clearCart = useCallback(() => dispatch({ type: 'CLEAR' }), []);

  const itemCount = useMemo(() => cart.items.reduce((sum, i) => sum + i.quantity, 0), [cart.items]);
  const subtotal = useMemo(() =>
    +cart.items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0).toFixed(2),
    [cart.items]
  );

  const value = { cart, addItem, decrementItem, removeItem, clearCart, itemCount, subtotal };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}

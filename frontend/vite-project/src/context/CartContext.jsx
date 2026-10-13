import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { addToCart as addCartItem, getCart, removeFromCart, updateCartItem } from '../services/api';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refreshCart = async () => {
    try {
      setLoading(true);
      const data = await getCart();
      const fetchedItems = data.items || [];
      setItems(fetchedItems);
      setCount(fetchedItems.reduce((total, item) => total + item.quantity, 0));
    } catch {
      setItems([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCart();
  }, []);

  const addToCart = async (productId, quantity = 1) => {
    await addCartItem(productId, quantity);
    await refreshCart();
  };

  const changeQuantity = async (productId, quantity) => {
    await updateCartItem(productId, quantity);
    await refreshCart();
  };

  const removeItem = async (productId) => {
    await removeFromCart(productId);
    await refreshCart();
  };

  const clearCart = () => {
    setItems([]);
    setCount(0);
  };

  const value = useMemo(() => ({
    items,
    count,
    loading,
    refreshCart,
    addToCart,
    changeQuantity,
    removeItem,
    clearCart,
  }), [items, count, loading]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used inside CartProvider');
  }
  return context;
}

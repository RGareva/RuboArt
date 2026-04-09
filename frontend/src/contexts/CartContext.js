import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const CartContext = createContext();

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [] });
  const [cartOpen, setCartOpen] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) {
      setCart({ items: [] });
      return;
    }
    try {
      const { data } = await axios.get(`${API}/cart`, { withCredentials: true });
      setCart(data);
    } catch {
      setCart({ items: [] });
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId, quantity = 1) => {
    const { data } = await axios.post(`${API}/cart/add`, { product_id: productId, quantity }, { withCredentials: true });
    setCart(data);
    setCartOpen(true);
  };

  const updateQuantity = async (productId, quantity) => {
    const { data } = await axios.put(`${API}/cart/update`, { product_id: productId, quantity }, { withCredentials: true });
    setCart(data);
  };

  const removeItem = async (productId) => {
    const { data } = await axios.delete(`${API}/cart/remove/${productId}`, { withCredentials: true });
    setCart(data);
  };

  const clearCart = () => {
    setCart({ items: [] });
  };

  const cartCount = cart.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
  const cartSubtotal = cart.items?.reduce((acc, item) => acc + item.price * item.quantity, 0) || 0;

  return (
    <CartContext.Provider value={{ cart, cartCount, cartSubtotal, cartOpen, setCartOpen, addToCart, updateQuantity, removeItem, clearCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);

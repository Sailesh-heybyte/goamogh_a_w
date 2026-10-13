"use client";
import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchDbCart, addToDbCart, updateDbCartQty, removeFromDbCart, clearDbCart } from '../services/api';

const CartContext = createContext(null);

export function CartProvider({ children }) {
    const { user, token } = useAuth();
    const [cart, setCart] = useState(null);
    const [cartLoading, setCartLoading] = useState(false);
    const [cartError, setCartError] = useState(null);
    const requestIdRef = useRef(0);

    const reloadCart = useCallback(async () => {
        const id = ++requestIdRef.current;
        if (!user || !token) {
            setCart(null);
            setCartError(null);
            return;
        }

        setCartLoading(true);
        try {
            const response = await fetchDbCart(token);
            if (id === requestIdRef.current) {
                setCart(response.data || null);
                setCartError(null);
            }
        } catch (err) {
            if (id === requestIdRef.current) {
                setCartError(err.message || 'Failed to load cart');
            }
        } finally {
            if (id === requestIdRef.current) {
                setCartLoading(false);
            }
        }
    }, [user, token]);

    useEffect(() => {
        reloadCart();
    }, [reloadCart]);

    // TEMPORARY, for compatibility while screens are migrated: listen to window 'cart-updated' and call reloadCart()
    useEffect(() => {
        const handleCartUpdated = () => {
            reloadCart();
        };
        window.addEventListener('cart-updated', handleCartUpdated);
        return () => {
            window.removeEventListener('cart-updated', handleCartUpdated);
        };
    }, [reloadCart]);

    const addCartItem = useCallback(async (variantOrItem, quantity) => {
        const id = ++requestIdRef.current;
        const response = await addToDbCart(token, variantOrItem, quantity);
        if (id === requestIdRef.current) {
            setCart(response.data || null);
            setCartError(null);
        }
        return response;
    }, [token]);

    const updateCartItemQty = useCallback(async (itemId, quantity) => {
        const id = ++requestIdRef.current;
        const response = await updateDbCartQty(token, itemId, quantity);
        if (id === requestIdRef.current) {
            setCart(response.data || null);
            setCartError(null);
        }
        return response;
    }, [token]);

    const removeCartItem = useCallback(async (itemId) => {
        const id = ++requestIdRef.current;
        const response = await removeFromDbCart(token, itemId);
        if (id === requestIdRef.current) {
            setCart(response.data || null);
            setCartError(null);
        }
        return response;
    }, [token]);

    const clearCart = useCallback(async () => {
        const id = ++requestIdRef.current;
        const response = await clearDbCart(token);
        if (id === requestIdRef.current) {
            setCart(response.data || null);
            setCartError(null);
        }
        return response;
    }, [token]);

    const cartItems = useMemo(() => {
        return cart && Array.isArray(cart.items) ? cart.items : [];
    }, [cart]);

    const cartCount = useMemo(() => {
        return cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    }, [cartItems]);

    const value = useMemo(() => ({
        cart,
        cartLoading,
        cartError,
        reloadCart,
        addCartItem,
        updateCartItemQty,
        removeCartItem,
        clearCart,
        cartItems,
        cartCount
    }), [
        cart,
        cartLoading,
        cartError,
        reloadCart,
        addCartItem,
        updateCartItemQty,
        removeCartItem,
        clearCart,
        cartItems,
        cartCount
    ]);

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be wrapped inside CartProvider');
    }
    return context;
}

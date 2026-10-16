'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';

// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Minus,
    X,
    ArrowRight,
    ChevronDown,
    ShoppingBag,
    MapPin,
    Trash2,
    Pencil,
    ArrowLeft,
    Loader,
    AlertTriangle,
    CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
    fetchAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    checkoutCart,
    initiatePayment,
    verifyPayment,
    fetchPaymentStatus,
} from '../api/api';
import { loadRazorpayScript, openRazorpayCheckout } from '../utils/razorpay';

import { INDIAN_STATES } from '../utils/indianStates';

export default function CartPage() {
    const { cart, cartLoading, cartError, reloadCart, updateCartItemQty, removeCartItem } = useCart();

    const cartItems = useMemo(() => {
        if (!cart || !Array.isArray(cart.items)) return [];
        return cart.items.map((item) => ({
            ...item,
            cartId: item.id,
            name: item.product_name,
            weight: item.size_label,
            price: Number(item.price),
            mrp: item.mrp ? Number(item.mrp) : null,
            quantity: Number(item.quantity),
            image: item.image,
            is_inactive: item.is_active === false,
            is_out_of_stock: item.is_out_of_stock,
            insufficient_stock: item.insufficient_stock,
            available_quantity: item.available_quantity,
        }));
    }, [cart]);

    const cartTotals = useMemo(() => {
        if (!cart) return null;
        return {
            total_taxable_amount: cart.total_taxable_amount,
            total_discount_amount: cart.total_discount_amount,
            total_gst_amount: cart.total_gst_amount,
            total_cess_amount: cart.total_cess_amount,
            total_amount: cart.total_amount,
        };
    }, [cart]);

    const [isMounted, setIsMounted] = useState(false);
    const [actionCartError, setCartError] = useState(null);

    const [termsAccepted, setTermsAccepted] = useState(true);

    const { user, token, triggerLoginModal, openLegalModal } = useAuth();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState('');
    const [placingOrder, setPlacingOrder] = useState(false);
    const [checkoutResponse, setCheckoutResponse] = useState(null);
    const [paying, setPaying] = useState(false);
    const [paymentMessage, setPaymentMessage] = useState(null);
    const [paidOrder, setPaidOrder] = useState(null);
    const [checkingStatus, setCheckingStatus] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(600);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [loadingAddresses, setLoadingAddresses] = useState(false);

    const isPlacingOrderRef = useRef(false);
    const isPayingRef = useRef(false);

    useEffect(() => {
        const isTransactionActive = placingOrder;

        const handleBeforeUnload = (e) => {
            if (isTransactionActive) {
                e.preventDefault();
                e.returnValue = 'Your order is being placed.';
                return e.returnValue;
            }
        };

        const handlePopState = () => {
            if (isTransactionActive) {
                window.history.pushState(null, '', window.location.href);
            }
        };

        if (isTransactionActive) {
            window.history.pushState(null, '', window.location.href);
            window.addEventListener('beforeunload', handleBeforeUnload);
            window.addEventListener('popstate', handlePopState);
        }

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('popstate', handlePopState);
        };
    }, [placingOrder]);

    const [newAddress, setNewAddress] = useState({
        address_line_1: '',
        address_line_2: '',
        city: '',
        state: '',
        postal_code: '',
        landmark: '',
        phone: user?.phone || '',
        is_default: false,
    });
    const [savingAddress, setSavingAddress] = useState(false);
    const [addressError, setAddressError] = useState(null);
    const [editingAddressId, setEditingAddressId] = useState(null);

    const loadAddresses = async () => {
        if (user && token) {
            try {
                setLoadingAddresses(true);
                const response = await fetchAddresses(token);
                if (response.success && Array.isArray(response.data)) {
                    setAddresses(response.data);
                    const defaultAddr = response.data.find((a) => a.is_default) || response.data[0];
                    if (defaultAddr && (!selectedAddressId || !response.data.some((a) => a.id === selectedAddressId))) {
                        setSelectedAddressId(defaultAddr.id);
                    }
                } else {
                    setAddresses([]);
                }
            } catch (err) {
                console.error('Failed to load addresses:', err);
            } finally {
                setLoadingAddresses(false);
            }
        }
    };

    useEffect(() => {
        if (isCheckingOut && user && token) {
            loadAddresses();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isCheckingOut, user, token]);

    useEffect(() => {
        if (!checkoutResponse) return;

        const calculateTimeLeft = () => {
            const expiryStr = checkoutResponse.reserved_until;
            if (!expiryStr) return 0;
            const expiryTime = new Date(expiryStr).getTime();
            const now = Date.now();
            return Math.max(0, Math.floor((expiryTime - now) / 1000));
        };

        setSecondsLeft(calculateTimeLeft());

        const timerId = setInterval(() => {
            const left = calculateTimeLeft();
            setSecondsLeft(left);
            if (left <= 0) {
                clearInterval(timerId);
            }
        }, 1000);

        return () => clearInterval(timerId);
    }, [checkoutResponse]);

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60)
            .toString()
            .padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const handleAddAddress = async (e) => {
        e.preventDefault();
        setAddressError(null);

        if (!newAddress.phone.trim() || !/^\d{10}$/.test(newAddress.phone.trim())) {
            setAddressError('Phone number must be a valid 10-digit number.');
            return;
        }
        if (!newAddress.address_line_1.trim() || newAddress.address_line_1.trim().length < 3) {
            setAddressError('Address line 1 is required (at least 3 characters).');
            return;
        }
        if (!newAddress.city.trim() || newAddress.city.trim().length < 2) {
            setAddressError('City is required.');
            return;
        }
        if (!newAddress.state) {
            setAddressError('State selection is required.');
            return;
        }
        if (!newAddress.postal_code.trim() || !/^\d{6}$/.test(newAddress.postal_code.trim())) {
            setAddressError('PIN Code (Postal code) must be exactly 6 digits.');
            return;
        }

        try {
            setSavingAddress(true);
            const addressPayload = {
                address_line_1: newAddress.address_line_1.trim(),
                address_line_2: newAddress.address_line_2.trim() || null,
                city: newAddress.city.trim(),
                state: newAddress.state,
                postal_code: newAddress.postal_code.trim(),
                landmark: newAddress.landmark.trim() || null,
                phone: newAddress.phone.trim(),
                is_default: newAddress.is_default,
            };

            const response = editingAddressId
                ? await updateAddress(token, editingAddressId, addressPayload)
                : await createAddress(token, addressPayload);

            if (response.success && response.data) {
                await loadAddresses();
                setSelectedAddressId(response.data.id || editingAddressId || response.data);
                setShowAddressForm(false);
                setEditingAddressId(null);
                setNewAddress({
                    address_line_1: '',
                    address_line_2: '',
                    city: '',
                    state: '',
                    postal_code: '',
                    landmark: '',
                    phone: user?.phone || '',
                    is_default: false,
                });
            } else {
                setAddressError(response.message || 'Failed to save address.');
            }
        } catch (err) {
            setAddressError(err.message || 'Failed to save address.');
        } finally {
            setSavingAddress(false);
        }
    };

    const handleEditAddressClick = (e, addr) => {
        e.stopPropagation();
        setEditingAddressId(addr.id);
        setNewAddress({
            address_line_1: addr.address_line_1 || '',
            address_line_2: addr.address_line_2 || '',
            city: addr.city || '',
            state: addr.state,
            postal_code: addr.postal_code || '',
            landmark: addr.landmark || '',
            phone: addr.phone || user?.phone || '',
            is_default: addr.is_default || false,
        });
        setAddressError(null);
        setShowAddressForm(true);
    };

    const handleCancelAddressForm = () => {
        setShowAddressForm(false);
        setEditingAddressId(null);
        setNewAddress({
            address_line_1: '',
            address_line_2: '',
            city: '',
            state: '',
            postal_code: '',
            landmark: '',
            phone: user?.phone || '',
            is_default: false,
        });
        setAddressError(null);
    };

    const handleAddNewAddressClick = () => {
        setEditingAddressId(null);
        setNewAddress({
            address_line_1: '',
            address_line_2: '',
            city: '',
            state: '',
            postal_code: '',
            landmark: '',
            phone: user?.phone || '',
            is_default: false,
        });
        setAddressError(null);
        setShowAddressForm(true);
    };

    const handleDeleteAddress = async (e, addressId) => {
        e.stopPropagation();
        try {
            const response = await deleteAddress(token, addressId);
            if (response.success) {
                await loadAddresses();
                if (selectedAddressId === addressId) {
                    setSelectedAddressId('');
                }
            }
        } catch (err) {
            console.error('Failed to delete address:', err);
        }
    };

    const handlePlaceOrder = async () => {
        if (isCartInvalidOrStale) {
            if (hasInactiveItems) setCartError('Please remove inactive products from your cart before placing order.');
            else if (hasStockError) setCartError('Please fix stock issues before placing order.');
            else if (isAddressInvalid) setCartError('Please update delivery address details to proceed.');
            else if (isShippingUnavailable) setCartError('Shipping is unavailable for the selected delivery address.');
            else if (!selectedAddressId)
                setCartError('Please select or add a shipping address before placing your order.');
            setTimeout(() => setCartError(null), 5000);
            return;
        }

        if (isPlacingOrderRef.current || placingOrder || checkoutResponse) {
            return;
        }

        try {
            isPlacingOrderRef.current = true;
            setPlacingOrder(true);
            const response = await checkoutCart(token, {
                address_id: selectedAddressId,
            });

            if (response.success && response.data) {
                setCheckoutResponse(response.data);
                setIsCheckingOut(false);
                setSelectedAddressId('');
                reloadCart();
            } else {
                setCartError(response.message || 'Failed to place order.');
                setTimeout(() => setCartError(null), 5000);
            }
        } catch (err) {
            const stockMsg = err.message || 'An error occurred while placing your order.';
            setCartError(stockMsg);
            if (
                err.status === 409 ||
                stockMsg.toLowerCase().includes('available') ||
                stockMsg.toLowerCase().includes('unit') ||
                stockMsg.toLowerCase().includes('stock')
            ) {
                reloadCart();
            }
            setTimeout(() => setCartError(null), 8000);
        } finally {
            setPlacingOrder(false);
            isPlacingOrderRef.current = false;
        }
    };

    useEffect(() => {
        setIsMounted(true);

        const handleLogoutCleanup = () => {
            setAddresses([]);
            setSelectedAddressId('');
            setCheckoutResponse(null);
            setPaying(false);
            setPaymentMessage(null);
            setPaidOrder(null);
            setCheckingStatus(false);
            isPayingRef.current = false;
            setIsCheckingOut(false);
            isPlacingOrderRef.current = false;
        };

        if (!user || !token) {
            handleLogoutCleanup();
        }

        window.addEventListener('goamogh-auth-logout', handleLogoutCleanup);
        return () => {
            window.removeEventListener('goamogh-auth-logout', handleLogoutCleanup);
        };
    }, [user, token]);

    const subtotal = cartTotals?.total_taxable_amount;
    const tax = cartTotals?.total_gst_amount;
    const cess = cartTotals?.total_cess_amount;
    const total = cartTotals?.total_amount;

    const hasInactiveItems = cartItems.some((item) => item.is_inactive);
    const hasStockError = cartItems.some((item) => item.is_out_of_stock || item.insufficient_stock);
    const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
    const isAddressInvalid =
        selectedAddressId && selectedAddress
            ? !selectedAddress.phone ||
              !/^\d{10}$/.test(selectedAddress.phone.trim()) ||
              !selectedAddress.address_line_1 ||
              selectedAddress.address_line_1.trim().length < 3 ||
              !selectedAddress.city ||
              selectedAddress.city.trim().length < 2 ||
              !selectedAddress.state ||
              !selectedAddress.postal_code ||
              !/^\d{6}$/.test(selectedAddress.postal_code.trim())
            : false;
    const isShippingUnavailable = selectedAddress && selectedAddress.shipping_serviceable === false;
    const isTransactionRunning = placingOrder || isPlacingOrderRef.current;
    const isCartInvalidOrStale =
        cartItems.length === 0 ||
        hasInactiveItems ||
        hasStockError ||
        isAddressInvalid ||
        isShippingUnavailable ||
        isTransactionRunning;

    const updateQuantity = async (cartId, delta) => {
        const targetItem = cartItems.find((item) => item.cartId === cartId);
        if (!targetItem) return;
        const nextQty = (targetItem.quantity || 1) + delta;

        if (nextQty <= 0) {
            await removeItem(cartId);
            return;
        }

        if (user && token) {
            try {
                await updateCartItemQty(cartId, nextQty);
            } catch (e) {
                console.error('Failed to update DB cart quantity:', e);
                const stockMsg = e.message || 'Failed to update cart quantity.';
                setCartError(stockMsg);
                if (
                    e.status === 409 ||
                    stockMsg.toLowerCase().includes('available') ||
                    stockMsg.toLowerCase().includes('unit') ||
                    stockMsg.toLowerCase().includes('stock')
                ) {
                    reloadCart();
                }
                setTimeout(() => setCartError(null), 8000);
            }
        }
    };

    const removeItem = async (cartId) => {
        if (user && token) {
            try {
                await removeCartItem(cartId);
            } catch (e) {
                console.error('Failed to remove item from DB cart:', e);
                setCartError(e.message);
                setTimeout(() => setCartError(null), 5000);
            }
        }
    };

    if (!isMounted) {
        return (
            <section className="min-h-screen w-full bg-[#1a2416] pt-28 pb-20 px-4 md:px-8 lg:px-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[#d8b66a]/5 via-transparent to-transparent opacity-50 pointer-events-none" />
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="bg-[#0b150d] rounded-[24px] md:rounded-[40px] p-8 md:p-14 text-center mb-10 md:mb-14 border border-[#d8b66a]/10 shadow-xl relative overflow-hidden">
                        <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl text-[#d8b66a] leading-tight">
                            Shopping Cart
                        </h1>
                        <p className="text-[#d6cca9]/75 text-[10px] md:text-xs mt-2.5 font-mono tracking-[0.25em] uppercase">
                            Artisan spices built for the modern kitchen
                        </p>
                    </div>
                    <div className="flex justify-center items-center py-24">
                        <div className="w-10 h-10 border-4 border-[#d8b66a] border-t-transparent rounded-full animate-spin" />
                    </div>
                </div>
            </section>
        );
    }

    if (!user || !token) {
        return (
            <section className="min-h-screen w-full bg-[#1a2416] pt-28 pb-20 px-4 md:px-8 lg:px-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[#d8b66a]/5 via-transparent to-transparent opacity-50 pointer-events-none" />
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="bg-[#0b150d] rounded-[24px] md:rounded-[40px] p-8 md:p-14 text-center mb-10 md:mb-14 border border-[#d8b66a]/10 shadow-xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[#d8b66a]/5 via-transparent to-transparent opacity-40" />
                        <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl text-[#d8b66a] relative z-10 leading-tight">
                            Shopping Cart
                        </h1>
                        <p className="text-[#d6cca9]/75 text-[10px] md:text-xs mt-2.5 relative z-10 font-mono tracking-[0.25em] uppercase">
                            Artisan spices built for the modern kitchen
                        </p>
                    </div>

                    <div className="bg-[#0b150d] border border-[#d8b66a]/10 rounded-[28px] p-12 md:p-16 text-center max-w-xl mx-auto shadow-2xl relative overflow-hidden">
                        <div className="w-16 h-16 rounded-full bg-[#1a2416] border border-[#d8b66a]/15 flex items-center justify-center mx-auto mb-6 text-[#d8b66a]">
                            <ShoppingBag size={24} />
                        </div>
                        <p className="text-[#efe3bf] text-xl font-medium mb-2">Please log in to view your cart</p>
                        <p className="text-[#d6cca9]/60 text-sm mb-8">
                            Access your saved items, checkout faster, and track orders by logging in with your phone
                            number.
                        </p>
                        <button
                            onClick={() => triggerLoginModal()}
                            className="inline-flex items-center justify-center bg-[#d8b66a] hover:bg-[#c5a47e] text-[#0b150d] font-bold px-8 py-3.5 rounded-full transition duration-300 text-xs uppercase tracking-widest active:scale-95 shadow-lg shadow-[#d8b66a]/5 hover:shadow-[#d8b66a]/10 cursor-pointer"
                        >
                            Log In / Register
                        </button>
                    </div>
                </div>
            </section>
        );
    }

    if (cartLoading && cart === null) {
        return (
            <section className="min-h-screen w-full bg-[#1a2416] pt-28 pb-20 px-4 md:px-8 lg:px-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[#d8b66a]/5 via-transparent to-transparent opacity-50 pointer-events-none" />
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="bg-[#0b150d] rounded-[24px] md:rounded-[40px] p-8 md:p-14 text-center mb-10 md:mb-14 border border-[#d8b66a]/10 shadow-xl relative overflow-hidden">
                        <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl text-[#d8b66a] leading-tight">
                            Shopping Cart
                        </h1>
                        <p className="text-[#d6cca9]/75 text-[10px] md:text-xs mt-2.5 font-mono tracking-[0.25em] uppercase">
                            Artisan spices built for the modern kitchen
                        </p>
                    </div>
                    <div className="flex justify-center items-center py-24">
                        <div className="w-10 h-10 border-4 border-[#d8b66a] border-t-transparent rounded-full animate-spin" />
                    </div>
                </div>
            </section>
        );
    }

    if (cartError && cart === null) {
        return (
            <section className="min-h-screen w-full bg-[#1a2416] pt-28 pb-20 px-4 md:px-8 lg:px-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[#d8b66a]/5 via-transparent to-transparent opacity-50 pointer-events-none" />
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="bg-[#0b150d] rounded-[24px] md:rounded-[40px] p-8 md:p-14 text-center mb-10 md:mb-14 border border-[#d8b66a]/10 shadow-xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[#d8b66a]/5 via-transparent to-transparent opacity-40" />
                        <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl text-[#d8b66a] relative z-10 leading-tight">
                            Shopping Cart
                        </h1>
                        <p className="text-[#d6cca9]/75 text-[10px] md:text-xs mt-2.5 relative z-10 font-mono tracking-[0.25em] uppercase">
                            Artisan spices built for the modern kitchen
                        </p>
                    </div>

                    <div className="bg-[#0b150d] border border-red-500/20 rounded-[28px] p-12 md:p-16 text-center max-w-xl mx-auto shadow-2xl relative overflow-hidden">
                        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6 text-red-400">
                            <AlertTriangle size={24} />
                        </div>
                        <p className="text-[#efe3bf] text-xl font-medium mb-2">Failed to load cart</p>
                        <p className="text-[#d6cca9]/60 text-sm mb-8">{cartError}</p>
                        <button
                            onClick={() => reloadCart()}
                            className="inline-flex items-center justify-center bg-[#d8b66a] hover:bg-[#c5a47e] text-[#0b150d] font-bold px-8 py-3.5 rounded-full transition duration-300 text-xs uppercase tracking-widest active:scale-95 shadow-lg shadow-[#d8b66a]/5 hover:shadow-[#d8b66a]/10 cursor-pointer"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </section>
        );
    }

    const handleVerifyPayment = async (rzpResponse) => {
        setPaymentMessage({ type: 'info', text: 'Payment received. Confirming your order...' });
        try {
            const res = await verifyPayment(token, checkoutResponse.id, rzpResponse);
            setPaidOrder(res.data);
            setPaymentMessage(null);
            setCheckoutResponse(null);
        } catch (err) {
            if (err.status === 409) {
                setPaymentMessage({ type: 'error', text: err.message, final: true });
            } else if (err.status === 400 || err.status === 404) {
                setPaymentMessage({ type: 'error', text: err.message });
            } else {
                setPaymentMessage({
                    type: 'error',
                    text: 'We could not confirm your payment yet. If money was deducted, your order will be confirmed automatically within a few minutes.',
                    canCheckStatus: true,
                });
            }
        } finally {
            setPaying(false);
            isPayingRef.current = false;
        }
    };

    const handleCheckPaymentStatus = async () => {
        if (!checkoutResponse || !token || checkingStatus) return;
        setCheckingStatus(true);
        try {
            const res = await fetchPaymentStatus(token, checkoutResponse.id);
            const status = res.data.payment_status;
            if (status === 'paid') {
                setPaidOrder({
                    id: checkoutResponse.id,
                    sale_number: checkoutResponse.sale_number,
                    paid_amount: checkoutResponse.total_amount,
                    status: res.data.order_status,
                });
                setPaymentMessage(null);
                setCheckoutResponse(null);
            } else if (status === 'refund_pending' || status === 'refunded') {
                setPaymentMessage({
                    type: 'error',
                    text: 'Your payment was received but the order could not be fulfilled. A full refund has been initiated.',
                    final: true,
                });
            } else {
                setPaymentMessage({
                    type: 'info',
                    text: 'Your payment is not confirmed yet. Please check again in a minute.',
                    canCheckStatus: true,
                });
            }
        } catch (err) {
            setPaymentMessage({ type: 'error', text: err.message, canCheckStatus: true });
        } finally {
            setCheckingStatus(false);
        }
    };

    const handlePayNow = async () => {
        if (!checkoutResponse || !token || isPayingRef.current) return;
        isPayingRef.current = true;
        setPaying(true);
        setPaymentMessage(null);

        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
            setPaymentMessage({
                type: 'error',
                text: 'Could not load the payment window. Check your internet connection and try again.',
            });
            setPaying(false);
            isPayingRef.current = false;
            return;
        }

        let initRes;
        try {
            initRes = await initiatePayment(token, checkoutResponse.id);
        } catch (err) {
            setPaymentMessage({ type: 'error', text: err.message });
            setPaying(false);
            isPayingRef.current = false;
            return;
        }
        const init = initRes.data;
        setCheckoutResponse((prev) => ({ ...prev, reserved_until: init.expires_at }));

        openRazorpayCheckout({
            keyId: init.razorpay_key_id,
            orderId: init.razorpay_order_id,
            amountPaise: init.amount_paise,
            currency: init.currency,
            description: `Order ${checkoutResponse.sale_number}`,
            prefill: init.prefill,
            onSuccess: (rzpResponse) => {
                handleVerifyPayment(rzpResponse);
            },
            onFailed: (error) => {
                setPaymentMessage({ type: 'error', text: error.description });
            },
            onDismiss: () => {
                setPaying(false);
                isPayingRef.current = false;
            },
        });
    };

    if (paidOrder) {
        return (
            <section className="min-h-screen w-full bg-[#1a2416] pt-28 pb-20 px-4 md:px-8 lg:px-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[#d8b66a]/5 via-transparent to-transparent opacity-50 pointer-events-none" />
                <div className="max-w-3xl mx-auto relative z-10 text-center">
                    <div className="bg-[#0b150d] border border-[#d8b66a]/15 rounded-[32px] md:rounded-[48px] p-8 md:p-16 shadow-2xl relative overflow-hidden">
                        <div className="w-20 h-20 rounded-full bg-[#d8b66a]/10 border border-[#d8b66a]/20 flex items-center justify-center mx-auto mb-8 text-[#d8b66a]">
                            <CheckCircle2 size={36} />
                        </div>
                        <h1 className="font-serif text-3xl md:text-5xl text-[#d8b66a] leading-tight mb-4">
                            Payment Confirmed
                        </h1>
                        <p className="text-[#efe3bf] text-base md:text-lg mb-8 max-w-lg mx-auto">
                            Thank you for your purchase. Your payment was successful and your order is confirmed.
                        </p>

                        <div className="bg-[#1a2416]/50 rounded-2xl p-6 mb-8 text-left border border-[#d8b66a]/10 max-w-xl mx-auto font-sans space-y-4">
                            <div className="flex justify-between border-b border-[#d8b66a]/10 pb-2.5">
                                <span className="text-[#efe3bf]/60 text-xs uppercase tracking-wider">Order Number</span>
                                <span className="text-[#efe3bf] font-mono text-sm font-bold">
                                    {paidOrder.sale_number}
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-[#d8b66a]/10 pb-2.5">
                                <span className="text-[#efe3bf]/60 text-xs uppercase tracking-wider">Amount Paid</span>
                                <span className="text-[#d8b66a] font-mono text-sm font-bold">
                                    {paidOrder.paid_amount != null
                                        ? `₹${Number(paidOrder.paid_amount).toFixed(2)}`
                                        : '—'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[#efe3bf]/60 text-xs uppercase tracking-wider">Status</span>
                                <span className="bg-green-500/20 text-green-400 border border-green-500/30 font-mono text-[10px] uppercase px-2 py-0.5 rounded-full font-bold">
                                    {paidOrder.status}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <a
                                href="/shop"
                                className="w-full sm:w-auto inline-flex items-center justify-center bg-[#d8b66a] hover:bg-[#c5a47e] text-[#0b150d] font-bold px-8 py-4 rounded-full transition duration-300 text-xs uppercase tracking-widest active:scale-95 cursor-pointer"
                                style={{ fontFamily: "'Cinzel', serif" }}
                            >
                                Continue Shopping
                            </a>
                            <a
                                href={`/profile?tab=orders&orderId=${paidOrder.id}`}
                                className="w-full sm:w-auto inline-flex items-center justify-center border border-[#d8b66a]/20 hover:border-[#d8b66a]/60 text-[#d8b66a] hover:text-[#efe3bf] font-bold px-8 py-4 rounded-full transition duration-300 text-xs uppercase tracking-widest active:scale-95 cursor-pointer"
                                style={{ fontFamily: "'Cinzel', serif" }}
                            >
                                Track Order
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    if (checkoutResponse) {
        const isExpired = secondsLeft <= 0;
        return (
            <section className="min-h-screen w-full bg-[#1a2416] pt-28 pb-20 px-4 md:px-8 lg:px-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[#d8b66a]/5 via-transparent to-transparent opacity-50 pointer-events-none" />
                <div className="max-w-3xl mx-auto relative z-10 text-center">
                    <div className="bg-[#0b150d] border border-[#d8b66a]/15 rounded-[32px] md:rounded-[48px] p-8 md:p-16 shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[#d8b66a]/5 via-transparent to-transparent opacity-30 pointer-events-none" />

                        <h1 className="font-serif text-3xl md:text-5xl text-[#d8b66a] leading-tight mb-4">
                            Order Reserved
                        </h1>

                        {isExpired ? (
                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm flex items-center justify-center gap-3 font-mono mb-6">
                                <AlertTriangle size={18} className="text-red-400 shrink-0" />
                                <span>Reservation expired. Please order again.</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2 mb-6">
                                <div className="text-[10px] uppercase tracking-[0.2em] text-[#d8b66a] font-bold font-serif">
                                    Time Remaining
                                </div>
                                <div className="font-mono text-3xl font-bold text-white bg-[#1a2416] border border-[#d8b66a]/20 px-6 py-2.5 rounded-2xl shadow-inner">
                                    {formatTime(secondsLeft)}
                                </div>
                            </div>
                        )}

                        <div className="bg-[#1a2416]/50 rounded-2xl p-6 mb-8 text-left border border-[#d8b66a]/10 max-w-xl mx-auto font-sans space-y-4">
                            <div className="flex justify-between border-b border-[#d8b66a]/10 pb-2.5">
                                <span className="text-[#efe3bf]/60 text-xs uppercase tracking-wider">Order Number</span>
                                <span className="text-[#efe3bf] font-mono text-sm font-bold">
                                    {checkoutResponse.sale_number}
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-[#d8b66a]/10 pb-2.5">
                                <span className="text-[#efe3bf]/60 text-xs uppercase tracking-wider">Order Total</span>
                                <span className="text-[#d8b66a] font-mono text-base font-bold">
                                    {checkoutResponse.total_amount != null
                                        ? `₹${Number(checkoutResponse.total_amount).toFixed(2)}`
                                        : '—'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[#efe3bf]/60 text-xs uppercase tracking-wider">
                                    Delivery Address
                                </span>
                                <span className="text-[#efe3bf] text-xs text-right font-medium max-w-[280px] leading-relaxed">
                                    {checkoutResponse.delivery_address}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 justify-center items-center max-w-md mx-auto">
                            {paymentMessage && (
                                <div
                                    className={`w-full p-4 rounded-xl text-sm flex flex-col sm:flex-row items-center justify-center gap-3 font-mono ${paymentMessage.type === 'error' ? 'bg-red-500/10 border border-red-500/20 text-red-200' : 'bg-[#d8b66a]/10 border border-[#d8b66a]/20 text-[#efe3bf]'}`}
                                >
                                    {paymentMessage.type === 'error' && (
                                        <AlertTriangle size={16} className="text-red-400 shrink-0" />
                                    )}
                                    <span>{paymentMessage.text}</span>
                                    {paymentMessage.canCheckStatus && (
                                        <button
                                            type="button"
                                            onClick={handleCheckPaymentStatus}
                                            disabled={checkingStatus}
                                            className="shrink-0 bg-[#d8b66a] hover:bg-[#c5a47e] disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed text-[#0b150d] font-bold px-4 py-2 rounded-full transition duration-300 text-[10px] uppercase tracking-wider cursor-pointer"
                                        >
                                            {checkingStatus ? 'Checking...' : 'Check payment status'}
                                        </button>
                                    )}
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={handlePayNow}
                                disabled={
                                    isExpired ||
                                    paying ||
                                    Boolean(paymentMessage?.canCheckStatus) ||
                                    Boolean(paymentMessage?.final)
                                }
                                className="w-full bg-[#d8b66a] hover:bg-[#c5a47e] disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed text-[#0b150d] font-bold py-4 rounded-full transition duration-300 text-xs uppercase tracking-widest active:scale-95 shadow-lg shadow-[#d8b66a]/5 cursor-pointer flex items-center justify-center gap-2"
                                style={{ fontFamily: "'Cinzel', serif" }}
                            >
                                {paying ? (
                                    <>
                                        <Loader className="w-4 h-4 animate-spin" />
                                        <span>Opening secure payment...</span>
                                    </>
                                ) : (
                                    <span>
                                        Pay{' '}
                                        {checkoutResponse.total_amount != null
                                            ? `₹${Number(checkoutResponse.total_amount).toFixed(2)}`
                                            : ''}
                                    </span>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setCheckoutResponse(null);
                                    setPaymentMessage(null);
                                    setIsCheckingOut(false);
                                }}
                                disabled={paying}
                                className="text-xs uppercase tracking-widest text-[#efe3bf]/50 hover:text-white mt-2 font-mono font-bold transition duration-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Back to Cart
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="min-h-screen w-full bg-[#1a2416] pt-28 pb-20 px-4 md:px-8 lg:px-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[#d8b66a]/5 via-transparent to-transparent opacity-50 pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="bg-[#0b150d] rounded-[24px] md:rounded-[40px] p-8 md:p-14 text-center mb-10 md:mb-14 border border-[#d8b66a]/10 shadow-xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[#d8b66a]/5 via-transparent to-transparent opacity-40" />
                    <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl text-[#d8b66a] relative z-10 leading-tight">
                        Shopping Cart
                    </h1>
                    <p className="text-[#d6cca9]/75 text-[10px] md:text-xs mt-2.5 relative z-10 font-mono tracking-[0.25em] uppercase">
                        Artisan spices built for the modern kitchen
                    </p>
                </div>

                {cartItems.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-[#0b150d] border border-[#d8b66a]/10 rounded-[28px] p-12 md:p-16 text-center max-w-xl mx-auto shadow-2xl"
                    >
                        <div className="w-16 h-16 rounded-full bg-[#1a2416] border border-[#d8b66a]/15 flex items-center justify-center mx-auto mb-6 text-[#d8b66a]">
                            <ShoppingBag size={24} />
                        </div>
                        <p className="text-[#efe3bf] text-xl font-medium mb-2">Your cart is currently empty</p>
                        <p className="text-[#d6cca9]/60 text-sm mb-8">
                            Add premium single-origin spices and handcrafted blends to get started.
                        </p>
                        <a
                            href="/shop"
                            className="inline-flex items-center justify-center bg-[#d8b66a] hover:bg-[#c5a47e] text-[#0b150d] font-bold px-8 py-3.5 rounded-full transition duration-300 text-xs uppercase tracking-widest active:scale-95 shadow-lg shadow-[#d8b66a]/5 hover:shadow-[#d8b66a]/10"
                        >
                            Continue Shopping
                        </a>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10 items-start">
                        <div className="lg:col-span-8 space-y-6">
                            {isCheckingOut ? (
                                <div className="border border-[#d8b66a]/10 rounded-[24px] bg-[#0b150d] p-5 md:p-8 shadow-xl space-y-8">
                                    <button
                                        onClick={() => setIsCheckingOut(false)}
                                        className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-[#d8b66a] hover:text-[#efe3bf] transition duration-200 cursor-pointer"
                                    >
                                        <ArrowLeft size={16} />
                                        <span>Back to Shopping Cart</span>
                                    </button>

                                    <h2 className="font-serif text-2xl md:text-3xl text-[#d8b66a] border-b border-[#d8b66a]/15 pb-4">
                                        Checkout Details
                                    </h2>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center flex-wrap gap-2">
                                            <h3 className="text-white font-serif text-lg flex items-center gap-2">
                                                <MapPin size={18} className="text-[#d8b66a]" />
                                                <span>Shipping Address</span>
                                            </h3>
                                            {!showAddressForm && (
                                                <button
                                                    onClick={handleAddNewAddressClick}
                                                    className="text-[10px] uppercase tracking-wider font-bold text-[#d8b66a] hover:text-white bg-[#1a2416] border border-[#d8b66a]/20 rounded-full px-4 py-1.5 transition duration-200 cursor-pointer"
                                                >
                                                    + Add New Address
                                                </button>
                                            )}
                                        </div>

                                        {showAddressForm ? (
                                            <form
                                                onSubmit={handleAddAddress}
                                                className="bg-[#1a2416]/50 border border-[#d8b66a]/10 rounded-2xl p-6 space-y-4 font-sans text-sm"
                                            >
                                                <h4 className="text-white font-serif font-bold text-sm">
                                                    {editingAddressId
                                                        ? 'Edit Delivery Address'
                                                        : 'New Delivery Address'}
                                                </h4>

                                                {addressError && (
                                                    <div className="p-3 bg-red-950/80 border border-red-500/20 text-red-200 text-xs rounded-xl flex items-center gap-2.5 font-mono">
                                                        <span className="text-red-500 font-bold">⚠</span>{' '}
                                                        {addressError}
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] uppercase tracking-wider text-[#d6cca9]/70 font-semibold block">
                                                            Phone Number *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            required
                                                            placeholder="10-digit phone number"
                                                            value={newAddress.phone}
                                                            onChange={(e) =>
                                                                setNewAddress({
                                                                    ...newAddress,
                                                                    phone: e.target.value.replace(/\D/g, ''),
                                                                })
                                                            }
                                                            className="w-full bg-[#0b150d] border border-[#d8b66a]/20 rounded-xl px-4 py-3 text-white placeholder-[#efe3bf]/20 focus:border-[#d8b66a] outline-none transition font-mono"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] uppercase tracking-wider text-[#d6cca9]/70 font-semibold block">
                                                            Address Line 1 *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            required
                                                            placeholder="Flat, House no., Building"
                                                            value={newAddress.address_line_1}
                                                            onChange={(e) =>
                                                                setNewAddress({
                                                                    ...newAddress,
                                                                    address_line_1: e.target.value,
                                                                })
                                                            }
                                                            className="w-full bg-[#0b150d] border border-[#d8b66a]/20 rounded-xl px-4 py-3 text-white placeholder-[#efe3bf]/20 focus:border-[#d8b66a] outline-none transition"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] uppercase tracking-wider text-[#d6cca9]/70 font-semibold block">
                                                            Address Line 2 (Optional)
                                                        </label>
                                                        <input
                                                            type="text"
                                                            placeholder="Street, Sector, Area"
                                                            value={newAddress.address_line_2}
                                                            onChange={(e) =>
                                                                setNewAddress({
                                                                    ...newAddress,
                                                                    address_line_2: e.target.value,
                                                                })
                                                            }
                                                            className="w-full bg-[#0b150d] border border-[#d8b66a]/20 rounded-xl px-4 py-3 text-white placeholder-[#efe3bf]/20 focus:border-[#d8b66a] outline-none transition"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] uppercase tracking-wider text-[#d6cca9]/70 font-semibold block">
                                                            City *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            required
                                                            placeholder="City/Town"
                                                            value={newAddress.city}
                                                            onChange={(e) =>
                                                                setNewAddress({ ...newAddress, city: e.target.value })
                                                            }
                                                            className="w-full bg-[#0b150d] border border-[#d8b66a]/20 rounded-xl px-4 py-3 text-white placeholder-[#efe3bf]/20 focus:border-[#d8b66a] outline-none transition"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] uppercase tracking-wider text-[#d6cca9]/70 font-semibold block">
                                                            State *
                                                        </label>
                                                        <select
                                                            value={newAddress.state}
                                                            onChange={(e) =>
                                                                setNewAddress({ ...newAddress, state: e.target.value })
                                                            }
                                                            className="w-full bg-[#0b150d] border border-[#d8b66a]/20 rounded-xl px-4 py-3 text-white focus:border-[#d8b66a] outline-none transition"
                                                        >
                                                            <option value="">Select state</option>
                                                            {INDIAN_STATES.map((s) => (
                                                                <option key={s} value={s}>
                                                                    {s}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] uppercase tracking-wider text-[#d6cca9]/70 font-semibold block">
                                                            PIN Code *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            required
                                                            placeholder="6-digit pincode"
                                                            value={newAddress.postal_code}
                                                            onChange={(e) =>
                                                                setNewAddress({
                                                                    ...newAddress,
                                                                    postal_code: e.target.value.replace(/\D/g, ''),
                                                                })
                                                            }
                                                            className="w-full bg-[#0b150d] border border-[#d8b66a]/20 rounded-xl px-4 py-3 text-white placeholder-[#efe3bf]/20 focus:border-[#d8b66a] outline-none transition font-mono"
                                                        />
                                                    </div>
                                                    <div className="col-span-1 md:col-span-2 space-y-1">
                                                        <label className="text-[10px] uppercase tracking-wider text-[#d6cca9]/70 font-semibold block">
                                                            Landmark (Optional)
                                                        </label>
                                                        <input
                                                            type="text"
                                                            placeholder="Near temple, mall etc."
                                                            value={newAddress.landmark}
                                                            onChange={(e) =>
                                                                setNewAddress({
                                                                    ...newAddress,
                                                                    landmark: e.target.value,
                                                                })
                                                            }
                                                            className="w-full bg-[#0b150d] border border-[#d8b66a]/20 rounded-xl px-4 py-3 text-white placeholder-[#efe3bf]/20 focus:border-[#d8b66a] outline-none transition"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 pt-2">
                                                    <input
                                                        type="checkbox"
                                                        id="is_default"
                                                        checked={newAddress.is_default}
                                                        onChange={(e) =>
                                                            setNewAddress({
                                                                ...newAddress,
                                                                is_default: e.target.checked,
                                                            })
                                                        }
                                                        className="rounded border-[#d8b66a]/30 text-[#d8b66a] focus:ring-[#d8b66a]"
                                                    />
                                                    <label
                                                        htmlFor="is_default"
                                                        className="text-xs text-[#d6cca9] cursor-pointer"
                                                    >
                                                        Set as default delivery address
                                                    </label>
                                                </div>

                                                <div className="flex gap-3 pt-4 justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={handleCancelAddressForm}
                                                        disabled={savingAddress}
                                                        className="px-6 py-2.5 border border-white/10 hover:border-white/20 text-[#efe3bf]/85 rounded-xl font-bold uppercase tracking-wider text-[10px] transition duration-200 active:scale-95 disabled:opacity-50 cursor-pointer"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        disabled={savingAddress}
                                                        className="px-6 py-2.5 bg-[#d8b66a] hover:bg-[#c5a47e] text-[#0b150d] rounded-xl font-bold uppercase tracking-wider text-[10px] transition duration-200 active:scale-95 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                                                    >
                                                        {savingAddress ? (
                                                            <>
                                                                <Loader
                                                                    size={12}
                                                                    className="animate-spin text-[#0b150d]"
                                                                />
                                                                <span>
                                                                    {editingAddressId
                                                                        ? 'Updating...'
                                                                        : 'Saving Address...'}
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <span>
                                                                {editingAddressId ? 'Update Address' : 'Save Address'}
                                                            </span>
                                                        )}
                                                    </button>
                                                </div>
                                            </form>
                                        ) : loadingAddresses ? (
                                            <div className="flex justify-center items-center py-8">
                                                <Loader size={24} className="animate-spin text-[#d8b66a]" />
                                            </div>
                                        ) : addresses.length === 0 ? (
                                            <div className="bg-[#1a2416]/30 border border-dashed border-[#d8b66a]/20 rounded-2xl p-8 text-center space-y-4">
                                                <p className="text-[#efe3bf]/60 text-sm">
                                                    No saved shipping addresses found.
                                                </p>
                                                <button
                                                    onClick={handleAddNewAddressClick}
                                                    className="bg-[#d8b66a] hover:bg-[#c5a47e] text-[#0b150d] font-bold px-6 py-3 rounded-full transition duration-300 text-[10px] uppercase tracking-widest active:scale-95 shadow-md cursor-pointer"
                                                >
                                                    Add First Address
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {addresses.map((addr) => {
                                                    const isSelected = selectedAddressId === addr.id;
                                                    const fullAddrString = [
                                                        addr.address_line_1,
                                                        addr.address_line_2,
                                                        addr.city,
                                                        addr.state,
                                                        addr.postal_code,
                                                        addr.landmark && `Landmark: ${addr.landmark}`,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(', ');

                                                    return (
                                                        <div
                                                            key={addr.id}
                                                            onClick={() => setSelectedAddressId(addr.id)}
                                                            className={`border rounded-2xl p-5 cursor-pointer relative transition duration-300 flex flex-col justify-between group ${
                                                                isSelected
                                                                    ? 'border-[#d8b66a] bg-[#d8b66a]/5 shadow-lg shadow-[#d8b66a]/5'
                                                                    : 'border-white/5 bg-[#1a2416]/20 hover:border-white/10 hover:bg-[#1a2416]/40'
                                                            }`}
                                                        >
                                                            <div className="space-y-2.5">
                                                                <div className="flex justify-between items-start">
                                                                    <div className="flex items-center gap-2">
                                                                        <div
                                                                            className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                                                                                isSelected
                                                                                    ? 'border-[#d8b66a] bg-[#d8b66a]'
                                                                                    : 'border-[#efe3bf]/30'
                                                                            }`}
                                                                        >
                                                                            {isSelected && (
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-[#0b150d]" />
                                                                            )}
                                                                        </div>
                                                                        {addr.is_default && (
                                                                            <span className="bg-[#d8b66a]/15 text-[#d8b66a] text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full uppercase">
                                                                                Default
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition duration-200">
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) =>
                                                                                handleEditAddressClick(e, addr)
                                                                            }
                                                                            className="text-[#d8b66a]/60 hover:text-[#d8b66a] hover:bg-[#d8b66a]/10 p-1.5 rounded-full transition cursor-pointer"
                                                                            title="Edit Address"
                                                                        >
                                                                            <Pencil size={13} />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) =>
                                                                                handleDeleteAddress(e, addr.id)
                                                                            }
                                                                            className="text-red-400/60 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-full transition cursor-pointer"
                                                                            title="Delete Address"
                                                                        >
                                                                            <Trash2 size={13} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                <p className="text-white text-xs leading-relaxed font-sans">
                                                                    {fullAddrString}
                                                                </p>
                                                            </div>
                                                            <div className="pt-3 border-t border-[#d8b66a]/10 mt-3 font-mono text-[10px] text-[#d6cca9]/70">
                                                                Phone: {addr.phone}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="border border-[#d8b66a]/10 rounded-[24px] bg-[#0b150d] p-5 md:p-8 shadow-xl">
                                    <div className="hidden md:flex items-center pb-4 border-b border-[#d8b66a]/15 text-[#d8b66a]/60 font-serif text-[11px] uppercase tracking-[0.2em] font-bold">
                                        <div className="w-[45%]">Product</div>
                                        <div className="w-[15%] text-center">Price</div>
                                        <div className="w-[20%] text-center">Quantity</div>
                                        <div className="w-[15%] text-right">Total</div>
                                        <div className="w-[5%]"></div>
                                    </div>

                                    <div className="divide-y divide-[#d8b66a]/10">
                                        {cartItems.map((item) => (
                                            <div
                                                key={item.cartId}
                                                className="flex flex-col md:flex-row md:items-center py-6 gap-4"
                                            >
                                                <div className="flex items-center gap-4 w-full md:w-[45%]">
                                                    {item.image ? (
                                                        <img
                                                            src={item.image}
                                                            alt={item.name}
                                                            width={80}
                                                            height={80}
                                                            loading="lazy"
                                                            decoding="async"
                                                            className="w-20 h-20 rounded-xl object-cover bg-[#d8b66a]/10 border border-[#d8b66a]/10 shrink-0"
                                                        />
                                                    ) : (
                                                        <div
                                                            className="w-20 h-20 rounded-xl flex items-center justify-center bg-[#e9d9a8] text-[#0b150d]/70 font-display text-base shrink-0 border border-[#d8b66a]/10"
                                                            role="img"
                                                            aria-label={`${item.name} – image coming soon`}
                                                        >
                                                            {(item.name || '').charAt(0)}
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <h3 className="font-serif text-base md:text-lg text-white font-medium leading-snug truncate">
                                                            {item.name}
                                                        </h3>
                                                        <p className="text-xs text-[#d6cca9]/60 mt-1 font-mono">
                                                            {item.weight || '250g'} • {item.origin || 'India'}
                                                        </p>
                                                        {item.is_inactive && (
                                                            <p className="text-xs text-amber-400 font-mono font-semibold mt-1 flex items-center gap-1">
                                                                <span>
                                                                    ⚠ Item No Longer Available (Remove to Proceed)
                                                                </span>
                                                            </p>
                                                        )}
                                                        {item.is_out_of_stock && (
                                                            <p className="text-xs text-red-500 font-mono font-semibold mt-1 flex items-center gap-1">
                                                                <span>✗ Out of Stock</span>
                                                            </p>
                                                        )}
                                                        {item.insufficient_stock && (
                                                            <p className="text-xs text-red-400 font-mono font-semibold mt-1 flex items-center gap-1">
                                                                <span>
                                                                    ⚠ Insufficient Stock (Only{' '}
                                                                    {item.available_quantity} available)
                                                                </span>
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex md:block justify-between items-center w-full md:w-[15%] md:text-center">
                                                    <span className="md:hidden text-xs text-[#d6cca9]/50 font-serif">
                                                        Price
                                                    </span>
                                                    <div className="flex flex-col md:items-center">
                                                        <span className="font-mono text-sm text-[#efe3bf]">
                                                            {item.price != null
                                                                ? `₹${Number(item.price).toFixed(2)}`
                                                                : '—'}
                                                        </span>
                                                        {item.mrp != null && item.mrp > item.price && (
                                                            <span className="text-[11px] text-[#d6cca9]/50 line-through font-mono">
                                                                ₹{Number(item.mrp).toFixed(2)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex md:block justify-between items-center w-full md:w-[20%]">
                                                    <span className="md:hidden text-xs text-[#d6cca9]/50 font-serif">
                                                        Quantity
                                                    </span>
                                                    <div className="flex items-center justify-center gap-2 border border-[#d8b66a]/20 rounded-full px-2.5 py-1 w-fit bg-[#1a2416]/50">
                                                        <button
                                                            onClick={() => updateQuantity(item.cartId, -1)}
                                                            className="text-[#d8b66a] hover:text-white transition p-1 cursor-pointer"
                                                            aria-label="Decrease quantity"
                                                        >
                                                            <Minus size={12} strokeWidth={2.5} />
                                                        </button>
                                                        <span className="font-mono text-sm font-semibold text-white px-2 min-w-[20px] text-center">
                                                            {item.quantity || 1}
                                                        </span>
                                                        <button
                                                            onClick={() => updateQuantity(item.cartId, 1)}
                                                            className="text-[#d8b66a] hover:text-white transition p-1 cursor-pointer"
                                                            aria-label="Increase quantity"
                                                        >
                                                            <Plus size={12} strokeWidth={2.5} />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="flex md:block justify-between items-center w-full md:w-[15%] md:text-right">
                                                    <span className="md:hidden text-xs text-[#d6cca9]/50 font-serif">
                                                        Total
                                                    </span>
                                                    <div className="flex flex-col md:items-end font-mono">
                                                        <span className="text-sm text-[#efe3bf]">
                                                            {item.taxable_amount != null
                                                                ? `₹${Number(item.taxable_amount).toFixed(2)}`
                                                                : '—'}
                                                        </span>
                                                        {Number(item.gst_amount) > 0 && (
                                                            <span className="text-[10px] text-[#efe3bf]/40">
                                                                +₹{Number(item.gst_amount).toFixed(2)} GST
                                                            </span>
                                                        )}
                                                        {item.total_amount != null && (
                                                            <span className="text-xs font-bold text-[#d8b66a] border-t border-[#d8b66a]/15 mt-1 pt-0.5">
                                                                ₹{Number(item.total_amount).toFixed(2)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex md:block justify-end w-full md:w-[5%]">
                                                    <button
                                                        onClick={() => removeItem(item.cartId)}
                                                        className="text-red-400/80 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-full transition cursor-pointer"
                                                        aria-label="Remove item"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="lg:col-span-4 space-y-6">
                            <div className="border border-[#d8b66a]/10 rounded-[24px] bg-[#0b150d] p-6 md:p-8 shadow-xl space-y-6">
                                <div className="border-t border-[#d8b66a]/15 pt-5 space-y-3 text-sm">
                                    <div className="flex justify-between text-[#d6cca9]/70 font-mono">
                                        <span>Subtotal</span>
                                        <span>{subtotal != null ? `₹${Number(subtotal).toFixed(2)}` : '—'}</span>
                                    </div>
                                    {cartTotals?.total_discount_amount != null &&
                                        Number(cartTotals.total_discount_amount) > 0 && (
                                            <div className="flex justify-between text-green-400 font-mono">
                                                <span>You save</span>
                                                <span>
                                                    {cartTotals.total_discount_amount != null
                                                        ? `₹${Number(cartTotals.total_discount_amount).toFixed(2)}`
                                                        : '—'}
                                                </span>
                                            </div>
                                        )}
                                    <div className="flex justify-between text-[#d6cca9]/70 font-mono">
                                        <span>GST</span>
                                        <span>{tax != null ? `₹${Number(tax).toFixed(2)}` : '—'}</span>
                                    </div>
                                    {cess != null && Number(cess) > 0 && (
                                        <div className="flex justify-between text-[#d6cca9]/70 font-mono">
                                            <span>Cess</span>
                                            <span>{cess != null ? `₹${Number(cess).toFixed(2)}` : '—'}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-white font-serif text-lg font-bold border-t border-[#d8b66a]/15 pt-4">
                                        <span>Total</span>
                                        <span className="text-[#d8b66a] font-mono">
                                            {total != null ? `₹${Number(total).toFixed(2)}` : '—'}
                                        </span>
                                    </div>

                                    <div className="flex items-start gap-2.5 pt-2 pb-1 text-xs bg-[#1a2416]/40 p-3 rounded-xl border border-[#d8b66a]/15">
                                        <input
                                            type="checkbox"
                                            id="cart_terms_accept"
                                            checked={termsAccepted}
                                            onChange={(e) => setTermsAccepted(e.target.checked)}
                                            className="mt-0.5 rounded border-[#d8b66a]/30 text-[#d8b66a] focus:ring-[#d8b66a] accent-[#d8b66a] cursor-pointer"
                                        />
                                        <label
                                            htmlFor="cart_terms_accept"
                                            className="text-xs text-[#d6cca9]/80 cursor-pointer select-none leading-relaxed"
                                        >
                                            Please accept{' '}
                                            <button
                                                type="button"
                                                onClick={() => openLegalModal('terms')}
                                                className="text-[#d8b66a] underline hover:text-white cursor-pointer"
                                            >
                                                Terms & Conditions
                                            </button>{' '}
                                            and{' '}
                                            <button
                                                type="button"
                                                onClick={() => openLegalModal('privacy')}
                                                className="text-[#d8b66a] underline hover:text-white cursor-pointer"
                                            >
                                                Privacy Policy
                                            </button>
                                        </label>
                                    </div>

                                    {!termsAccepted ? (
                                        <button
                                            disabled
                                            className="w-full bg-gray-700/40 text-gray-400 font-bold py-4 rounded-xl uppercase tracking-widest text-xs flex items-center justify-center gap-2 cursor-not-allowed border border-gray-600/20 opacity-70"
                                        >
                                            <span>Accept Terms to Proceed</span>
                                        </button>
                                    ) : isCheckingOut ? (
                                        showAddressForm ? (
                                            <button
                                                disabled
                                                className="w-full bg-gray-700/40 text-gray-500 font-bold py-4 rounded-xl uppercase tracking-widest text-xs flex items-center justify-center gap-2 cursor-not-allowed border border-gray-600/20 opacity-70"
                                            >
                                                <span>Save address to continue</span>
                                            </button>
                                        ) : !selectedAddressId ? (
                                            <button
                                                disabled
                                                className="w-full bg-gray-700/40 text-gray-500 font-bold py-4 rounded-xl uppercase tracking-widest text-xs flex items-center justify-center gap-2 cursor-not-allowed border border-gray-600/20 opacity-70"
                                            >
                                                <span>Select address to place order</span>
                                            </button>
                                        ) : isAddressInvalid ? (
                                            <button
                                                disabled
                                                className="w-full bg-red-950/40 text-red-400 font-bold py-4 rounded-xl uppercase tracking-widest text-xs flex items-center justify-center gap-2 cursor-not-allowed border border-red-900/20 opacity-70"
                                            >
                                                <span>Update Invalid Address</span>
                                            </button>
                                        ) : isShippingUnavailable ? (
                                            <button
                                                disabled
                                                className="w-full bg-red-950/40 text-red-400 font-bold py-4 rounded-xl uppercase tracking-widest text-xs flex items-center justify-center gap-2 cursor-not-allowed border border-red-900/20 opacity-70"
                                            >
                                                <span>Shipping Unavailable</span>
                                            </button>
                                        ) : hasInactiveItems ? (
                                            <button
                                                disabled
                                                className="w-full bg-red-950/40 text-amber-400 font-bold py-4 rounded-xl uppercase tracking-widest text-xs flex items-center justify-center gap-2 cursor-not-allowed border border-amber-900/20 opacity-70"
                                            >
                                                <span>Remove Inactive Items</span>
                                            </button>
                                        ) : hasStockError ? (
                                            <button
                                                disabled
                                                className="w-full bg-red-950/40 text-red-500 font-bold py-4 rounded-xl uppercase tracking-widest text-xs flex items-center justify-center gap-2 cursor-not-allowed border border-red-900/20 opacity-70"
                                            >
                                                <span>Fix Stock Issues</span>
                                            </button>
                                        ) : (
                                            <button
                                                disabled={isCartInvalidOrStale}
                                                onClick={handlePlaceOrder}
                                                className="w-full bg-[#d8b66a] hover:bg-[#c5a47e] disabled:bg-gray-700/40 disabled:text-gray-500 disabled:cursor-not-allowed text-[#0b150d] font-bold py-4 rounded-xl uppercase tracking-widest text-xs flex items-center justify-center gap-2 active:scale-95 transition-all duration-300 shadow-lg shadow-[#d8b66a]/5 hover:shadow-[#d8b66a]/10 cursor-pointer"
                                            >
                                                {placingOrder ? (
                                                    <>
                                                        <Loader size={12} className="animate-spin text-[#0b150d]" />
                                                        <span>Placing Order...</span>
                                                    </>
                                                ) : (
                                                    <span>
                                                        Place Order (
                                                        {total != null ? `₹${Number(total).toFixed(2)}` : '—'})
                                                    </span>
                                                )}
                                            </button>
                                        )
                                    ) : hasInactiveItems ? (
                                        <button
                                            disabled
                                            className="w-full bg-red-950/40 text-amber-400 font-bold py-4 rounded-xl uppercase tracking-widest text-xs flex items-center justify-center gap-2 cursor-not-allowed border border-amber-900/20 opacity-70"
                                        >
                                            <span>Remove Inactive Items</span>
                                        </button>
                                    ) : hasStockError ? (
                                        <button
                                            disabled
                                            className="w-full bg-red-950/40 text-red-500 font-bold py-4 rounded-xl uppercase tracking-widest text-xs flex items-center justify-center gap-2 cursor-not-allowed border border-red-900/20 opacity-70"
                                        >
                                            <span>Fix Stock Issues</span>
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setIsCheckingOut(true)}
                                            className="w-full bg-[#d8b66a] hover:bg-[#c5a47e] text-[#0b150d] font-bold py-4 rounded-xl uppercase tracking-widest text-xs flex items-center justify-center gap-2 active:scale-95 transition-all duration-300 shadow-lg shadow-[#d8b66a]/5 hover:shadow-[#d8b66a]/10 cursor-pointer"
                                        >
                                            <span>Proceed to Checkout</span>
                                            <ArrowRight size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <AnimatePresence>
                {(actionCartError || cartError) && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-8 left-8 z-50 bg-red-950/95 border border-red-500/30 text-red-200 px-6 py-3.5 rounded-2xl font-mono text-sm shadow-xl flex items-center gap-2.5 backdrop-blur-md max-w-md"
                    >
                        <span className="text-red-500 font-bold">⚠</span> {actionCartError || cartError}
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}

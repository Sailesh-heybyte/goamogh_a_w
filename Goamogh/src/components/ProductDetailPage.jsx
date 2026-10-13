"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { fetchProductDetails, fetchProductVariants, addToDbCart } from '../services/api';
import { ArrowLeft, Minus, Plus, ShoppingBag, Loader, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function ProductDetailPage({ id }) {
    const router = useRouter();
    const { user, token, setLoginPendingItem } = useAuth();

    const [product, setProduct] = useState(null);
    const [variants, setVariants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notAvailable, setNotAvailable] = useState(false);

    const [activeVariantId, setActiveVariantId] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [showCartNotif, setShowCartNotif] = useState(false);
    const [cartError, setCartError] = useState(null);

    // Fetch product details on mount
    useEffect(() => {
        const loadProductDetails = async () => {
            try {
                setLoading(true);
                setError(null);
                setNotAvailable(false);
                const [itemRes, variantsRes] = await Promise.all([
                    fetchProductDetails(id),
                    fetchProductVariants(id)
                ]);
                if (itemRes.success && itemRes.data) {
                    setProduct(itemRes.data);
                    const variantsList = Array.isArray(variantsRes.data) ? variantsRes.data : [];
                    setVariants(variantsList);
                    if (variantsList.length > 0) {
                        setActiveVariantId(variantsList[0].id);
                    }
                } else {
                    setError('Product details not found.');
                }
            } catch (err) {
                if (err.status === 404) {
                    setNotAvailable(true);
                } else {
                    setError(err.message || 'Failed to fetch product details.');
                }
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            loadProductDetails();
        }
    }, [id]);

    if (loading) {
        return (
            <main className="min-h-screen bg-[#1a2416] flex items-center justify-center pt-20">
                <div className="text-center">
                    <Loader className="w-12 h-12 text-[#d8b66a] animate-spin mx-auto mb-4" />
                    <p className="text-[#efe3bf]/70 font-mono text-sm tracking-widest uppercase">Loading Product Details...</p>
                </div>
            </main>
        );
    }

    if (notAvailable) {
        return (
            <main className="min-h-screen bg-[#1a2416] pt-32 pb-20 px-4 md:px-8 flex items-center justify-center">
                <div className="max-w-md w-full text-center rounded-[32px] bg-[#0b150d] p-8 md:p-12 border border-[#d8b66a]/15 shadow-2xl">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                        <AlertCircle size={28} />
                    </div>
                    <h1 className="font-serif text-2xl text-[#efe3bf] mb-4" style={{ fontFamily: "'Cinzel', serif" }}>
                        Product Not Available
                    </h1>
                    <p className="text-[#efe3bf]/60 text-sm mb-8 leading-relaxed">
                        Product not available
                    </p>
                    <Link
                        href="/shop"
                        className="inline-flex bg-[#d8b66a] hover:bg-[#c5a47e] text-[#0b150d] font-bold px-8 py-3.5 rounded-full uppercase tracking-widest text-xs shadow-lg font-serif cursor-pointer active:scale-95 transition-all duration-300"
                        style={{ fontFamily: "'Cinzel', serif" }}
                    >
                        Back to Shop
                    </Link>
                </div>
            </main>
        );
    }

    if (error || !product) {
        return (
            <main className="min-h-screen bg-[#1a2416] pt-32 pb-20 px-4 md:px-8 flex items-center justify-center">
                <div className="max-w-md w-full text-center rounded-[32px] bg-[#0b150d] p-8 md:p-12 border border-[#d8b66a]/15 shadow-2xl">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                        <AlertCircle size={28} />
                    </div>
                    <h1 className="font-serif text-2xl text-[#efe3bf] mb-4" style={{ fontFamily: "'Cinzel', serif" }}>
                        Error Loaded
                    </h1>
                    <p className="text-[#efe3bf]/60 text-sm mb-8 leading-relaxed">
                        {error || 'The requested product could not be loaded.'}
                    </p>
                    <Link
                        href="/shop"
                        className="inline-flex bg-[#d8b66a] hover:bg-[#c5a47e] text-[#0b150d] font-bold px-8 py-3.5 rounded-full uppercase tracking-widest text-xs shadow-lg font-serif cursor-pointer active:scale-95 transition-all duration-300"
                        style={{ fontFamily: "'Cinzel', serif" }}
                    >
                        Back to Shop
                    </Link>
                </div>
            </main>
        );
    }

    const formatWeight = (grams) => {
        if (!grams) return '';
        if (grams >= 1000) return (grams / 1000) + ' kg';
        return grams + 'g';
    };

    // Prepare variants list
    const activeVariants = variants.map(v => ({
        id: v.id,
        label: formatWeight(v.weight_grams),
        price: v.b2c_price !== undefined && v.b2c_price !== null ? v.b2c_price : null,
        mrp: v.mrp !== undefined && v.mrp !== null ? v.mrp : null,
        inStock: v.in_stock
    }));

    const isAvailable = product.is_active === true && product.is_sellable === true && activeVariants.length > 0;
    const activeVariant = activeVariants.find(v => v.id === activeVariantId) || activeVariants[0];
    const selectedPrice = activeVariant?.price ?? null;
    const selectedMrp = activeVariant?.mrp ?? null;
    const isOutOfStock = activeVariant ? !activeVariant.inStock : true;
    const hasDiscount = selectedMrp && selectedPrice && selectedMrp > selectedPrice;
    const discountPercent = hasDiscount ? Math.round(((selectedMrp - selectedPrice) / selectedMrp) * 100) : 0;

    const handleAddToCart = async () => {
        if (!activeVariant || !isAvailable) return;

        const itemData = {
            id: activeVariant.id, // variant UUID
            name: product.name,
            subtitle: product.description || '',
            image: (product.images && product.images[0]) || '',
            weight: activeVariant.label,
            price: selectedPrice,
            quantity: quantity,
            origin: product.sourcing_location || 'India'
        };

        if (!user || !token) {
            // Save pending item to global state so it can be added post-login
            setLoginPendingItem(itemData);
            router.push('/login');
            return;
        }

        try {
            setLoading(true);
            setCartError(null);
            await addToDbCart(token, itemData, quantity);
            window.dispatchEvent(new Event('cart-updated'));
            setShowCartNotif(true);
            setTimeout(() => setShowCartNotif(false), 2000);
        } catch (err) {
            const msg = err.message || 'Failed to add item to cart.';
            setCartError(msg);
            if (err.status === 409 || msg.toLowerCase().includes('available') || msg.toLowerCase().includes('unit') || msg.toLowerCase().includes('stock')) {
                window.dispatchEvent(new Event('cart-updated'));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleQuantityChange = (delta) => {
        setQuantity(prev => Math.max(1, prev + delta));
    };

    // Images for gallery
    const images = Array.isArray(product.images) && product.images.length > 0
        ? product.images
        : [];

    return (
        <main className="min-h-screen bg-[#1a2416] pt-32 pb-20 px-4 md:px-8">
            <div className="max-w-5xl mx-auto">
                {/* Back Button */}
                <Link
                    href="/shop"
                    className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-[#d8b66a] hover:text-[#efe3bf] transition duration-200 cursor-pointer mb-8"
                >
                    <ArrowLeft size={16} />
                    <span>Back to Catalog</span>
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="rounded-[32px] bg-[#0b150d] overflow-hidden shadow-[0_24px_50px_rgba(0,0,0,0.5)] border border-[#d8b66a]/15 p-6 md:p-10 relative"
                >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[#d8b66a]/5 via-transparent to-transparent opacity-60 pointer-events-none" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                        {/* Image Gallery Column */}
                        <div className="space-y-4">
                            <div className="rounded-[22px] bg-[#d8b66a] p-3 relative aspect-square overflow-hidden shadow-xl">
                                <img
                                    src={images[0] || ''}
                                    alt={product.name}
                                    width={600}
                                    height={600}
                                    loading="eager"
                                    decoding="async"
                                    className="w-full h-full object-cover rounded-[18px]"
                                />
                                {!isAvailable ? (
                                    <div className="absolute top-6 left-6 z-10 bg-amber-950/90 border border-amber-500/30 text-amber-400 text-[10px] tracking-[0.2em] uppercase font-mono px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm">
                                        Not Available
                                    </div>
                                ) : isOutOfStock ? (
                                    <div className="absolute top-6 left-6 z-10 bg-red-950/90 border border-red-500/30 text-red-400 text-[10px] tracking-[0.2em] uppercase font-mono px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm">
                                        Out of Stock
                                    </div>
                                ) : (
                                    <div className="absolute top-6 left-6 z-10 bg-green-950/90 border border-green-500/30 text-green-400 text-[10px] tracking-[0.2em] uppercase font-mono px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm">
                                        In Stock
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Details Column */}
                        <div className="flex flex-col justify-between space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <span className="text-[10px] uppercase tracking-[0.25em] text-[#d8b66a] font-bold font-mono">
                                        Pure Hand-Pounded Blend
                                    </span>
                                    <h1 className="font-serif text-3xl md:text-4xl text-[#f3e7c6] tracking-tight mt-1" style={{ fontFamily: "'Cinzel', serif" }}>
                                        {product.name}
                                    </h1>
                                    {product.sourcing_location && (
                                        <p className="text-xs text-[#d8b66a]/70 font-mono mt-2">
                                            From: {product.sourcing_location}
                                        </p>
                                    )}
                                </div>

                                {product.description && (
                                    <>
                                        <div className="h-px bg-[#d8b66a]/10" />
                                        <div className="space-y-2">
                                            <p className="text-xs font-mono uppercase tracking-widest text-[#efe3bf]/40">Description</p>
                                            <p className="text-sm text-[#efe3bf]/85 leading-relaxed font-light">
                                                {product.description}
                                            </p>
                                        </div>
                                    </>
                                )}

                                <div className="h-px bg-[#d8b66a]/10" />

                                {/* Size / Variant Selector */}
                                {activeVariants.length > 0 && (
                                    <div className="space-y-3">
                                        <label className="block text-[10px] uppercase tracking-[0.2em] text-[#d8b66a] font-bold font-serif" style={{ fontFamily: "'Cinzel', serif" }}>
                                            Select Size
                                        </label>
                                        <div className="flex flex-wrap gap-2.5">
                                            {activeVariants.map((v) => {
                                                const isActive = v.id === activeVariantId;
                                                const vOos = !v.inStock;
                                                return (
                                                    <button
                                                        key={v.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setActiveVariantId(v.id);
                                                            setQuantity(1); // reset quantity to 1 on variant change
                                                        }}
                                                        className={`rounded-xl px-4 py-2.5 text-xs font-semibold transition-all duration-200 border flex flex-col items-center gap-0.5 min-w-[70px] cursor-pointer ${isActive
                                                            ? 'bg-[#d8b66a] text-[#0b150d] border-[#d8b66a] shadow-lg shadow-[#d8b66a]/5'
                                                            : 'bg-[#1a2416] text-[#d8b66a] border-[#d8b66a]/15 hover:bg-[#234130] hover:border-[#d8b66a]/30'
                                                            } ${vOos ? 'opacity-40' : ''}`}
                                                    >
                                                        <span className="font-bold">{v.label}</span>
                                                        <span className="text-[10px] opacity-80">{v.price ? `₹${v.price}` : 'N/A'}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Pricing and Add To Cart Action area */}
                            <div className="space-y-5 bg-[#1a2416]/20 p-6 rounded-2xl border border-[#d8b66a]/5">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-[10px] font-mono uppercase tracking-widest text-[#efe3bf]/40">Price</p>
                                        <div className="flex items-baseline gap-2.5 mt-1.5">
                                            {selectedPrice !== null ? (
                                                <>
                                                    <span className="text-3xl font-bold text-[#d8b66a] font-mono">₹{selectedPrice}</span>
                                                    {hasDiscount && (
                                                        <>
                                                            <span className="text-sm text-[#d6cca9]/50 line-through font-mono">₹{selectedMrp}</span>
                                                            <span className="text-[10px] bg-[#d8b66a]/15 text-[#d8b66a] px-2 py-0.5 rounded font-mono font-bold">
                                                                {discountPercent}% OFF
                                                            </span>
                                                        </>
                                                    )}
                                                </>
                                            ) : (
                                                <span className="text-sm font-mono text-[#d6cca9]/50">Price not available</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Stock indicator badge */}
                                    <div className="text-right">
                                        <span className={`px-3 py-1.5 rounded-full text-[10px] tracking-wider uppercase font-mono font-bold ${!isAvailable
                                            ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                                            : isOutOfStock
                                                ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                                                : 'bg-green-500/10 border border-green-500/20 text-green-400'
                                            }`}>
                                            {!isAvailable ? '● Not Available' : isOutOfStock ? '● Out of Stock' : '● In Stock'}
                                        </span>
                                    </div>
                                </div>

                                <div className="h-px bg-[#d8b66a]/10" />

                                {/* Qty & Add to Cart Action Row */}
                                {!isAvailable ? (
                                    <div className="rounded-xl p-4 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-center text-xs uppercase tracking-wider font-mono font-bold">
                                        Not Available
                                    </div>
                                ) : (
                                    <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                                        {/* Qty Selector */}
                                        <div className="flex items-center justify-between border border-[#d8b66a]/20 rounded-xl px-4 py-3 bg-[#0b150d] sm:w-[130px] shrink-0">
                                            <button
                                                type="button"
                                                disabled={isOutOfStock || selectedPrice === null}
                                                onClick={() => handleQuantityChange(-1)}
                                                className="text-[#d8b66a] hover:text-white disabled:opacity-40 transition cursor-pointer"
                                            >
                                                <Minus size={14} strokeWidth={3} />
                                            </button>
                                            <span className="font-mono text-sm font-semibold text-white px-2 min-w-[24px] text-center">
                                                {quantity}
                                            </span>
                                            <button
                                                type="button"
                                                disabled={isOutOfStock || selectedPrice === null}
                                                onClick={() => handleQuantityChange(1)}
                                                className="text-[#d8b66a] hover:text-white disabled:opacity-40 transition cursor-pointer"
                                            >
                                                <Plus size={14} strokeWidth={3} />
                                            </button>
                                        </div>

                                        {/* Add to Cart button */}
                                        <button
                                            type="button"
                                            disabled={isOutOfStock || selectedPrice === null}
                                            onClick={handleAddToCart}
                                            className={`flex-1 font-bold py-4 px-6 rounded-xl uppercase tracking-widest text-[11px] shadow-lg font-serif cursor-pointer active:scale-95 disabled:active:scale-100 flex items-center justify-center gap-2 transition-all duration-300 ${isOutOfStock || selectedPrice === null
                                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                                                : 'bg-[#d8b66a] hover:bg-[#c5a47e] text-[#0b150d] shadow-[#d8b66a]/5 hover:shadow-[#d8b66a]/10'
                                                }`}
                                            style={{ fontFamily: "'Cinzel', serif" }}
                                        >
                                            <ShoppingBag size={14} />
                                            <span>
                                                {selectedPrice === null
                                                    ? 'Price Unavailable'
                                                    : (isOutOfStock ? 'Out of Stock' : 'Add to Cart')
                                                }
                                            </span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Sourcing / Meta details footer card */}
                            {(product.hsn_code || product.unit_code) && (
                                <div className="flex flex-wrap items-center justify-between text-[10px] text-[#efe3bf]/40 uppercase font-mono tracking-wider pt-2 border-t border-[#d8b66a]/5">
                                    {product.hsn_code && <span>HSN: {product.hsn_code}</span>}
                                    {product.unit_code && <span>Unit: {product.unit_code}</span>}
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Notifications */}
            <AnimatePresence>
                {showCartNotif && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-8 left-8 z-50 bg-[#0b150d]/95 border border-[#d8b66a]/30 text-[#d8b66a] px-6 py-3.5 rounded-2xl font-mono text-sm shadow-xl flex items-center gap-2.5 backdrop-blur-md"
                    >
                        <span className="text-green-500 font-bold">✓</span> Added {quantity} × {product.name} ({activeVariant?.label}) to cart!
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {cartError && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-8 left-8 z-50 bg-red-950/95 border border-red-500/30 text-red-200 px-6 py-3.5 rounded-2xl font-mono text-sm shadow-xl flex items-center gap-2.5 backdrop-blur-md max-w-md"
                    >
                        <span className="text-red-500 font-bold">⚠</span> {cartError}
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}

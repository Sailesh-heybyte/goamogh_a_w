"use client";
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Loader, Plus, Minus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getCategoriesOnce, fetchProducts } from '../api/api';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ShopPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get('category_id') || 'all';

  const [categories, setCategories] = useState([{ id: 'all', label: 'All' }]);
  const [categoriesError, setCategoriesError] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedWeights, setSelectedWeights] = useState({});

  const [showCartNotif, setShowCartNotif] = useState(false);
  const [addedProductName, setAddedProductName] = useState('');
  const [cartError, setCartError] = useState(null);
  const { user, token, setLoginPendingItem } = useAuth();
  const { cartItems, addCartItem, updateCartItemQty, removeCartItem, reloadCart } = useCart();

  // Handle URL change for category navigation
  const setActiveCategory = (id) => {
    if (id === 'all') {
      router.push('/shop');
    } else {
      router.push(`/shop?category_id=${id}`);
    }
  };

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load shop categories on mount
  const loadCategories = async () => {
    try {
      setCategoriesError(null);
      const catsRes = await getCategoriesOnce();
      if (catsRes.success && Array.isArray(catsRes.data)) {
        const mappedCats = catsRes.data.map(cat => ({
          id: cat.id,
          label: cat.name
        }));
        setCategories([{ id: 'all', label: 'All' }, ...mappedCats]);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
      setCategoriesError("Couldn't load categories.");
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Fetch products dynamically based on category and search query
  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        setError(null);

        const params = {};
        if (activeCategory !== 'all') {
          params.category_id = activeCategory;
        }
        if (debouncedSearchQuery.trim()) {
          params.search = debouncedSearchQuery.trim();
        }

        const prodsRes = await fetchProducts(params);

        if (prodsRes.success && Array.isArray(prodsRes.data)) {
          const formatWeight = (grams) => {
            if (grams >= 1000) return (grams / 1000) + ' kg';
            return grams + 'g';
          };

          const mappedProds = prodsRes.data
            .map(p => {
              const weights = (p.variants || []).map(v => ({
                id: v.id,
                label: v.weight_label || formatWeight(v.weight_grams),
                price: v.b2c_price !== undefined && v.b2c_price !== null ? v.b2c_price : (v.price !== undefined ? v.price : null),
                mrp: v.mrp,
                inStock: v.in_stock
              }));

              return {
                id: p.id,
                name: p.name,
                category_id: p.category_id,
                subtitle: p.subtitle || p.description || '',
                description: p.description || '',
                image: p.image || (p.images && p.images[0]) || '',
                origin: p.sourcing_location || p.origin || 'India',
                rating: p.rating || 4.5,
                reviews: p.reviews || 0,
                weights: weights
              };
            })
            // Filter out products that have no active variants with pricing configured
            .filter(p => p.weights.length > 0);
          
          setProducts(mappedProds);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error('Failed to load products:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [activeCategory, debouncedSearchQuery]);

  const addToCart = async (product, activeWeight, selectedPrice) => {
    const matchedVariant = product.weights.find(w => w.label === activeWeight);
    const itemData = {
      id: matchedVariant?.id || product.id,
      name: product.name,
      subtitle: product.subtitle || '',
      image: product.image,
      weight: activeWeight,
      price: selectedPrice,
      quantity: 1,
      origin: product.origin || 'India'
    };

    if (!user || !token) {
      // Save pending item to global state so it can be added post-login
      setLoginPendingItem(itemData);
      router.push('/login');
      return;
    }

    try {
      await addCartItem(itemData);
      setAddedProductName(product.name);
      setShowCartNotif(true);
      setTimeout(() => setShowCartNotif(false), 2000);
    } catch (err) {
      console.error('Failed to add to database cart:', err);
      const msg = err.message || 'Failed to add item to cart.';
      setCartError(msg);
      if (err.status === 409 || msg.toLowerCase().includes('available') || msg.toLowerCase().includes('unit') || msg.toLowerCase().includes('stock')) {
        reloadCart();
      }
      setTimeout(() => setCartError(null), 8000);
    }
  };

  const handleUpdateCartQty = async (cartItemId, newQty) => {
    if (!token) return;
    try {
      if (newQty <= 0) {
        await removeCartItem(cartItemId);
      } else {
        await updateCartItemQty(cartItemId, newQty);
      }
    } catch (err) {
      console.error('Failed to update cart quantity on ShopPage:', err);
      setCartError(err.message);
      setTimeout(() => setCartError(null), 5000);
    }
  };

  const updateWeight = (productId, weightLabel) => {
    setSelectedWeights((current) => ({
      ...current,
      [productId]: weightLabel,
    }));
  };

  return (
    <main className="min-h-screen bg-[#1a2416] pt-28 pb-20">
      <section className="mx-auto max-w-[1600px] px-4 md:px-8 lg:px-12">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-[#d8b66a] mb-2 font-mono">The Spice Collection</p>
          <h1 className="font-display text-[clamp(2.5rem,5.5vw,5.2rem)] leading-[0.95] text-[#d8b66a]">
            One Origin. One Truth. Extraordinary Flavor.
          </h1>
          <p className="mt-4 text-sm md:text-base font-light text-[#d6cca9]/90 max-w-3xl mx-auto leading-relaxed">
            Welcome to the Goamogh collection — a carefully curated selection of premium spices, whole spices, powders and heritage blends, chosen for their origin, purity and character.
          </p>
        </div>

        {/* Search Input Box */}
        <div className="mx-auto mt-10 max-w-3xl rounded-full bg-[#0b150d] px-5 py-4 shadow-[0_18px_40px_rgba(0,0,0,0.3)] border border-[#d8b66a]/10">
          <label className="flex items-center gap-4 rounded-full bg-transparent px-2">
            <Search className="h-5 w-5 text-[#d8b66a]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search...."
              className="w-full bg-transparent text-[#f2e7c8] placeholder:text-[#f2e7c8]/40 outline-none font-medium focus:ring-0"
            />
          </label>
        </div>

        {/* Category Filter Tabs */}
        {categoriesError && (
          <p className="mt-6 text-xs text-red-400">
            Couldn't load categories.{' '}
            <button
              type="button"
              onClick={loadCategories}
              className="underline hover:text-red-300 font-medium transition-colors"
            >
              Retry
            </button>
          </p>
        )}
        <div className="mt-8 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((item) => {
            const active = activeCategory === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveCategory(item.id)}
                className={`whitespace-nowrap rounded-full border px-5 py-2 text-sm font-semibold transition-all duration-300 ${active
                  ? 'bg-[#d8b66a] text-[#0b150d] border-[#d8b66a]'
                  : 'border-[#d8b66a]/30 text-[#d8b66a] bg-transparent hover:bg-[#d8b66a]/10'
                  }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="py-16 text-center text-red-400 font-mono text-sm border border-red-500/20 rounded-2xl bg-red-500/5 mt-10 max-w-xl mx-auto">
            ⚠ Failed to load products: {error}
          </div>
        )}

        {/* Products Grid */}
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4 items-stretch">
          {loading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="animate-pulse rounded-[28px] bg-[#0b150d] p-4 border border-[#d8b66a]/5">
                <div className="rounded-[22px] bg-[#d8b66a]/20 aspect-square p-3">
                  <div className="h-full w-full rounded-[18px] bg-[#d8b66a]/10" />
                </div>
                <div className="px-2 pb-2 pt-4">
                  <div className="h-6 w-2/3 bg-[#f2e7c8]/20 rounded-md mb-2" />
                  <div className="h-4 w-1/2 bg-[#d6cca9]/20 rounded-md mb-4" />
                  <div className="flex gap-2 mb-4">
                    <div className="h-6 w-12 bg-[#1a2416] rounded-full border border-[#d8b66a]/5" />
                    <div className="h-6 w-12 bg-[#1a2416] rounded-full border border-[#d8b66a]/5" />
                  </div>
                  <div className="h-10 w-full bg-[#d8b66a]/20 rounded-full" />
                </div>
              </div>
            ))
          ) : (
            <AnimatePresence mode="popLayout">
              {products.map((product) => {
                const activeWeight = selectedWeights[product.id] ?? product.weights[0]?.label;
                const activeVariant = product.weights.find((weight) => weight.label === activeWeight) ?? product.weights[0];
                const selectedPrice = activeVariant?.price;
                const selectedMrp = activeVariant?.mrp;
                
                const isOutOfStock = activeVariant ? !activeVariant.inStock : true;
                const hasDiscount = selectedMrp && selectedPrice && selectedMrp > selectedPrice;
                const discountPercent = hasDiscount ? Math.round(((selectedMrp - selectedPrice) / selectedMrp) * 100) : 0;

                const cartItem = cartItems.find(item => item.variant_id === activeVariant?.id);
                const isInCart = !!cartItem;
                const cartQty = cartItem ? cartItem.quantity : 0;

                return (
                  <motion.article
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96, y: 24 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94, y: 18 }}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="rounded-[28px] bg-[#0b150d] p-4 shadow-xl shadow-black/20 border border-[#d8b66a]/5 flex flex-col h-full"
                  >
                    {/* Link around the image */}
                    <Link href={`/shop/${product.id}`} className="block rounded-[22px] bg-[#d8b66a] p-3 relative overflow-hidden group">
                      <div className="aspect-square overflow-hidden rounded-[18px] bg-[#d8b66a]">
                        <img
                          src={product.image}
                          alt={product.name}
                          width={400}
                          height={400}
                          loading="lazy"
                          decoding="async"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      {isOutOfStock ? (
                        <div className="absolute top-6 left-6 z-10 bg-red-950/90 border border-red-500/30 text-red-400 text-[10px] tracking-[0.2em] uppercase font-mono px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm">
                          Out of Stock
                        </div>
                      ) : (
                        <div className="absolute top-6 left-6 z-10 bg-green-950/90 border border-green-500/30 text-green-400 text-[10px] tracking-[0.2em] uppercase font-mono px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm">
                          In Stock
                        </div>
                      )}
                      {hasDiscount && !isOutOfStock && (
                        <div className="absolute top-6 right-6 z-10 bg-[#d8b66a] text-[#0b150d] text-[10px] tracking-[0.12em] uppercase font-mono font-bold px-3 py-1.5 rounded-full shadow-lg border border-[#f2e7c8]/30">
                          {discountPercent}% OFF
                        </div>
                      )}
                    </Link>

                    <div className="px-2 pb-2 pt-4 text-white flex flex-col flex-grow justify-between">
                      <div className="space-y-4 mb-5">
                        <div>
                          {/* Link around the title */}
                          <Link href={`/shop/${product.id}`} className="hover:text-[#d8b66a] transition-colors duration-250">
                            <h2 className="font-display text-2xl leading-tight text-[#f2e7c8]">{product.name}</h2>
                          </Link>
                          {product.subtitle && (
                            <p className="mt-1 text-xs text-[#d6cca9]/75">{product.subtitle}</p>
                          )}
                          
                          {/* Pricing Row Inline under Title */}
                          <div className={`flex items-baseline gap-2.5 mt-2.5 ${isOutOfStock ? 'opacity-40' : ''}`}>
                            {selectedPrice !== null ? (
                              <>
                                <span className="text-2xl font-bold text-[#d8b66a] font-mono">
                                  ₹{selectedPrice}/-
                                </span>
                                {hasDiscount && (
                                  <span className="text-xs text-[#d6cca9]/50 line-through font-mono">
                                    M.R.P. ₹{selectedMrp}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-xs font-mono text-[#d6cca9]/50">
                                Price coming soon
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Variant Weight Tabs */}
                        <div className="flex flex-wrap gap-2">
                          {product.weights.map((weight) => {
                            const isActive = activeWeight === weight.label;
                            const variantOos = !weight.inStock;
                            return (
                              <button
                                key={weight.label}
                                onClick={() => updateWeight(product.id, weight.label)}
                                className={`rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200 ${isActive
                                  ? 'bg-[#d8b66a] text-[#0b150d]'
                                  : 'bg-[#1a2416] text-[#d8b66a] hover:bg-[#234130] border border-[#d8b66a]/10'
                                  } ${variantOos ? 'opacity-40' : ''}`}
                              >
                                {weight.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {isInCart && selectedPrice !== null && !isOutOfStock ? (
                        <div className="flex items-center justify-between border border-[#d8b66a]/20 rounded-full px-4 py-2 bg-[#1a2416]/50 w-full h-[38px] transition-all duration-300">
                          <button
                            type="button"
                            onClick={() => handleUpdateCartQty(cartItem.id, cartQty - 1)}
                            className="text-[#d8b66a] hover:text-white transition cursor-pointer px-2"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={14} strokeWidth={3} />
                          </button>
                          <span className="font-mono text-sm font-semibold text-white px-2">
                            {cartQty}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateCartQty(cartItem.id, cartQty + 1)}
                            className="text-[#d8b66a] hover:text-white transition cursor-pointer px-2"
                            aria-label="Increase quantity"
                          >
                            <Plus size={14} strokeWidth={3} />
                          </button>
                        </div>
                      ) : (
                        <button
                          disabled={isOutOfStock || selectedPrice === null}
                          onClick={() => addToCart(product, activeWeight, selectedPrice)}
                          className={`w-full font-bold py-2.5 px-4 rounded-full transition-all duration-300 transform active:scale-95 text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg h-[38px] ${isOutOfStock || selectedPrice === null
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                            : 'bg-[#d8b66a] hover:bg-[#c5a47e] text-[#0b150d] shadow-black/10 hover:shadow-[#d8b66a]/5'
                            }`}
                        >
                          <span>
                            {selectedPrice === null 
                              ? 'Unavailable' 
                              : (isOutOfStock ? 'Out of Stock' : 'Add to Cart')
                            }
                          </span>
                        </button>
                      )}
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {!loading && products.length === 0 && (
          <div className="py-16 text-center text-[#d6cca9]/60 font-mono text-sm">
            No products match your search.
          </div>
        )}

        {/* THE GOAMOGH STANDARD & PURITY SECTION */}
        <div className="mt-24 border-t border-[#d8b66a]/15 pt-20">
          <div className="mx-auto max-w-4xl text-center mb-16">
            <p className="text-xs uppercase tracking-[0.4em] text-[#d8b66a] mb-2 font-mono">THE GOAMOGH STANDARD</p>
            <h2 className="font-display text-3xl md:text-5xl text-[#f2e7c8] mb-4">Nothing Added. Nothing Hidden.</h2>
            <p className="text-sm md:text-base text-[#d6cca9]/80 font-light leading-relaxed max-w-2xl mx-auto">
              We believe premium should mean something. Every Goamogh spice is selected and processed with an uncompromising focus on purity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 text-center">
            <div className="rounded-2xl bg-[#0b150d] p-6 border border-[#d8b66a]/10">
              <h3 className="font-display text-lg text-[#d8b66a] mb-2">ZERO FILLERS</h3>
              <p className="text-xs text-[#d6cca9]/70 leading-relaxed">No starch. No unnecessary additives. No shortcuts.</p>
            </div>
            <div className="rounded-2xl bg-[#0b150d] p-6 border border-[#d8b66a]/10">
              <h3 className="font-display text-lg text-[#d8b66a] mb-2">NO ARTIFICIAL COLORS</h3>
              <p className="text-xs text-[#d6cca9]/70 leading-relaxed">The color you see comes from the spice itself.</p>
            </div>
            <div className="rounded-2xl bg-[#0b150d] p-6 border border-[#d8b66a]/10">
              <h3 className="font-display text-lg text-[#d8b66a] mb-2">SMALL-BATCH</h3>
              <p className="text-xs text-[#d6cca9]/70 leading-relaxed">Controlled batches to protect freshness and aroma.</p>
            </div>
            <div className="rounded-2xl bg-[#0b150d] p-6 border border-[#d8b66a]/10">
              <h3 className="font-display text-lg text-[#d8b66a] mb-2">TRADITIONAL METHODS</h3>
              <p className="text-xs text-[#d6cca9]/70 leading-relaxed">Hand-pounded techniques to preserve natural character.</p>
            </div>
            <div className="rounded-2xl bg-[#0b150d] p-6 border border-[#d8b66a]/10">
              <h3 className="font-display text-lg text-[#d8b66a] mb-2">LAB TESTED</h3>
              <p className="text-xs text-[#d6cca9]/70 leading-relaxed">Analytical checks so purity isn't a claim—it's a standard.</p>
            </div>
          </div>

          <div className="mt-16 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-[#d8b66a] font-mono">
              Origin → Harvest → Processing → Batch → You
            </p>
          </div>
        </div>
      </section>

      {/* Cart Notification */}
      <AnimatePresence>
        {showCartNotif && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-8 z-50 bg-[#0b150d]/95 border border-[#d8b66a]/30 text-[#d8b66a] px-6 py-3.5 rounded-2xl font-mono text-sm shadow-xl flex items-center gap-2.5 backdrop-blur-md"
          >
            <span className="text-green-500 font-bold">✓</span> Added {addedProductName} to cart!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Notification */}
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

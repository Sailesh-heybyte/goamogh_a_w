"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Loader } from 'lucide-react';
import { getCategoriesOnce } from '../../api/api';
import Link from 'next/link';

export default function CategoryShowcase() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadCategories = async () => {
            try {
                setLoading(true);
                const res = await getCategoriesOnce();
                if (res.success && Array.isArray(res.data)) {
                    setCategories(res.data);
                } else {
                    setCategories([]);
                }
            } catch (err) {
                console.error('Failed to load home categories:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        loadCategories();
    }, []);

    const containerVariants = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: 0.15
            }
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 30, scale: 0.98 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
        }
    };

    if (loading) {
        return (
            <div className="py-24 bg-[#0c0c0c] text-center border-t border-white/5">
                <Loader className="w-8 h-8 text-[#d9b86d] animate-spin mx-auto mb-4" />
                <p className="text-[#efe3bf]/40 font-mono text-xs uppercase tracking-widest">Curating Collections...</p>
            </div>
        );
    }

    if (error || categories.length === 0) {
        return null; // Fail silently or do not block the page if categories are empty
    }

    return (
        <section className="relative py-24 md:py-36 bg-[#0c0c0c] border-t border-white/5 overflow-hidden z-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(217,184,109,0.02),transparent_70%)] pointer-events-none" />
            <div className="max-w-[1400px] mx-auto px-4 md:px-8">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 md:mb-16 gap-6">
                    <div>
                        <p className="text-[11px] tracking-[0.4em] uppercase text-[#d9b86d] mb-4">Artisan Curations</p>
                        <h2 className="font-display text-[clamp(2.5rem,5vw,5rem)] leading-none text-[#f3e7c6]">
                            Browse Collections
                        </h2>
                    </div>
                    <Link
                        href="/shop"
                        className="group inline-flex items-center gap-2 text-xs uppercase tracking-widest font-serif font-bold text-[#d9b86d] hover:text-[#f3e7c6] transition-colors duration-300"
                        style={{ fontFamily: "'Cinzel', serif" }}
                    >
                        <span>Explore All Products</span>
                        <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform duration-300" />
                    </Link>
                </div>

                {/* Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch"
                >
                    {categories.map((category) => {
                        const categoryImage = category.image || '';

                        return (
                            <motion.div
                                key={category.id}
                                variants={cardVariants}
                                className="group relative rounded-[28px] bg-[#11180f]/40 border border-white/5 overflow-hidden flex flex-col justify-between hover:border-[#d9b86d]/30 transition-colors duration-500 shadow-xl"
                            >
                                <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#11180f]">
                                    <img
                                        src={categoryImage}
                                        alt={category.name}
                                        width={600}
                                        height={375}
                                        loading="lazy"
                                        decoding="async"
                                        className="w-full h-full object-cover grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-90 group-hover:scale-105 transition-all duration-700 ease-out"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0c] via-transparent to-transparent opacity-65" />
                                </div>
                                <div className="p-6 md:p-8 flex-1 flex flex-col justify-between gap-6">
                                    <div className="space-y-3">
                                        <h3 className="font-serif text-2xl text-white font-medium group-hover:text-[#d9b86d] transition-colors duration-300">
                                            {category.name}
                                        </h3>
                                        <p className="text-sm text-[#efe3bf]/60 leading-relaxed font-light line-clamp-2">
                                            {category.description || "Discover premium small-batch harvests from this collection."}
                                        </p>
                                    </div>
                                    <Link
                                        href={`/shop?category_id=${category.id}`}
                                        className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-[#efe3bf]/80 group-hover:text-[#d9b86d] font-semibold transition-colors duration-300"
                                    >
                                        <span>Shop Collection</span>
                                        <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
}

"use client";
import classNames from 'classnames';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

// verified caching fix with webpack memory cache
export default function Header() {
    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [guestCartCount, setGuestCartCount] = useState(0);
    const { user, token, logout, triggerLoginModal } = useAuth();
    const { cartCount } = useCart();

    useEffect(() => {
        if (user && token) return;

        const updateCount = () => {
            try {
                const saved = localStorage.getItem('spiceCart');
                const items = saved ? JSON.parse(saved) : [];
                const count = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
                setGuestCartCount(count);
            } catch (e) {
                setGuestCartCount(0);
            }
        };

        updateCount();
        window.addEventListener('cart-updated', updateCount);
        window.addEventListener('storage', updateCount);
        return () => {
            window.removeEventListener('cart-updated', updateCount);
            window.removeEventListener('storage', updateCount);
        };
    }, [user, token]);

    const navItems = [
        { name: 'Shop', path: '/shop' },
        { name: 'Recipes', path: '/recipes' },
        { name: 'Heritage', path: '/heritage' },
        { name: 'About Us', path: '/about' },
        { name: 'Contact', path: '/contact' }
    ];

    useEffect(() => {
        const onScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        // Close menu when route changes
        setIsMenuOpen(false);
    }, [pathname]);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMenuOpen]);

    // Framer Motion Variants
    const menuVariants = {
        closed: {
            y: '-100%',
            opacity: 0,
            transition: {
                y: { stiffness: 1000 },
                duration: 0.4,
                ease: [0.16, 1, 0.3, 1]
            }
        },
        open: {
            y: 0,
            opacity: 1,
            transition: {
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1],
                staggerChildren: 0.08,
                delayChildren: 0.1
            }
        }
    };

    const linkVariants = {
        closed: { opacity: 0, y: 20 },
        open: {
            opacity: 1,
            y: 0,
            transition: {
                type: 'spring',
                stiffness: 260,
                damping: 20
            }
        }
    };

    const footerVariants = {
        closed: { opacity: 0 },
        open: {
            opacity: 1,
            transition: { delay: 0.5, duration: 0.4 }
        }
    };

    return (
        <>
            {/* ========================================================================= */}
            {/* DESKTOP HEADER (Floating Symmetrical Pill Header)                           */}
            {/* ========================================================================= */}
            <motion.header
                className="hidden md:flex fixed top-0 left-0 w-full z-50 transition-all duration-500 px-4 lg:px-8 py-3 pointer-events-none"
            >
                <div
                    className={classNames(
                        "w-full max-w-7xl mx-auto rounded-full pointer-events-auto transition-colors duration-500 flex items-center justify-between px-8 py-3.5 shadow-2xl border",
                        scrolled 
                            ? "bg-[#0b150d]/95 border-[#d8b66a]/30 shadow-[0_16px_40px_rgba(0,0,0,0.6)]" 
                            : "bg-[#0b150d]/90 border-[#d8b66a]/20 shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
                    )}
                >
                    {/* Left: Navigation Group 1 (Shop, Recipes, Heritage) */}
                    <nav className="flex items-center gap-6 lg:gap-8 text-[11px] uppercase tracking-[0.25em] font-bold font-serif w-1/3 whitespace-nowrap" style={{ fontFamily: "'Cinzel', serif" }}>
                        <Link
                            href="/shop"
                            className={classNames(
                                "relative py-1 transition-all duration-300 hover:text-[#d8b66a]",
                                pathname === "/shop" ? "text-[#d8b66a] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-[#d8b66a] after:rounded-full" : "text-white/80"
                            )}
                        >
                            Shop
                        </Link>
                        <Link
                            href="/recipes"
                            className={classNames(
                                "relative py-1 transition-all duration-300 hover:text-[#d8b66a]",
                                pathname === "/recipes" ? "text-[#d8b66a] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-[#d8b66a] after:rounded-full" : "text-white/80"
                            )}
                        >
                            Recipes
                        </Link>
                        <Link
                            href="/heritage"
                            className={classNames(
                                "relative py-1 transition-all duration-300 hover:text-[#d8b66a]",
                                pathname === "/heritage" ? "text-[#d8b66a] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-[#d8b66a] after:rounded-full" : "text-white/80"
                            )}
                        >
                            Heritage
                        </Link>
                    </nav>

                    {/* Center: Brand Logo (100% Mathematically Centered) */}
                    <div className="flex justify-center items-center w-1/3">
                        <Link href="/" className="shrink-0 group">
                            <img
                                src="/brand/goamogh-golden.png"
                                alt="Goamogh"
                                className="h-7 w-auto object-contain transition-transform duration-500 group-hover:scale-105"
                            />
                        </Link>
                    </div>

                    {/* Right: Navigation Group 2 (About, Contact) + Auth & Cart */}
                    <div className="flex items-center justify-end gap-6 lg:gap-8 w-1/3 whitespace-nowrap">
                        <nav className="flex items-center gap-6 lg:gap-8 text-[11px] uppercase tracking-[0.25em] font-bold font-serif" style={{ fontFamily: "'Cinzel', serif" }}>
                            <Link
                                href="/about"
                                className={classNames(
                                    "relative py-1 transition-all duration-300 hover:text-[#d8b66a]",
                                    pathname === "/about" ? "text-[#d8b66a] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-[#d8b66a] after:rounded-full" : "text-white/80"
                                )}
                            >
                                About Us
                            </Link>
                            <Link
                                href="/contact"
                                className={classNames(
                                    "relative py-1 transition-all duration-300 hover:text-[#d8b66a]",
                                    pathname === "/contact" ? "text-[#d8b66a] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-[#d8b66a] after:rounded-full" : "text-white/80"
                                )}
                            >
                                Contact
                            </Link>
                        </nav>

                        <div className="h-4 w-[1px] bg-[#d8b66a]/20 shrink-0" />

                        {user ? (
                            <div className="flex items-center gap-4">
                                <Link
                                    href="/profile"
                                    className={classNames(
                                        "text-[11px] uppercase tracking-[0.25em] font-bold font-serif transition-colors whitespace-nowrap",
                                        pathname === "/profile" ? "text-[#d8b66a]" : "text-[#efe3bf] hover:text-[#d8b66a]"
                                    )}
                                    style={{ fontFamily: "'Cinzel', serif" }}
                                >
                                    Profile
                                </Link>
                                <button
                                    onClick={logout}
                                    className="text-[11px] uppercase tracking-[0.25em] font-bold font-serif text-[#d8b66a] hover:text-[#c5a47e] transition-colors whitespace-nowrap cursor-pointer"
                                    style={{ fontFamily: "'Cinzel', serif" }}
                                >
                                    Log Out
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => triggerLoginModal()}
                                className="text-[11px] uppercase tracking-[0.25em] font-bold font-serif text-white/80 hover:text-[#d8b66a] transition-colors whitespace-nowrap cursor-pointer"
                                style={{ fontFamily: "'Cinzel', serif" }}
                            >
                                Log In
                            </button>
                        )}

                        <Link
                            href="/cart"
                            className="relative text-white/80 hover:text-[#d8b66a] transition-colors p-1.5 rounded-full hover:bg-[#1a2416]"
                            aria-label="View Cart"
                        >
                            <ShoppingBag size={18} strokeWidth={2} />
                            {(user && token ? cartCount : guestCartCount) > 0 && (
                                <span className="absolute -top-1 -right-1 bg-[#d8b66a] text-[#0b150d] text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center border border-[#1a2b21] px-1">
                                    {user && token ? cartCount : guestCartCount}
                                </span>
                            )}
                        </Link>
                    </div>
                </div>
            </motion.header>


            {/* ========================================================================= */}
            {/* MOBILE HEADER (Sleek Top Ribbon)                                          */}
            {/* ========================================================================= */}
            <div
                className={classNames(
                    "md:hidden fixed top-0 left-0 w-full z-50 transition-all duration-300 px-6 py-4 flex items-center justify-between",
                    scrolled 
                        ? "bg-[#1a2416]/[0.97] border-b border-[#c5a47e]/15 shadow-lg" 
                        : "bg-transparent"
                )}
            >
                {/* Logo */}
                <Link href="/" className="flex items-center justify-center shrink-0">
                    <img
                        src="/brand/goamogh-golden.png"
                        alt="Goamogh"
                        className="h-5 w-auto object-contain"
                    />
                </Link>

                {/* Action Buttons */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/cart"
                        className="relative text-[#efe3bf] hover:text-[#c5a47e] transition-colors p-1"
                        aria-label="View Cart"
                    >
                        <ShoppingBag size={18} strokeWidth={2} />
                        {(user && token ? cartCount : guestCartCount) > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-[#d8b66a] text-[#0b150d] text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center border border-[#1a2416] px-1">
                                {user && token ? cartCount : guestCartCount}
                            </span>
                        )}
                    </Link>
                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className="text-[#efe3bf] hover:text-[#c5a47e] transition-colors p-1"
                        aria-label="Open navigation menu"
                    >
                        <Menu size={22} />
                    </button>
                </div>
            </div>


            {/* ========================================================================= */}
            {/* MOBILE MENU CANVAS OVERLAY                                                */}
            {/* ========================================================================= */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        data-lenis-prevent
                        initial="closed"
                        animate="open"
                        exit="closed"
                        variants={menuVariants}
                        className="md:hidden fixed inset-0 z-[100] bg-[#11180f] text-[#efe3bf] flex flex-col justify-between p-6 overflow-hidden"
                    >
                        {/* Overlay Header Bar */}
                        <div className="flex items-center justify-between py-2 border-b border-[#c5a47e]/10">
                            {/* Logo */}
                            <Link href="/" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-center shrink-0">
                                <img
                                    src="/brand/goamogh-golden.png"
                                    alt="Goamogh"
                                    className="h-5 w-auto object-contain"
                                />
                            </Link>
                            {/* Close Button */}
                            <div className="flex items-center gap-4">
                                <Link
                                    href="/cart"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="relative text-[#efe3bf] hover:text-[#c5a47e] transition-colors p-1"
                                    aria-label="View Cart"
                                >
                                    <ShoppingBag size={18} strokeWidth={2} />
                                    {cartCount > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 bg-[#d8b66a] text-[#0b150d] text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center border border-[#11180f] px-1">
                                            {cartCount}
                                        </span>
                                    )}
                                </Link>
                                <button
                                    onClick={() => setIsMenuOpen(false)}
                                    className="text-[#efe3bf] hover:text-[#c5a47e] transition-colors p-1"
                                    aria-label="Close navigation menu"
                                >
                                    <X size={22} />
                                </button>
                            </div>
                        </div>

                        {/* Navigation Links Area */}
                        <div className="flex flex-col gap-6 my-auto pt-10 pl-4">
                            {navItems.map((item) => (
                                <motion.div
                                    key={item.name}
                                    variants={linkVariants}
                                >
                                    <Link
                                        href={item.path}
                                        onClick={() => setIsMenuOpen(false)}
                                        className={classNames(
                                            "text-4xl font-bold tracking-[0.15em] block transition-all duration-300 font-serif",
                                            pathname === item.path ? "text-[#c5a47e] translate-x-2" : "text-[#efe3bf]/80 hover:text-white hover:translate-x-2"
                                        )}
                                        style={{ fontFamily: "'Cinzel', serif" }}
                                    >
                                        {item.name}
                                    </Link>
                                </motion.div>
                            ))}
                            <motion.div variants={linkVariants}>
                                {user ? (
                                    <div className="flex flex-col gap-6">
                                        <Link
                                            href="/profile"
                                            onClick={() => setIsMenuOpen(false)}
                                            className={classNames(
                                                "text-4xl font-bold tracking-[0.15em] block transition-all font-serif",
                                                pathname === "/profile" ? "text-[#d8b66a]" : "text-[#efe3bf]/80 hover:text-white"
                                            )}
                                            style={{ fontFamily: "'Cinzel', serif" }}
                                        >
                                            Profile
                                        </Link>
                                        <button
                                            onClick={() => {
                                                logout();
                                                setIsMenuOpen(false);
                                            }}
                                            className="text-4xl font-bold tracking-[0.15em] block text-[#d8b66a] hover:text-[#efe3bf] transition-all font-serif text-left"
                                            style={{ fontFamily: "'Cinzel', serif" }}
                                        >
                                            Log Out
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            triggerLoginModal();
                                        }}
                                        className="text-4xl font-bold tracking-[0.15em] block text-[#efe3bf]/80 hover:text-[#d8b66a] transition-all font-serif text-left"
                                        style={{ fontFamily: "'Cinzel', serif" }}
                                    >
                                        Log In
                                    </button>
                                )}
                            </motion.div>
                        </div>

                        {/* Fine details footer inside overlay */}
                        <motion.div
                            variants={footerVariants}
                            className="border-t border-[#c5a47e]/10 pt-6 pb-4 flex flex-col gap-4 pl-4 text-xs font-serif tracking-[0.2em] text-[#efe3bf]/60 uppercase"
                            style={{ fontFamily: "'Cinzel', serif" }}
                        >
                            <div className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#c5a47e]" />
                                <span>Pure Hand-Pounded Blends</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#c5a47e]" />
                                <span>Goa, India</span>
                            </div>
                            <div className="flex justify-between items-center mt-2 text-[10px] lowercase tracking-[0.1em] text-[#efe3bf]/40 border-t border-[#c5a47e]/5 pt-3">
                                <span>heritage@goamogh.com</span>
                                <span>@goamogh</span>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}


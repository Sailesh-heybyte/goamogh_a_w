'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { FileText, ShieldCheck, ChevronRight } from 'lucide-react';
import { SOCIAL_LINKS } from '../social/socialLinks';
import { getCategoriesOnce } from '../../api/productService';

export default function Footer() {
    const { openLegalModal } = useAuth();
    const [shopCategories, setShopCategories] = useState([]);

    useEffect(() => {
        let isMounted = true;
        getCategoriesOnce()
            .then((res) => {
                if (isMounted && res && res.success && Array.isArray(res.data)) {
                    setShopCategories(res.data.slice(0, 4));
                }
            })
            .catch(() => {});
        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <footer className="relative w-full bg-black text-white pt-20 pb-8 px-6 md:px-12 border-t border-white/10">
            <div className="max-w-[1920px] mx-auto">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 mb-16">
                    <div>
                        <h4 className="font-sans font-bold text-[10px] tracking-[0.2em] text-[#d8b66a] mb-6 uppercase">
                            SHOP
                        </h4>
                        <ul className="space-y-3 font-sans text-xs text-white/80">
                            <li>
                                <Link href="/shop" className="hover:text-[#d8b66a] transition-colors">
                                    All Products
                                </Link>
                            </li>
                            {shopCategories.map((c) => (
                                <li key={c.id}>
                                    <Link
                                        href={`/shop?category_id=${c.id}`}
                                        className="hover:text-[#d8b66a] transition-colors"
                                    >
                                        {c.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-sans font-bold text-[10px] tracking-[0.2em] text-[#d8b66a] mb-6 uppercase">
                            GO AMOGH
                        </h4>
                        <ul className="space-y-3 font-sans text-xs text-white/80">
                            <li>
                                <Link href="/about" className="hover:text-[#d8b66a] transition-colors">
                                    Our Story
                                </Link>
                            </li>
                            <li>
                                <Link href="/heritage" className="hover:text-[#d8b66a] transition-colors">
                                    Our Origin
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="hover:text-[#d8b66a] transition-colors">
                                    Contact Us
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-sans font-bold text-[10px] tracking-[0.2em] text-[#d8b66a] mb-6 uppercase">
                            CUSTOMER CARE
                        </h4>
                        <ul className="space-y-3 font-sans text-xs text-white/80">
                            <li>
                                <Link href="/contact" className="hover:text-[#d8b66a] transition-colors">
                                    Shipping & Delivery
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="hover:text-[#d8b66a] transition-colors">
                                    Cancellation & Refunds
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="hover:text-[#d8b66a] transition-colors">
                                    FAQs
                                </Link>
                            </li>
                            <li>
                                <button
                                    onClick={() => openLegalModal('terms')}
                                    className="hover:text-[#d8b66a] text-left transition-colors cursor-pointer"
                                >
                                    Grievance Redressal
                                </button>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-sans font-bold text-[10px] tracking-[0.2em] text-[#d8b66a] mb-6 uppercase flex items-center gap-1.5">
                            <ShieldCheck size={13} className="text-[#d8b66a]" />
                            <span>LEGAL</span>
                        </h4>
                        <ul className="space-y-3 font-sans text-xs text-white/80">
                            <li>
                                <button
                                    onClick={() => openLegalModal('terms')}
                                    className="hover:text-[#d8b66a] text-left transition-colors cursor-pointer"
                                >
                                    Terms & Conditions
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => openLegalModal('privacy')}
                                    className="hover:text-[#d8b66a] text-left transition-colors cursor-pointer"
                                >
                                    Privacy Policy
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => openLegalModal('privacy')}
                                    className="hover:text-[#d8b66a] text-left transition-colors cursor-pointer"
                                >
                                    Cookie Policy
                                </button>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-sans font-bold text-[10px] tracking-[0.2em] text-[#d8b66a] mb-6 uppercase">
                            PAYMENT MODES
                        </h4>
                        <p className="text-xs text-white/70 font-sans mb-4">We accept 100% secure payments via:</p>
                        <div className="grid grid-cols-2 gap-2.5 max-w-[200px]">
                            <div
                                className="bg-white px-2.5 py-1.5 rounded border border-white/20 shadow-sm hover:scale-105 transition-transform flex items-center justify-center h-8"
                                aria-label="Visa"
                            >
                                <img
                                    src="/payment/png/visa.png"
                                    alt="Visa"
                                    className="h-5 w-auto object-contain"
                                    loading="lazy"
                                />
                            </div>
                            <div
                                className="bg-white px-2.5 py-1.5 rounded border border-white/20 shadow-sm hover:scale-105 transition-transform flex items-center justify-center h-8"
                                aria-label="Mastercard"
                            >
                                <img
                                    src="/payment/png/mastercard.png"
                                    alt="Mastercard"
                                    className="h-5 w-auto object-contain"
                                    loading="lazy"
                                />
                            </div>
                            <div
                                className="bg-white px-2.5 py-1.5 rounded border border-white/20 shadow-sm hover:scale-105 transition-transform flex items-center justify-center h-8"
                                aria-label="RuPay"
                            >
                                <img
                                    src="/payment/png/rupay.png"
                                    alt="RuPay"
                                    className="h-5 w-auto object-contain"
                                    loading="lazy"
                                />
                            </div>
                            <div
                                className="bg-white px-2.5 py-1.5 rounded border border-white/20 shadow-sm hover:scale-105 transition-transform flex items-center justify-center h-8"
                                aria-label="UPI"
                            >
                                <img
                                    src="/payment/png/upi.png"
                                    alt="UPI"
                                    className="h-5 w-auto object-contain"
                                    loading="lazy"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full overflow-hidden border-t border-white/10 pt-8">
                    <img
                        src="/brand/goamogh-golden.png"
                        alt="Goamogh"
                        className="mx-auto h-auto w-[min(80vw,700px)] opacity-95 select-none pointer-events-none"
                    />
                </div>

                <div className="flex flex-col items-center gap-4 mt-10">
                    <h4 className="font-sans font-bold text-[10px] tracking-[0.2em] text-[#d8b66a] uppercase">
                        FOLLOW US
                    </h4>
                    <div className="flex items-center gap-4">
                        {SOCIAL_LINKS.map((social) => (
                            <a
                                key={social.name}
                                href={social.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`Goamogh on ${social.name}`}
                                title={social.name}
                                className="w-10 h-10 rounded-full border border-[#d8b66a]/30 text-[#d8b66a] flex items-center justify-center hover:bg-[#d8b66a] hover:text-black hover:border-[#d8b66a] transition-colors duration-300"
                            >
                                {social.icon}
                            </a>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center mt-8 text-[10px] text-white/50 font-sans uppercase tracking-widest">
                    <p>© 2026 Go Amogh (OPC) Private Limited. All Rights Reserved.</p>
                    <div className="flex gap-8 mt-4 md:mt-0">
                        <button
                            onClick={() => openLegalModal('privacy')}
                            className="cursor-pointer hover:text-[#d8b66a] transition"
                        >
                            Privacy Policy
                        </button>
                        <button
                            onClick={() => openLegalModal('terms')}
                            className="cursor-pointer hover:text-[#d8b66a] transition"
                        >
                            Terms & Conditions
                        </button>
                        <span className="cursor-pointer hover:text-white">Sitemap</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

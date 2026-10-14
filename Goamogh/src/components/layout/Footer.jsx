"use client";
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { FileText, ShieldCheck, ChevronRight } from 'lucide-react';

export default function Footer() {
    const { openLegalModal } = useAuth();

    return (
        <footer className="relative w-full bg-black text-white pt-20 pb-8 px-6 md:px-12 border-t border-white/10">
            <div className="max-w-[1920px] mx-auto">
                {/* 5-COLUMN FOOTER GRID */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 mb-16">
                    
                    {/* SHOP */}
                    <div>
                        <h4 className="font-sans font-bold text-[10px] tracking-[0.2em] text-[#d8b66a] mb-6 uppercase">SHOP</h4>
                        <ul className="space-y-3 font-sans text-xs text-white/80">
                            <li><Link href="/shop?category=spices" className="hover:text-[#d8b66a] transition-colors">Spices</Link></li>
                            <li><Link href="/shop?category=whole-spices" className="hover:text-[#d8b66a] transition-colors">Whole Spices</Link></li>
                            <li><Link href="/shop?category=nuts" className="hover:text-[#d8b66a] transition-colors">Nuts</Link></li>
                            <li><Link href="/shop?category=collections" className="hover:text-[#d8b66a] transition-colors">Collections</Link></li>
                        </ul>
                    </div>

                    {/* GO AMOGH */}
                    <div>
                        <h4 className="font-sans font-bold text-[10px] tracking-[0.2em] text-[#d8b66a] mb-6 uppercase">GO AMOGH</h4>
                        <ul className="space-y-3 font-sans text-xs text-white/80">
                            <li><Link href="/about" className="hover:text-[#d8b66a] transition-colors">Our Story</Link></li>
                            <li><Link href="/heritage" className="hover:text-[#d8b66a] transition-colors">Our Origin</Link></li>
                            <li><Link href="/contact" className="hover:text-[#d8b66a] transition-colors">Contact Us</Link></li>
                        </ul>
                    </div>

                    {/* CUSTOMER CARE */}
                    <div>
                        <h4 className="font-sans font-bold text-[10px] tracking-[0.2em] text-[#d8b66a] mb-6 uppercase">CUSTOMER CARE</h4>
                        <ul className="space-y-3 font-sans text-xs text-white/80">
                            <li><Link href="/contact" className="hover:text-[#d8b66a] transition-colors">Shipping & Delivery</Link></li>
                            <li><Link href="/contact" className="hover:text-[#d8b66a] transition-colors">Cancellation & Refunds</Link></li>
                            <li><Link href="/contact" className="hover:text-[#d8b66a] transition-colors">FAQs</Link></li>
                            <li><button onClick={() => openLegalModal('terms')} className="hover:text-[#d8b66a] text-left transition-colors cursor-pointer">Grievance Redressal</button></li>
                        </ul>
                    </div>

                    {/* LEGAL */}
                    <div>
                        <h4 className="font-sans font-bold text-[10px] tracking-[0.2em] text-[#d8b66a] mb-6 uppercase flex items-center gap-1.5">
                            <ShieldCheck size={13} className="text-[#d8b66a]" />
                            <span>LEGAL</span>
                        </h4>
                        <ul className="space-y-3 font-sans text-xs text-white/80">
                            <li>
                                <button onClick={() => openLegalModal('terms')} className="hover:text-[#d8b66a] text-left transition-colors cursor-pointer">
                                    Terms & Conditions
                                </button>
                            </li>
                            <li>
                                <button onClick={() => openLegalModal('privacy')} className="hover:text-[#d8b66a] text-left transition-colors cursor-pointer">
                                    Privacy Policy
                                </button>
                            </li>
                            <li>
                                <button onClick={() => openLegalModal('privacy')} className="hover:text-[#d8b66a] text-left transition-colors cursor-pointer">
                                    Cookie Policy
                                </button>
                            </li>
                        </ul>
                    </div>

                    {/* PAYMENT MODES */}
                    <div>
                        <h4 className="font-sans font-bold text-[10px] tracking-[0.2em] text-[#d8b66a] mb-6 uppercase">PAYMENT MODES</h4>
                        <p className="text-xs text-white/70 font-sans mb-4">We accept 100% secure payments via:</p>
                        <div className="grid grid-cols-2 gap-2.5 max-w-[200px]">
                            <div className="bg-white px-2.5 py-1.5 rounded border border-white/20 shadow-sm hover:scale-105 transition-transform flex items-center justify-center h-8" aria-label="Visa">
                                <img src="/payment/png/visa.png" alt="Visa" className="h-5 w-auto object-contain" loading="lazy" />
                            </div>
                            <div className="bg-white px-2.5 py-1.5 rounded border border-white/20 shadow-sm hover:scale-105 transition-transform flex items-center justify-center h-8" aria-label="Mastercard">
                                <img src="/payment/png/mastercard.png" alt="Mastercard" className="h-5 w-auto object-contain" loading="lazy" />
                            </div>
                            <div className="bg-white px-2.5 py-1.5 rounded border border-white/20 shadow-sm hover:scale-105 transition-transform flex items-center justify-center h-8" aria-label="RuPay">
                                <img src="/payment/png/rupay.png" alt="RuPay" className="h-5 w-auto object-contain" loading="lazy" />
                            </div>
                            <div className="bg-white px-2.5 py-1.5 rounded border border-white/20 shadow-sm hover:scale-105 transition-transform flex items-center justify-center h-8" aria-label="UPI">
                                <img src="/payment/png/upi.png" alt="UPI" className="h-5 w-auto object-contain" loading="lazy" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* BIG FOOTER TEXT */}
                <div className="w-full overflow-hidden border-t border-white/10 pt-8">
                    <img
                        src="/brand/goamogh-golden.png"
                        alt="Goamogh"
                        className="mx-auto h-auto w-[min(80vw,700px)] opacity-95 select-none pointer-events-none"
                    />
                </div>

                {/* BOTTOM UTILS */}
                <div className="flex flex-col md:flex-row justify-between items-center mt-8 text-[10px] text-white/50 font-sans uppercase tracking-widest">
                    <p>© 2026 Go Amogh (OPC) Private Limited. All Rights Reserved.</p>
                    <div className="flex gap-8 mt-4 md:mt-0">
                        <button onClick={() => openLegalModal('privacy')} className="cursor-pointer hover:text-[#d8b66a] transition">Privacy Policy</button>
                        <button onClick={() => openLegalModal('terms')} className="cursor-pointer hover:text-[#d8b66a] transition">Terms & Conditions</button>
                        <span className="cursor-pointer hover:text-white">Sitemap</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

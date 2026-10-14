"use client";
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, FileText, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';

export default function LegalModal() {
    const { legalModal, openLegalModal, closeLegalModal } = useAuth();

    // Close on Escape key & Lock Body Scroll when Modal is Active
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                closeLegalModal();
            }
        };
        if (legalModal) {
            window.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [legalModal, closeLegalModal]);

    if (!legalModal) return null;

    const activeTab = legalModal; // 'terms' | 'privacy'

    return (
        <AnimatePresence>
            <div data-lenis-prevent className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 overflow-hidden">
                {/* Backdrop Blur */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={closeLegalModal}
                    className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
                />

                {/* Modal Container */}
                <motion.div
                    data-lenis-prevent
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="relative w-full max-w-3xl bg-[#0b150d] border border-[#d8b66a]/25 rounded-[32px] shadow-[0_24px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[85vh] z-10 overscroll-contain"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-[#d8b66a]/15 bg-[#1a2416]/70">
                        {/* Tab Switcher */}
                        <div className="flex items-center gap-2 bg-[#0b150d] p-1.5 rounded-full border border-[#d8b66a]/20">
                            <button
                                onClick={() => openLegalModal('terms')}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-serif transition cursor-pointer ${activeTab === 'terms'
                                    ? 'bg-[#d8b66a] text-[#0b150d] font-bold shadow-md'
                                    : 'text-[#d6cca9]/70 hover:text-white'
                                    }`}
                                style={{ fontFamily: "'Cinzel', serif" }}
                            >
                                <FileText size={14} />
                                <span>Terms & Conditions</span>
                            </button>
                            <button
                                onClick={() => openLegalModal('privacy')}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-serif transition cursor-pointer ${activeTab === 'privacy'
                                    ? 'bg-[#d8b66a] text-[#0b150d] font-bold shadow-md'
                                    : 'text-[#d6cca9]/70 hover:text-white'
                                    }`}
                                style={{ fontFamily: "'Cinzel', serif" }}
                            >
                                <ShieldCheck size={14} />
                                <span>Privacy Policy</span>
                            </button>
                        </div>

                        {/* Close Icon */}
                        <button
                            onClick={closeLegalModal}
                            className="text-[#efe3bf]/60 hover:text-[#d8b66a] hover:bg-[#1a2416] p-2 rounded-full transition cursor-pointer"
                            aria-label="Close"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Scrollable Content Body */}
                    <div
                        data-lenis-prevent
                        className="p-6 md:p-8 overflow-y-auto space-y-6 text-sm text-[#d6cca9]/85 font-sans leading-relaxed overscroll-contain scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#1a2416] [&::-webkit-scrollbar-thumb]:bg-[#d8b66a]/40 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#d8b66a]"
                    >
                        {activeTab === 'terms' ? (
                            /* =================================================== */
                            /* TERMS & CONDITIONS CONTENT (PARTS B, C, D, E)       */
                            /* =================================================== */
                            <div className="space-y-6">
                                <div className="border-b border-[#d8b66a]/15 pb-4">
                                    <h2 className="text-2xl font-serif text-white mb-1" style={{ fontFamily: "'Cinzel', serif" }}>
                                        WEBSITE TERMS & POLICIES
                                    </h2>
                                    <p className="text-xs text-[#d8b66a] font-mono">Go Amogh (OPC) Private Limited • Published 2026</p>
                                </div>

                                <div className="p-4 bg-[#1a2416] border border-[#d8b66a]/20 rounded-2xl space-y-1.5 text-xs font-mono">
                                    <p className="text-white font-bold text-sm">Go Amogh (OPC) Private Limited</p>
                                    <p>Registered Office: Door No. 3-11-8, Lakshmi Gayatri Nivas, Kandukuri Vari Street, Ramanagar, Patimedha, Nidadavole, East Godavari District, Andhra Pradesh – 534301</p>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[#d8b66a]">
                                        <span>CIN: U10799AP2025OPC121160</span>
                                        <span>GSTIN: 37AAMCG3553B1ZP</span>
                                        <span>FSSAI: 10126019000124</span>
                                    </div>
                                    <p>Website: <a href="http://www.goamogh.com" target="_blank" rel="noreferrer" className="text-[#d8b66a] underline">www.goamogh.com</a> | Customer Support: <a href="mailto:hello@goamogh.com" className="text-[#d8b66a] underline">hello@goamogh.com</a> / +91-9515951985</p>
                                    <p>Grievance Officer: Aaradhya (<a href="mailto:aaradhya@goamogh.com" className="text-[#d8b66a] underline">aaradhya@goamogh.com</a> / +91-9903943909)</p>
                                </div>

                                <p className="text-xs text-[#d6cca9]/90">
                                    By using the website or placing an order you agree to these Terms, subject to your rights under applicable consumer law that cannot be excluded.
                                </p>

                                <div className="space-y-6 text-xs sm:text-sm">
                                    {/* PART B */}
                                    <div className="space-y-4 pt-2">
                                        <h3 className="text-sm font-mono uppercase tracking-widest text-[#d8b66a] border-b border-[#d8b66a]/20 pb-1">
                                            Part B — Website Terms and Conditions
                                        </h3>

                                        <section className="space-y-1">
                                            <h4 className="font-serif text-[#d8b66a] font-bold">1. Acceptance</h4>
                                            <p>These Terms govern your access to and use of www.goamogh.com and purchases made through it. By using the website or placing an order you agree to these Terms, subject to your rights under applicable consumer law that cannot be excluded.</p>
                                        </section>

                                        <section className="space-y-1">
                                            <h4 className="font-serif text-[#d8b66a] font-bold">2. Company Information</h4>
                                            <p>Go Amogh (OPC) Private Limited, Registered Office at Door No. 3-11-8, Lakshmi Gayatri Nivas, Kandukuri Vari Street, Ramanagar, Patimedha, Nidadavole, East Godavari District, Andhra Pradesh – 534301. CIN: U10799AP2025OPC121160, GSTIN: 37AAMCG3553B1ZP, FSSAI: 10126019000124.</p>
                                        </section>

                                        <section className="space-y-1">
                                            <h4 className="font-serif text-[#d8b66a] font-bold">3. Products</h4>
                                            <p>Go Amogh sells spices and powdered food products as described on the website. We keep product descriptions, photographs, ingredients, net quantity, nutritional and allergen information accurate and consistent with the product label and applicable regulations. We do not make misleading, exaggerated or unsubstantiated claims about health, medicinal effects, disease prevention, nutritional benefits or product performance.</p>
                                        </section>

                                        <section className="space-y-1">
                                            <h4 className="font-serif text-[#d8b66a] font-bold">4. Product Availability</h4>
                                            <p>Products are subject to availability. We may limit quantities, suspend availability or discontinue products where reasonably necessary. If we cannot supply a pre-booked order because stock or materials are unavailable, we will refund the amount paid in accordance with Part C, subject to applicable taxes and law.</p>
                                        </section>

                                        <section className="space-y-1">
                                            <h4 className="font-serif text-[#d8b66a] font-bold">5. Prices and Taxes</h4>
                                            <p>Prices displayed on the website include applicable taxes, or the website shows how taxes and charges are calculated. The final payable amount, including any delivery charges, is shown before you complete your purchase.</p>
                                        </section>

                                        <section className="space-y-1">
                                            <h4 className="font-serif text-[#d8b66a] font-bold">6. Ordering</h4>
                                            <p>An order submitted through the website is an offer to purchase. We verify order and payment information before accepting an order. Acceptance depends on product availability, delivery timelines, and courier partner availability. If we cannot accept your order, we will notify you and refund any amount paid.</p>
                                        </section>

                                        <section className="space-y-1">
                                            <h4 className="font-serif text-[#d8b66a] font-bold">7. Payment</h4>
                                            <p>We accept payment by IMPS, NEFT, and QR/scanner payment directly to the Company’s designated current account. Please use only official payment details displayed on this website. Go Amogh personnel will never ask you for your OTP, PIN, password, CVV or other payment credentials. Your order remains pending until payment is reconciled.</p>
                                        </section>

                                        <section className="space-y-1">
                                            <h4 className="font-serif text-[#d8b66a] font-bold">8. Payment Verification</h4>
                                            <p>We verify payments against our bank records. An order is not treated as paid merely because you submit a screenshot. We may ask you for reasonable evidence needed to reconcile a payment.</p>
                                        </section>

                                        <section className="space-y-1">
                                            <h4 className="font-serif text-[#d8b66a] font-bold">9. Delivery</h4>
                                            <p>Delivery timelines are estimates unless expressly stated otherwise. Delivery may be affected by courier delays, weather, government restrictions, force majeure or circumstances beyond our control. We will inform you of any material delay (see Part D).</p>
                                        </section>

                                        <section className="space-y-1">
                                            <h4 className="font-serif text-[#d8b66a] font-bold">10. Cancellation, Returns and Refunds</h4>
                                            <p>Cancellations, returns and refunds are governed by Part C. Nothing in these Terms excludes any statutory consumer right.</p>
                                        </section>

                                        <section className="space-y-1">
                                            <h4 className="font-serif text-[#d8b66a] font-bold">11. Damaged, Incorrect or Defective Products</h4>
                                            <p>Please report damaged, incorrect or missing products within 48 hours through our customer-support channels as stated in Part C. We will investigate and give an appropriate remedy in accordance with applicable law.</p>
                                        </section>

                                        <section className="space-y-1">
                                            <h4 className="font-serif text-[#d8b66a] font-bold">12. Food Safety</h4>
                                            <p>Please follow storage and usage instructions on packaging. Do not consume a product if its packaging appears materially damaged or tampered with. Report any food-safety or quality concern immediately to aaradhya@goamogh.com.</p>
                                        </section>

                                        <section className="space-y-1">
                                            <h4 className="font-serif text-[#d8b66a] font-bold">13. Website Content</h4>
                                            <p>We try to keep website content accurate. Minor typographical errors may occur. If an order was placed on an incorrectly displayed price, we will offer you the choice to cancel with a full refund.</p>
                                        </section>

                                        <section className="space-y-1">
                                            <h4 className="font-serif text-[#d8b66a] font-bold">14. Intellectual Property</h4>
                                            <p>All logos, brand names, product photographs, graphics, text, designs and software belong to or are lawfully used by Go Amogh and must not be copied or commercially exploited without written permission.</p>
                                        </section>

                                        <section className="space-y-1">
                                            <h4 className="font-serif text-[#d8b66a] font-bold">15. Prohibited Activities</h4>
                                            <p>You must not misuse the website, attempt unauthorised access, introduce malware, submit fraudulent orders, or use the website for any unlawful purpose.</p>
                                        </section>

                                        <section className="space-y-1">
                                            <h4 className="font-serif text-[#d8b66a] font-bold">16. Limitation of Liability</h4>
                                            <p>To the extent permitted by law, Go Amogh is not liable for indirect or consequential loss arising from use of the website or delays beyond our control. Our liability is limited to remedies available under applicable law.</p>
                                        </section>

                                        <section className="space-y-1">
                                            <h4 className="font-serif text-[#d8b66a] font-bold">17. Consumer Rights</h4>
                                            <p>Nothing in these Terms excludes, restricts or limits any right you have under Indian consumer-protection law that cannot lawfully be excluded.</p>
                                        </section>

                                        <section className="space-y-1">
                                            <h4 className="font-serif text-[#d8b66a] font-bold">18. Grievance Redressal</h4>
                                            <p>Grievance Officer: Aaradhya (Email: aaradhya@goamogh.com | Phone: +91-9903943909). Address: Door No. 3-11-8, Lakshmi Gayatri Nivas, Kandukuri Vari Street, Ramanagar, Patimedha, Nidadavole, East Godavari District, Andhra Pradesh – 534301. We acknowledge within 48 hours and resolve within one month.</p>
                                        </section>

                                        <section className="space-y-1">
                                            <h4 className="font-serif text-[#d8b66a] font-bold">19. Governing Law and Jurisdiction</h4>
                                            <p>Governed by laws of India. Consumer complaints may be brought before competent consumer commissions under the Consumer Protection Act, 2019. For other disputes, competent courts in East Godavari District, Andhra Pradesh have jurisdiction.</p>
                                        </section>

                                        <section className="space-y-1">
                                            <h4 className="font-serif text-[#d8b66a] font-bold">20. Amendments</h4>
                                            <p>We may update these Terms when reasonably required. The latest version will be published on the website with its effective date.</p>
                                        </section>
                                    </div>

                                    {/* PART C */}
                                    <div className="space-y-4 pt-4 border-t border-[#d8b66a]/15">
                                        <h3 className="text-sm font-mono uppercase tracking-widest text-[#d8b66a] border-b border-[#d8b66a]/20 pb-1">
                                            Part C — Cancellation, Return and Refund Policy
                                        </h3>

                                        <section className="space-y-1">
                                            <h4 className="font-serif text-[#d8b66a] font-bold">1. Cancellation</h4>
                                            <p>You may cancel an order before dispatch by contacting hello@goamogh.com / +91-9515951985 for a full refund. Once dispatched, an order cannot be cancelled. No cancellation fee is charged.</p>
                                        </section>

                                        <section className="space-y-1">
                                            <h4 className="font-serif text-[#d8b66a] font-bold">2. Eligible Complaints & Returns</h4>
                                            <p>Report wrong, damaged, tampered, missing, or defective products within 48 hours of delivery with photographic/video evidence. For health and food-safety reasons, opened food products without defect cannot be returned.</p>
                                        </section>

                                        <section className="space-y-1">
                                            <h4 className="font-serif text-[#d8b66a] font-bold">3. Refunds</h4>
                                            <p>Approved refunds are processed to original payment source within 5–7 business days of approval. We will never ask for OTP, PIN, password or CVV.</p>
                                        </section>
                                    </div>

                                    {/* PART D & E */}
                                    <div className="space-y-4 pt-4 border-t border-[#d8b66a]/15">
                                        <h3 className="text-sm font-mono uppercase tracking-widest text-[#d8b66a] border-b border-[#d8b66a]/20 pb-1">
                                            Part D & E — Shipping, Delivery & Cookies
                                        </h3>

                                        <section className="space-y-1">
                                            <h4 className="font-serif text-[#d8b66a] font-bold">Shipping & Delivery</h4>
                                            <p>We deliver across India to serviceable PIN codes. Delivery charges are displayed at checkout. Please inspect outer packaging upon delivery and report visible damage immediately.</p>
                                        </section>

                                        <section className="space-y-1">
                                            <h4 className="font-serif text-[#d8b66a] font-bold">Cookies</h4>
                                            <p>We use strictly necessary cookies for website operation/cart persistence, and preference/analytics cookies only with consent. Manage choices via the cookie banner or your browser settings.</p>
                                        </section>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* =================================================== */
                            /* PRIVACY POLICY CONTENT (PART A, SECTIONS 1–18)      */
                            /* =================================================== */
                            <div className="space-y-6">
                                <div className="border-b border-[#d8b66a]/15 pb-4">
                                    <h2 className="text-2xl font-serif text-white mb-1" style={{ fontFamily: "'Cinzel', serif" }}>
                                        PRIVACY POLICY
                                    </h2>
                                    <p className="text-xs text-[#d8b66a] font-mono">
                                        Go Amogh (OPC) Private Limited • DPDP Act 2023 Compliant • Version 1.0
                                    </p>
                                </div>

                                <div className="p-4 bg-[#1a2416] border border-[#d8b66a]/20 rounded-2xl space-y-1.5 text-xs font-mono">
                                    <p className="text-white font-bold text-sm">Data Fiduciary: Go Amogh (OPC) Private Limited</p>
                                    <p>Registered Office: Door No. 3-11-8, Lakshmi Gayatri Nivas, Kandukuri Vari Street, Ramanagar, Patimedha, Nidadavole, East Godavari District, Andhra Pradesh – 534301</p>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[#d8b66a]">
                                        <span>CIN: U10799AP2025OPC121160</span>
                                        <span>GSTIN: 37AAMCG3553B1ZP</span>
                                        <span>FSSAI: 10126019000124</span>
                                    </div>
                                    <p>Grievance Officer: Aaradhya (<a href="mailto:aaradhya@goamogh.com" className="text-[#d8b66a] underline">aaradhya@goamogh.com</a> / +91-9903943909)</p>
                                    <p>Customer Support: <a href="mailto:hello@goamogh.com" className="text-[#d8b66a] underline">hello@goamogh.com</a> / +91-9515951985</p>
                                </div>

                                <div className="space-y-5 text-xs sm:text-sm">
                                    <section className="space-y-1">
                                        <h4 className="font-serif text-[#d8b66a] font-bold">1. Introduction & Compliance</h4>
                                        <p>Go Amogh (OPC) Private Limited processes personal data in accordance with applicable Indian law, including the Digital Personal Data Protection Act, 2023 (DPDP Act) and applicable rules. This policy applies to website visits, orders, payments, customer support, and communications.</p>
                                    </section>

                                    <section className="space-y-1">
                                        <h4 className="font-serif text-[#d8b66a] font-bold">2. Data We Collect</h4>
                                        <ul className="list-disc pl-5 space-y-1 text-[#efe3bf]/85">
                                            <li><strong>Identity & Contact:</strong> Name, mobile number, email, billing and shipping address.</li>
                                            <li><strong>Order Data:</strong> Products purchased, quantities, order numbers, delivery details and customer service records.</li>
                                            <li><strong>Payment Details:</strong> Transaction/UTR number, payment date, amount, payer name/account details for IMPS/NEFT/QR reconciliation. We do not store card details or ask for passwords, PIN, CVV or OTP.</li>
                                            <li><strong>Communications & Technical:</strong> Messages sent via WhatsApp/email/phone, IP address, device/browser details, log data, and cookies.</li>
                                        </ul>
                                    </section>

                                    <section className="space-y-1">
                                        <h4 className="font-serif text-[#d8b66a] font-bold">3. Why We Process Data</h4>
                                        <p>We process personal data to accept and fulfill orders, verify payments, arrange delivery, handle support and refunds, comply with tax/legal obligations, prevent fraud, and send optional promotional updates with your explicit consent.</p>
                                    </section>

                                    <section className="space-y-1">
                                        <h4 className="font-serif text-[#d8b66a] font-bold">4. WhatsApp & Electronic Communications</h4>
                                        <p>Transactional messages (order confirmations, payment verification, delivery updates) are sent to fulfill your order. Promotional messages are sent only with your prior consent. You can opt out anytime by replying STOP or contacting aaradhya@goamogh.com.</p>
                                    </section>

                                    <section className="space-y-1">
                                        <h4 className="font-serif text-[#d8b66a] font-bold">5. Data Sharing</h4>
                                        <p>We share data only on a need-to-know basis with logistics partners, bank/payment service providers, IT/hosting providers, customer support providers, and authorities where required by law. We never sell your personal data.</p>
                                    </section>

                                    <section className="space-y-1">
                                        <h4 className="font-serif text-[#d8b66a] font-bold">6. Security & Retention</h4>
                                        <p>We apply HTTPS encryption, access controls, backups, and security monitoring. Order/refund records are retained for up to 3 years after closure; accounting records are maintained as prescribed by Companies Act and GST laws.</p>
                                    </section>

                                    <section className="space-y-1">
                                        <h4 className="font-serif text-[#d8b66a] font-bold">7. Your Rights under DPDP Act 2023</h4>
                                        <p>You have the right to obtain a summary of your data, correct/update inaccurate data, request erasure (where permitted by law), withdraw consent, and nominate a representative in case of incapacity. To exercise your rights, email aaradhya@goamogh.com.</p>
                                    </section>

                                    <section className="space-y-1">
                                        <h4 className="font-serif text-[#d8b66a] font-bold">8. Grievance Redressal & Escalation</h4>
                                        <div className="p-3 bg-[#1a2416] border border-[#d8b66a]/15 rounded-xl space-y-1 font-mono text-xs">
                                            <p className="font-bold text-white">Grievance Officer: Aaradhya</p>
                                            <p>Email: <a href="mailto:aaradhya@goamogh.com" className="text-[#d8b66a] underline">aaradhya@goamogh.com</a> | Phone: +91-9903943909</p>
                                            <p>We acknowledge within 48 hours and resolve within one month. If unsatisfied, you may appeal to the Data Protection Board of India after exhausting our grievance process.</p>
                                        </div>
                                    </section>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between px-6 md:px-8 py-4 border-t border-[#d8b66a]/15 bg-[#1a2416]/70">
                        <div className="flex items-center gap-2 text-xs text-[#d6cca9]/70 font-mono">
                            <CheckCircle size={14} className="text-[#d8b66a]" />
                            <span>Go Amogh (OPC) Private Limited • Official Legal Documentation</span>
                        </div>

                        <button
                            onClick={closeLegalModal}
                            className="bg-[#d8b66a] hover:bg-[#c5a47e] text-[#0b150d] font-bold px-6 py-2 rounded-xl text-xs font-serif uppercase tracking-widest transition cursor-pointer active:scale-95"
                            style={{ fontFamily: "'Cinzel', serif" }}
                        >
                            Close
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

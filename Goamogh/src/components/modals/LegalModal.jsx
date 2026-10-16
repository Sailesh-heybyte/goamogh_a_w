'use client';
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, FileText, RefreshCw, Truck, Cookie, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function LegalModal() {
    const { legalModal, openLegalModal, closeLegalModal } = useAuth();

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

    let activeTab = legalModal;
    if (activeTab === 'cookie') activeTab = 'cookies';
    if (activeTab === 'cancellation') activeTab = 'refund';

    return (
        <AnimatePresence>
            <div
                data-lenis-prevent
                className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-6 overflow-hidden"
            >
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={closeLegalModal}
                    className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
                />

                <motion.div
                    data-lenis-prevent
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="relative w-full max-w-4xl bg-[#0b150d] border border-[#d8b66a]/25 rounded-[28px] md:rounded-[32px] shadow-[0_24px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh] z-10 overscroll-contain"
                >
                    <div className="flex items-center justify-between px-5 md:px-8 py-4 border-b border-[#d8b66a]/15 bg-[#1a2416]/90 gap-3">
                        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none max-w-[85%]">
                            <button
                                onClick={() => openLegalModal('terms')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono shrink-0 transition cursor-pointer ${
                                    activeTab === 'terms'
                                        ? 'bg-[#d8b66a] text-[#0b150d] font-bold shadow-md'
                                        : 'text-[#d6cca9]/70 hover:text-white hover:bg-[#0b150d]'
                                }`}
                            >
                                <FileText size={13} />
                                <span>Terms</span>
                            </button>
                            <button
                                onClick={() => openLegalModal('privacy')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono shrink-0 transition cursor-pointer ${
                                    activeTab === 'privacy'
                                        ? 'bg-[#d8b66a] text-[#0b150d] font-bold shadow-md'
                                        : 'text-[#d6cca9]/70 hover:text-white hover:bg-[#0b150d]'
                                }`}
                            >
                                <ShieldCheck size={13} />
                                <span>Privacy</span>
                            </button>
                            <button
                                onClick={() => openLegalModal('refund')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono shrink-0 transition cursor-pointer ${
                                    activeTab === 'refund'
                                        ? 'bg-[#d8b66a] text-[#0b150d] font-bold shadow-md'
                                        : 'text-[#d6cca9]/70 hover:text-white hover:bg-[#0b150d]'
                                }`}
                            >
                                <RefreshCw size={13} />
                                <span>Refunds & Returns</span>
                            </button>
                            <button
                                onClick={() => openLegalModal('shipping')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono shrink-0 transition cursor-pointer ${
                                    activeTab === 'shipping'
                                        ? 'bg-[#d8b66a] text-[#0b150d] font-bold shadow-md'
                                        : 'text-[#d6cca9]/70 hover:text-white hover:bg-[#0b150d]'
                                }`}
                            >
                                <Truck size={13} />
                                <span>Shipping</span>
                            </button>
                            <button
                                onClick={() => openLegalModal('cookies')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono shrink-0 transition cursor-pointer ${
                                    activeTab === 'cookies'
                                        ? 'bg-[#d8b66a] text-[#0b150d] font-bold shadow-md'
                                        : 'text-[#d6cca9]/70 hover:text-white hover:bg-[#0b150d]'
                                }`}
                            >
                                <Cookie size={13} />
                                <span>Cookies</span>
                            </button>
                        </div>

                        <button
                            onClick={closeLegalModal}
                            className="text-[#efe3bf]/70 hover:text-[#d8b66a] hover:bg-[#0b150d] p-2 rounded-full transition cursor-pointer shrink-0"
                            aria-label="Close"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="px-6 md:px-8 py-2.5 bg-[#0b150d] border-b border-[#d8b66a]/10 flex flex-wrap items-center justify-between text-[11px] font-mono text-[#d6cca9]/70">
                        <span>Go Amogh (OPC) Private Limited • CIN: U10799AP2025OPC121160</span>
                        <span>Effective Date: 12 October 2026 • v1.0</span>
                    </div>

                    <div
                        data-lenis-prevent
                        className="p-6 md:p-8 overflow-y-auto space-y-6 text-sm text-[#d6cca9]/85 font-sans leading-relaxed overscroll-contain scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#1a2416] [&::-webkit-scrollbar-thumb]:bg-[#d8b66a]/40 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#d8b66a]"
                    >
                        {activeTab === 'terms' && (
                            <div className="space-y-6">
                                <div className="border-b border-[#d8b66a]/15 pb-4">
                                    <h2
                                        className="text-xl md:text-2xl font-serif text-white font-bold"
                                        style={{ fontFamily: "'Cinzel', serif" }}
                                    >
                                        PART B — WEBSITE TERMS AND CONDITIONS
                                    </h2>
                                    <p className="text-xs text-[#d8b66a]/80 font-mono mt-1">
                                        Governing purchases, orders and use of www.goamogh.com
                                    </p>
                                </div>

                                <section className="space-y-2">
                                    <h3 className="text-base font-serif text-[#d8b66a] font-bold">1. Acceptance</h3>
                                    <p>
                                        These Terms govern your access to and use of www.goamogh.com and purchases made
                                        through it. By using the website or placing an order you agree to these Terms,
                                        subject to your rights under applicable consumer law that cannot be excluded.
                                    </p>
                                </section>

                                <section className="space-y-2">
                                    <h3 className="text-base font-serif text-[#d8b66a] font-bold">
                                        2. Company Information
                                    </h3>
                                    <p>
                                        Go Amogh (OPC) Private Limited, Registered Office: Door No. 3-11-8, Lakshmi
                                        Gayatri Nivas, Kandukuri Vari Street, Ramanagar, Patimedha, Nidadavole, East
                                        Godavari District, Andhra Pradesh – 534301. CIN: U10799AP2025OPC121160, GSTIN:
                                        37AAMCG3553B1ZP, FSSAI Licence No.: 10126019000124. Website: www.goamogh.com.
                                        Support: hello@goamogh.com / +91-9515951985. Grievance Officer: Aaradhya,
                                        aaradhya@goamogh.com, +91-9903943909.
                                    </p>
                                </section>

                                <section className="space-y-2">
                                    <h3 className="text-base font-serif text-[#d8b66a] font-bold">3. Products</h3>
                                    <p>
                                        Go Amogh sells spices and powdered food products as described on the website. We
                                        keep product descriptions, photographs, ingredients, net quantity, nutritional
                                        and allergen information accurate and consistent with the product label and
                                        applicable regulations.
                                    </p>
                                    <p>
                                        We do not make misleading, exaggerated or unsubstantiated claims about health,
                                        medicinal effects, disease prevention, nutritional benefits or product
                                        performance.
                                    </p>
                                </section>

                                <section className="space-y-2">
                                    <h3 className="text-base font-serif text-[#d8b66a] font-bold">
                                        4. Product Availability
                                    </h3>
                                    <p>
                                        Products are subject to availability. We may limit quantities, suspend
                                        availability or discontinue products where reasonably necessary. If we cannot
                                        supply a pre-booked order because stock or materials are unavailable, we will
                                        refund the amount paid for that order in accordance with Part C, subject to
                                        applicable taxes and law.
                                    </p>
                                </section>

                                <section className="space-y-2">
                                    <h3 className="text-base font-serif text-[#d8b66a] font-bold">
                                        5. Prices and Taxes
                                    </h3>
                                    <p>
                                        Prices displayed on the website include applicable taxes, or the website shows
                                        how taxes and charges are calculated. The final payable amount, including any
                                        delivery charges, is shown before you complete your purchase.
                                    </p>
                                </section>

                                <section className="space-y-2">
                                    <h3 className="text-base font-serif text-[#d8b66a] font-bold">6. Ordering</h3>
                                    <p>
                                        An order submitted through the website is an offer to purchase. We verify order
                                        and payment information before accepting an order, and we will not tell you that
                                        an order is accepted until it actually is. Acceptance depends on availability of
                                        the product as described, delivery timelines, and the availability of courier
                                        and delivery partners. If we cannot accept your order, we will tell you and
                                        refund any amount you paid.
                                    </p>
                                </section>

                                <section className="space-y-2">
                                    <h3 className="text-base font-serif text-[#d8b66a] font-bold">7. Payment</h3>
                                    <p>
                                        We accept payment by IMPS, NEFT, and QR/scanner payment directly to the
                                        Company’s designated current account.
                                    </p>
                                    <p>
                                        Please use only the payment details officially displayed on this website or
                                        communicated by Go Amogh from its official contact details. Go Amogh and its
                                        personnel will never ask you for your OTP, PIN, password, CVV or other payment
                                        credentials.
                                    </p>
                                    <p>
                                        Your order remains pending until payment is verified and reconciled. Please keep
                                        your transaction/reference number until your order is completed. Refunds are
                                        made as described in Part C.
                                    </p>
                                </section>

                                <section className="space-y-2">
                                    <h3 className="text-base font-serif text-[#d8b66a] font-bold">
                                        8. Payment Verification
                                    </h3>
                                    <p>
                                        We verify payments against our bank records. An order is not treated as paid
                                        merely because you submit a screenshot. We may ask you for reasonable evidence
                                        needed to reconcile a payment.
                                    </p>
                                </section>

                                <section className="space-y-2">
                                    <h3 className="text-base font-serif text-[#d8b66a] font-bold">9. Delivery</h3>
                                    <p>
                                        Delivery timelines on the website are estimates unless expressly stated
                                        otherwise. Delivery may be affected by incorrect customer information,
                                        non-availability of the recipient, courier delays, part-load delays, natural
                                        events, governmental restrictions, force majeure or other circumstances beyond
                                        our reasonable control. We will inform you of any material delay. See Part D for
                                        details.
                                    </p>
                                </section>

                                <section className="space-y-2">
                                    <h3 className="text-base font-serif text-[#d8b66a] font-bold">
                                        10. Cancellation, Returns and Refunds
                                    </h3>
                                    <p>
                                        Cancellations, returns and refunds are governed by Part C. Nothing in these
                                        Terms excludes any statutory consumer right.
                                    </p>
                                </section>

                                <section className="space-y-2">
                                    <h3 className="text-base font-serif text-[#d8b66a] font-bold">
                                        11. Damaged, Incorrect or Defective Products
                                    </h3>
                                    <p>
                                        Please report damaged, incorrect or missing products, tampered packages and
                                        other material fulfilment issues through our customer-support channels within
                                        the time stated in Part C. We will investigate and give an appropriate remedy in
                                        accordance with applicable law.
                                    </p>
                                </section>

                                <section className="space-y-2">
                                    <h3 className="text-base font-serif text-[#d8b66a] font-bold">12. Food Safety</h3>
                                    <p>
                                        Please follow the storage and usage instructions on the product packaging, and
                                        do not consume a product if its packaging appears materially damaged, tampered
                                        with or otherwise unsafe. Report any food-safety, contamination or quality
                                        concern immediately to{' '}
                                        <a href="mailto:aaradhya@goamogh.com" className="text-[#d8b66a] underline">
                                            aaradhya@goamogh.com
                                        </a>
                                        . We handle such complaints promptly and maintain complaint and
                                        product-traceability records.
                                    </p>
                                </section>

                                <section className="space-y-2">
                                    <h3 className="text-base font-serif text-[#d8b66a] font-bold">
                                        13. Website Content
                                    </h3>
                                    <p>
                                        We try to keep website content accurate. Minor typographical, technical or
                                        display errors may occur. We will promptly correct any material error affecting
                                        price, product identity, quantity or other essential purchase information, and
                                        if an order was placed on an incorrectly displayed price we will offer you the
                                        choice to cancel with a full refund.
                                    </p>
                                </section>

                                <section className="space-y-2">
                                    <h3 className="text-base font-serif text-[#d8b66a] font-bold">
                                        14. Intellectual Property
                                    </h3>
                                    <p>
                                        Website content, including logos, brand names, product photographs, graphics,
                                        text, designs, software and layouts, belongs to or is lawfully used by Go Amogh
                                        and must not be copied, reproduced or commercially exploited without our written
                                        permission.
                                    </p>
                                </section>

                                <section className="space-y-2">
                                    <h3 className="text-base font-serif text-[#d8b66a] font-bold">
                                        15. Prohibited Activities
                                    </h3>
                                    <p>
                                        You must not: misuse the website; attempt unauthorised access; introduce
                                        malware; interfere with website security; submit fraudulent orders; impersonate
                                        another person; provide materially false information; misuse promotional offers;
                                        or use the website for any unlawful purpose.
                                    </p>
                                </section>

                                <section className="space-y-2">
                                    <h3 className="text-base font-serif text-[#d8b66a] font-bold">
                                        16. Limitation of Liability
                                    </h3>
                                    <p>
                                        To the extent permitted by law, Go Amogh is not liable for indirect or
                                        consequential loss arising from use of the website, or for delay or failure
                                        caused by events beyond our reasonable control. Our liability for any product is
                                        limited to the remedies available under applicable law, and nothing in these
                                        Terms limits liability that cannot lawfully be limited.
                                    </p>
                                </section>

                                <section className="space-y-2">
                                    <h3 className="text-base font-serif text-[#d8b66a] font-bold">
                                        17. Consumer Rights
                                    </h3>
                                    <p>
                                        Nothing in these Terms excludes, restricts or limits any right you have under
                                        Indian consumer-protection law that cannot lawfully be excluded.
                                    </p>
                                </section>

                                <section className="space-y-2">
                                    <h3 className="text-base font-serif text-[#d8b66a] font-bold">
                                        18. Grievance Redressal
                                    </h3>
                                    <p>
                                        Grievance Officer: Aaradhya, Email: aaradhya@goamogh.com, Phone: +91-9903943909.
                                        Address: Door No. 3-11-8, Lakshmi Gayatri Nivas, Kandukuri Vari Street,
                                        Ramanagar, Patimedha, Nidadavole, East Godavari District, Andhra Pradesh –
                                        534301. We will acknowledge complaints within 48 hours and resolve within one
                                        month.
                                    </p>
                                </section>

                                <section className="space-y-2">
                                    <h3 className="text-base font-serif text-[#d8b66a] font-bold">
                                        19. Governing Law and Jurisdiction
                                    </h3>
                                    <p>
                                        These Terms are governed by the laws of India. For disputes, the competent
                                        courts in East Godavari District, Andhra Pradesh shall have jurisdiction,
                                        subject to any mandatory statutory consumer rights.
                                    </p>
                                </section>

                                <section className="space-y-2">
                                    <h3 className="text-base font-serif text-[#d8b66a] font-bold">20. Amendments</h3>
                                    <p>
                                        We may update these Terms when reasonably required. The latest version will be
                                        published on the website with its effective date.
                                    </p>
                                </section>
                            </div>
                        )}

                        {activeTab === 'privacy' && (
                            <div className="space-y-6">
                                <div className="border-b border-[#d8b66a]/15 pb-4">
                                    <h2
                                        className="text-xl md:text-2xl font-serif text-white font-bold"
                                        style={{ fontFamily: "'Cinzel', serif" }}
                                    >
                                        PART A — PRIVACY POLICY
                                    </h2>
                                    <p className="text-xs text-[#d8b66a]/80 font-mono mt-1">
                                        Digital Personal Data Protection Act, 2023 (DPDPA) Compliant
                                    </p>
                                </div>

                                <section className="space-y-2">
                                    <h3 className="text-base font-serif text-[#d8b66a] font-bold">1. Introduction</h3>
                                    <p>
                                        Go Amogh (OPC) Private Limited respects the privacy of individuals whose
                                        personal data we process in connection with our products, website, orders,
                                        customer support and communications. We process personal data in accordance with
                                        applicable Indian law, including the Digital Personal Data Protection Act, 2023.
                                    </p>
                                </section>

                                <section className="space-y-2">
                                    <h3 className="text-base font-serif text-[#d8b66a] font-bold">2. Data Fiduciary</h3>
                                    <p>
                                        Go Amogh (OPC) Private Limited, Registered Office: Door No. 3-11-8, Lakshmi
                                        Gayatri Nivas, Kandukuri Vari Street, Ramanagar, Patimedha, Nidadavole, East
                                        Godavari District, Andhra Pradesh – 534301. CIN: U10799AP2025OPC121160, GSTIN:
                                        37AAMCG3553B1ZP, FSSAI: 10126019000124. Privacy contact: Aaradhya,
                                        aaradhya@goamogh.com.
                                    </p>
                                </section>

                                <section className="space-y-2">
                                    <h3 className="text-base font-serif text-[#d8b66a] font-bold">
                                        3. Personal Data We Collect
                                    </h3>
                                    <p>
                                        We process: Identity and contact info (name, mobile, email, addresses); Order
                                        information (products, order number, delivery status, customer support records);
                                        Payment-related information (UTR reference number, payment date, payer name; no
                                        card numbers stored; we never ask for passwords, OTPs or PINs); Communications
                                        (WhatsApp, SMS, email, calls); and Technical information (IP address, browser,
                                        device, cookies).
                                    </p>
                                </section>

                                <section className="space-y-2">
                                    <h3 className="text-base font-serif text-[#d8b66a] font-bold">
                                        4. Why We Process Personal Data
                                    </h3>
                                    <p>
                                        To accept, verify, dispatch and deliver orders; provide customer support;
                                        process cancellations and refunds; maintain tax and accounting records; prevent
                                        fraud and ensure cybersecurity; and send promotional communications only with
                                        your explicit opt-in consent.
                                    </p>
                                </section>

                                <section className="space-y-2">
                                    <h3 className="text-base font-serif text-[#d8b66a] font-bold">
                                        5. Transactional & Promotional Communications
                                    </h3>
                                    <p>
                                        Transactional communications (order confirmations, delivery updates, OTPs) are
                                        operational. Promotional messages are sent only with your consent, and you may
                                        opt out anytime by replying STOP or emailing aaradhya@goamogh.com.
                                    </p>
                                </section>

                                <section className="space-y-2">
                                    <h3 className="text-base font-serif text-[#d8b66a] font-bold">
                                        6. Sharing & Security
                                    </h3>
                                    <p>
                                        We share data only with verified courier, IT hosting, payment/banking, and
                                        communications partners under confidentiality contracts. We never sell your
                                        personal data. We implement SSL/HTTPS encryption, role-based access, and regular
                                        security audits.
                                    </p>
                                </section>

                                <section className="space-y-2">
                                    <h3 className="text-base font-serif text-[#d8b66a] font-bold">
                                        7. Data Retention & Your Rights
                                    </h3>
                                    <p>
                                        We retain data only as long as necessary for order fulfilment, statutory
                                        legal/tax periods (up to 3 years for claims, and Companies Act/GST periods).
                                        Under DPDPA 2023, you have rights to access summary, correct, erase, withdraw
                                        consent, and file grievances. To exercise rights, contact aaradhya@goamogh.com.
                                    </p>
                                </section>

                                <section className="space-y-2">
                                    <h3 className="text-base font-serif text-[#d8b66a] font-bold">
                                        8. Grievance Officer
                                    </h3>
                                    <p>
                                        Grievance Officer: Aaradhya, Email: aaradhya@goamogh.com, Phone: +91-9903943909.
                                        Acknowledgement within 48 hours; resolution within one month.
                                    </p>
                                </section>
                            </div>
                        )}

                        {activeTab === 'refund' && (
                            <div className="space-y-6">
                                <div className="border-b border-[#d8b66a]/15 pb-4">
                                    <h2
                                        className="text-xl md:text-2xl font-serif text-white font-bold"
                                        style={{ fontFamily: "'Cinzel', serif" }}
                                    >
                                        PART C — CANCELLATION, RETURN AND REFUND POLICY
                                    </h2>
                                    <p className="text-xs text-[#d8b66a]/80 font-mono mt-1">
                                        Food safety, hygiene protocols and statutory consumer rights
                                    </p>
                                </div>

                                <section className="space-y-2">
                                    <h3 className="text-base font-serif text-[#d8b66a] font-bold">
                                        1. Order Cancellation
                                    </h3>
                                    <p>
                                        You may request cancellation by contacting hello@goamogh.com or +91-9515951985
                                        with your order number. An order can be cancelled for a full refund before it is
                                        dispatched. Once dispatched, it cannot be cancelled or modified. If we cannot
                                        dispatch within the estimated timeline or cancel due to inventory, you receive a
                                        full refund. We do not charge any cancellation fee.
                                    </p>
                                </section>

                                <section className="space-y-2">
                                    <h3 className="text-base font-serif text-[#d8b66a] font-bold">
                                        2. Eligible Complaints (48 Hours)
                                    </h3>
                                    <p>
                                        Please report wrong, damaged, tampered, missing, or defective products within{' '}
                                        <strong>48 hours of delivery</strong>. Please provide photographic/video
                                        evidence of packaging, order number, batch/lot number, and expiry date.
                                    </p>
                                </section>

                                <section className="space-y-2">
                                    <h3 className="text-base font-serif text-[#d8b66a] font-bold">
                                        3. Returns & Replacements
                                    </h3>
                                    <p>
                                        For health, safety and hygiene reasons, opened or used food products cannot
                                        ordinarily be returned. If your complaint is upheld for defective, damaged,
                                        wrong or tampered items, we will offer your choice of a replacement or full
                                        refund.
                                    </p>
                                </section>

                                <section className="space-y-2">
                                    <h3 className="text-base font-serif text-[#d8b66a] font-bold">
                                        4. Refund Processing (5–7 Business Days)
                                    </h3>
                                    <p>
                                        Approved refunds are processed to your original payment source or designated
                                        verified bank account within <strong>5–7 business days</strong>. We never ask
                                        for your PIN, OTP, password or CVV.
                                    </p>
                                </section>

                                <section className="space-y-2">
                                    <h3 className="text-base font-serif text-[#d8b66a] font-bold">
                                        5. Food Safety Escalations
                                    </h3>
                                    <p>
                                        Any food safety or contamination concern is escalated immediately to
                                        aaradhya@goamogh.com and logged in our traceability records.
                                    </p>
                                </section>
                            </div>
                        )}

                        {activeTab === 'shipping' && (
                            <div className="space-y-6">
                                <div className="border-b border-[#d8b66a]/15 pb-4">
                                    <h2
                                        className="text-xl md:text-2xl font-serif text-white font-bold"
                                        style={{ fontFamily: "'Cinzel', serif" }}
                                    >
                                        PART D — SHIPPING AND DELIVERY POLICY
                                    </h2>
                                    <p className="text-xs text-[#d8b66a]/80 font-mono mt-1">
                                        Logistics coverage, delivery timelines and inspection
                                    </p>
                                </div>

                                <section className="space-y-2">
                                    <h3 className="text-base font-serif text-[#d8b66a] font-bold">
                                        1. Delivery Area & Charges
                                    </h3>
                                    <p>
                                        We deliver across India to PIN codes serviced by our logistics partners. Any
                                        delivery charges are displayed transparently before order confirmation and
                                        included in the final payable amount.
                                    </p>
                                </section>

                                <section className="space-y-2">
                                    <h3 className="text-base font-serif text-[#d8b66a] font-bold">
                                        2. Timelines & Delays
                                    </h3>
                                    <p>
                                        Expected delivery timelines shown on checkout are estimates. If material delays
                                        occur due to weather, transport or operational constraints, we will proactively
                                        notify you.
                                    </p>
                                </section>

                                <section className="space-y-2">
                                    <h3 className="text-base font-serif text-[#d8b66a] font-bold">
                                        3. Inspection on Delivery
                                    </h3>
                                    <p>
                                        Please inspect the outer packaging at delivery. If visibly damaged or tampered
                                        with, please alert the courier agent, capture photos/video, and notify
                                        hello@goamogh.com / +91-9515951985 within 48 hours.
                                    </p>
                                </section>
                            </div>
                        )}

                        {activeTab === 'cookies' && (
                            <div className="space-y-6">
                                <div className="border-b border-[#d8b66a]/15 pb-4">
                                    <h2
                                        className="text-xl md:text-2xl font-serif text-white font-bold"
                                        style={{ fontFamily: "'Cinzel', serif" }}
                                    >
                                        PART E — COOKIE POLICY
                                    </h2>
                                    <p className="text-xs text-[#d8b66a]/80 font-mono mt-1">
                                        Website cookies and browser storage preferences
                                    </p>
                                </div>

                                <section className="space-y-2">
                                    <h3 className="text-base font-serif text-[#d8b66a] font-bold">
                                        1. What Are Cookies
                                    </h3>
                                    <p>
                                        Cookies are small text files stored on your device when you visit
                                        www.goamogh.com to keep your cart active, remember preferences, and ensure
                                        secure shopping.
                                    </p>
                                </section>

                                <section className="space-y-2">
                                    <h3 className="text-base font-serif text-[#d8b66a] font-bold">
                                        2. Types of Cookies Used
                                    </h3>
                                    <ul className="list-disc pl-5 space-y-1 text-sm text-[#d6cca9]/85">
                                        <li>
                                            <strong>Strictly Necessary:</strong> Cart persistence, authentication,
                                            anti-fraud security (no consent required).
                                        </li>
                                        <li>
                                            <strong>Preference:</strong> Remembering language and display preferences.
                                        </li>
                                        <li>
                                            <strong>Analytics & Marketing:</strong> Used only with your prior consent.
                                        </li>
                                    </ul>
                                </section>

                                <section className="space-y-2">
                                    <h3 className="text-base font-serif text-[#d8b66a] font-bold">
                                        3. Cookie Management & Contact
                                    </h3>
                                    <p>
                                        You may adjust non-essential cookies via our cookie settings or browser
                                        controls. For queries: aaradhya@goamogh.com.
                                    </p>
                                </section>
                            </div>
                        )}
                    </div>

                    <div className="px-6 md:px-8 py-3.5 bg-[#1a2416]/90 border-t border-[#d8b66a]/15 flex items-center justify-between text-xs font-mono text-[#d6cca9]/70">
                        <div className="flex items-center gap-2">
                            <CheckCircle size={14} className="text-[#d8b66a]" />
                            <span>Go Amogh Legal Documentation</span>
                        </div>
                        <button
                            onClick={closeLegalModal}
                            className="text-[#d8b66a] hover:text-white underline cursor-pointer"
                        >
                            Close
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

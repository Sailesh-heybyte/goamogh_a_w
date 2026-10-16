'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, CheckCircle, ArrowLeft, Building, Truck, RefreshCw, Cookie } from 'lucide-react';
import Link from 'next/link';

export default function TermsPage() {
    const [selectedSection, setSelectedSection] = useState('all');

    return (
        <main className="min-h-screen bg-[#1a2416] text-[#efe3bf] pt-32 pb-24 px-4 md:px-8 selection:bg-[#d8b66a] selection:text-[#0b150d]">
            <div className="max-w-4xl mx-auto space-y-10">
                <div className="flex items-center justify-between">
                    <Link
                        href="/shop"
                        className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-[#d8b66a] hover:text-[#efe3bf] transition duration-200 cursor-pointer"
                    >
                        <ArrowLeft size={16} />
                        <span>Back to Shop</span>
                    </Link>
                    <Link
                        href="/privacy"
                        className="inline-flex items-center gap-1.5 text-xs text-[#d8b66a]/80 hover:text-[#efe3bf] transition font-mono underline"
                    >
                        <span>View Privacy Policy</span>
                    </Link>
                </div>

                <div className="space-y-4 border-b border-[#d8b66a]/15 pb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0b150d] border border-[#d8b66a]/20 text-[#d8b66a] text-xs uppercase tracking-widest font-mono">
                        <FileText size={14} />
                        <span>Official Website Policies</span>
                    </div>
                    <h1
                        className="text-3xl md:text-5xl font-serif text-white tracking-wide"
                        style={{ fontFamily: "'Cinzel', serif" }}
                    >
                        TERMS & POLICIES
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#d8b66a]/80 font-mono">
                        <span>Effective Date: 12 October 2026</span>
                        <span>•</span>
                        <span>Version 1.0</span>
                        <span>•</span>
                        <span>Parts B, C, D & E</span>
                    </div>
                </div>

                <div className="bg-[#0b150d] border border-[#d8b66a]/30 rounded-2xl p-6 md:p-8 space-y-4 shadow-xl">
                    <div className="flex items-center gap-2.5 text-[#d8b66a]">
                        <Building size={18} />
                        <h2 className="text-sm md:text-base font-bold uppercase tracking-wider font-mono">
                            Company Identification
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono text-[#d6cca9]/90 border-t border-[#d8b66a]/15 pt-4">
                        <div>
                            <span className="text-white/60 block uppercase text-[10px] tracking-wider">Company</span>
                            <strong className="text-white text-sm">Go Amogh (OPC) Private Limited</strong>
                        </div>
                        <div>
                            <span className="text-white/60 block uppercase text-[10px] tracking-wider">Website</span>
                            <span className="text-[#d8b66a]">www.goamogh.com</span>
                        </div>
                        <div>
                            <span className="text-white/60 block uppercase text-[10px] tracking-wider">
                                Corporate Identity Number (CIN)
                            </span>
                            <span className="text-white">U10799AP2025OPC121160</span>
                        </div>
                        <div>
                            <span className="text-white/60 block uppercase text-[10px] tracking-wider">GSTIN</span>
                            <span className="text-white">37AAMCG3553B1ZP</span>
                        </div>
                        <div>
                            <span className="text-white/60 block uppercase text-[10px] tracking-wider">
                                FSSAI Licence / Registration No.
                            </span>
                            <span className="text-white">10126019000124</span>
                        </div>
                        <div>
                            <span className="text-white/60 block uppercase text-[10px] tracking-wider">
                                Customer Support
                            </span>
                            <span className="text-white">hello@goamogh.com • +91-9515951985</span>
                        </div>
                        <div className="md:col-span-2">
                            <span className="text-white/60 block uppercase text-[10px] tracking-wider">
                                Registered Office
                            </span>
                            <span className="text-white">
                                Door No. 3-11-8, Lakshmi Gayatri Nivas, Kandukuri Vari Street, Ramanagar, Patimedha,
                                Nidadavole, East Godavari District, Andhra Pradesh – 534301
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#0b150d] rounded-2xl border border-[#d8b66a]/20">
                    <button
                        onClick={() => setSelectedSection('all')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition cursor-pointer ${
                            selectedSection === 'all'
                                ? 'bg-[#d8b66a] text-[#0b150d] font-bold shadow-md'
                                : 'text-[#d6cca9]/70 hover:text-white hover:bg-[#1a2416]'
                        }`}
                    >
                        View All
                    </button>
                    <button
                        onClick={() => setSelectedSection('terms')}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono transition cursor-pointer ${
                            selectedSection === 'terms'
                                ? 'bg-[#d8b66a] text-[#0b150d] font-bold shadow-md'
                                : 'text-[#d6cca9]/70 hover:text-white hover:bg-[#1a2416]'
                        }`}
                    >
                        <FileText size={13} />
                        <span>Part B: Terms</span>
                    </button>
                    <button
                        onClick={() => setSelectedSection('refund')}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono transition cursor-pointer ${
                            selectedSection === 'refund'
                                ? 'bg-[#d8b66a] text-[#0b150d] font-bold shadow-md'
                                : 'text-[#d6cca9]/70 hover:text-white hover:bg-[#1a2416]'
                        }`}
                    >
                        <RefreshCw size={13} />
                        <span>Part C: Cancellation & Refunds</span>
                    </button>
                    <button
                        onClick={() => setSelectedSection('shipping')}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono transition cursor-pointer ${
                            selectedSection === 'shipping'
                                ? 'bg-[#d8b66a] text-[#0b150d] font-bold shadow-md'
                                : 'text-[#d6cca9]/70 hover:text-white hover:bg-[#1a2416]'
                        }`}
                    >
                        <Truck size={13} />
                        <span>Part D: Shipping & Delivery</span>
                    </button>
                    <button
                        onClick={() => setSelectedSection('cookie')}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono transition cursor-pointer ${
                            selectedSection === 'cookie'
                                ? 'bg-[#d8b66a] text-[#0b150d] font-bold shadow-md'
                                : 'text-[#d6cca9]/70 hover:text-white hover:bg-[#1a2416]'
                        }`}
                    >
                        <Cookie size={13} />
                        <span>Part E: Cookies</span>
                    </button>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-[#0b150d] border border-[#d8b66a]/20 rounded-[32px] p-8 md:p-12 shadow-2xl space-y-12 font-sans text-sm md:text-base leading-relaxed text-[#d6cca9]/90"
                >
                    {(selectedSection === 'all' || selectedSection === 'terms') && (
                        <div className="space-y-8 border-b border-[#d8b66a]/15 pb-12">
                            <div className="border-b border-[#d8b66a]/20 pb-4">
                                <span className="text-xs uppercase font-mono tracking-widest text-[#d8b66a]">
                                    Part B
                                </span>
                                <h2
                                    className="text-2xl md:text-3xl font-serif text-white font-bold"
                                    style={{ fontFamily: "'Cinzel', serif" }}
                                >
                                    Website Terms and Conditions
                                </h2>
                            </div>

                            <section className="space-y-2">
                                <h3
                                    className="text-lg font-serif text-[#d8b66a] font-bold"
                                    style={{ fontFamily: "'Cinzel', serif" }}
                                >
                                    1. Acceptance
                                </h3>
                                <p>
                                    These Terms govern your access to and use of www.goamogh.com and purchases made
                                    through it. By using the website or placing an order you agree to these Terms,
                                    subject to your rights under applicable consumer law that cannot be excluded.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h3
                                    className="text-lg font-serif text-[#d8b66a] font-bold"
                                    style={{ fontFamily: "'Cinzel', serif" }}
                                >
                                    2. Company Information
                                </h3>
                                <p>
                                    Go Amogh (OPC) Private Limited, having its Registered Office at Door No. 3-11-8,
                                    Lakshmi Gayatri Nivas, Kandukuri Vari Street, Ramanagar, Patimedha, Nidadavole, East
                                    Godavari District, Andhra Pradesh – 534301. CIN: U10799AP2025OPC121160, GSTIN:
                                    37AAMCG3553B1ZP, FSSAI Licence No.: 10126019000124. Website: www.goamogh.com.
                                    Customer Support: hello@goamogh.com / +91-9515951985. Grievance Officer: Aaradhya,
                                    aaradhya@goamogh.com, +91-9903943909.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h3
                                    className="text-lg font-serif text-[#d8b66a] font-bold"
                                    style={{ fontFamily: "'Cinzel', serif" }}
                                >
                                    3. Products
                                </h3>
                                <p>
                                    Go Amogh sells spices and powdered food products as described on the website. We
                                    keep product descriptions, photographs, ingredients, net quantity, nutritional and
                                    allergen information accurate and consistent with the product label and applicable
                                    regulations.
                                </p>
                                <p>
                                    We do not make misleading, exaggerated or unsubstantiated claims about health,
                                    medicinal effects, disease prevention, nutritional benefits or product performance.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h3
                                    className="text-lg font-serif text-[#d8b66a] font-bold"
                                    style={{ fontFamily: "'Cinzel', serif" }}
                                >
                                    4. Product Availability
                                </h3>
                                <p>
                                    Products are subject to availability. We may limit quantities, suspend availability
                                    or discontinue products where reasonably necessary. If we cannot supply a pre-booked
                                    order because stock or materials are unavailable, we will refund the amount paid for
                                    that order in accordance with Part C, subject to applicable taxes and law.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h3
                                    className="text-lg font-serif text-[#d8b66a] font-bold"
                                    style={{ fontFamily: "'Cinzel', serif" }}
                                >
                                    5. Prices and Taxes
                                </h3>
                                <p>
                                    Prices displayed on the website include applicable taxes, or the website shows how
                                    taxes and charges are calculated. The final payable amount, including any delivery
                                    charges, is shown before you complete your purchase.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h3
                                    className="text-lg font-serif text-[#d8b66a] font-bold"
                                    style={{ fontFamily: "'Cinzel', serif" }}
                                >
                                    6. Ordering
                                </h3>
                                <p>
                                    An order submitted through the website is an offer to purchase. We verify order and
                                    payment information before accepting an order, and we will not tell you that an
                                    order is accepted until it actually is. Acceptance depends on availability of the
                                    product as described, delivery timelines, and the availability of courier and
                                    delivery partners. If we cannot accept your order, we will tell you and refund any
                                    amount you paid.
                                </p>
                            </section>

                            <section className="space-y-3">
                                <h3
                                    className="text-lg font-serif text-[#d8b66a] font-bold"
                                    style={{ fontFamily: "'Cinzel', serif" }}
                                >
                                    7. Payment
                                </h3>
                                <p>We accept payment by:</p>
                                <ul className="list-disc pl-5 space-y-1 text-sm text-[#d6cca9]/85">
                                    <li>IMPS;</li>
                                    <li>NEFT; and</li>
                                    <li>QR/scanner payment directly to the Company’s designated current account.</li>
                                </ul>
                                <p>
                                    Please use only the payment details officially displayed on this website or
                                    communicated by Go Amogh from its official contact details. Go Amogh and its
                                    personnel will never ask you for your OTP, PIN, password, CVV or other payment
                                    credentials.
                                </p>
                                <p>
                                    Your order remains pending until payment is verified and reconciled. Please keep
                                    your transaction/reference number until your order is completed. Refunds are made as
                                    described in Part C.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h3
                                    className="text-lg font-serif text-[#d8b66a] font-bold"
                                    style={{ fontFamily: "'Cinzel', serif" }}
                                >
                                    8. Payment Verification
                                </h3>
                                <p>
                                    We verify payments against our bank records. An order is not treated as paid merely
                                    because you submit a screenshot. We may ask you for reasonable evidence needed to
                                    reconcile a payment.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h3
                                    className="text-lg font-serif text-[#d8b66a] font-bold"
                                    style={{ fontFamily: "'Cinzel', serif" }}
                                >
                                    9. Delivery
                                </h3>
                                <p>
                                    Delivery timelines on the website are estimates unless expressly stated otherwise.
                                    Delivery may be affected by incorrect customer information, non-availability of the
                                    recipient, courier delays, part-load delays, natural events, governmental
                                    restrictions, force majeure or other circumstances beyond our reasonable control. We
                                    will inform you of any material delay. See Part D for details.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h3
                                    className="text-lg font-serif text-[#d8b66a] font-bold"
                                    style={{ fontFamily: "'Cinzel', serif" }}
                                >
                                    10. Cancellation, Returns and Refunds
                                </h3>
                                <p>
                                    Cancellations, returns and refunds are governed by Part C. Nothing in these Terms
                                    excludes any statutory consumer right.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h3
                                    className="text-lg font-serif text-[#d8b66a] font-bold"
                                    style={{ fontFamily: "'Cinzel', serif" }}
                                >
                                    11. Damaged, Incorrect or Defective Products
                                </h3>
                                <p>
                                    Please report damaged, incorrect or missing products, tampered packages and other
                                    material fulfilment issues through our customer-support channels within the time
                                    stated in Part C. We will investigate and give an appropriate remedy in accordance
                                    with applicable law.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h3
                                    className="text-lg font-serif text-[#d8b66a] font-bold"
                                    style={{ fontFamily: "'Cinzel', serif" }}
                                >
                                    12. Food Safety
                                </h3>
                                <p>
                                    Please follow the storage and usage instructions on the product packaging, and do
                                    not consume a product if its packaging appears materially damaged, tampered with or
                                    otherwise unsafe. Report any food-safety, contamination or quality concern
                                    immediately to{' '}
                                    <a href="mailto:aaradhya@goamogh.com" className="text-[#d8b66a] underline">
                                        aaradhya@goamogh.com
                                    </a>
                                    . We handle such complaints promptly and maintain complaint and product-traceability
                                    records.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h3
                                    className="text-lg font-serif text-[#d8b66a] font-bold"
                                    style={{ fontFamily: "'Cinzel', serif" }}
                                >
                                    13. Website Content
                                </h3>
                                <p>
                                    We try to keep website content accurate. Minor typographical, technical or display
                                    errors may occur. We will promptly correct any material error affecting price,
                                    product identity, quantity or other essential purchase information, and if an order
                                    was placed on an incorrectly displayed price we will offer you the choice to cancel
                                    with a full refund.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h3
                                    className="text-lg font-serif text-[#d8b66a] font-bold"
                                    style={{ fontFamily: "'Cinzel', serif" }}
                                >
                                    14. Intellectual Property
                                </h3>
                                <p>
                                    Website content, including logos, brand names, product photographs, graphics, text,
                                    designs, software and layouts, belongs to or is lawfully used by Go Amogh and must
                                    not be copied, reproduced or commercially exploited without our written permission.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h3
                                    className="text-lg font-serif text-[#d8b66a] font-bold"
                                    style={{ fontFamily: "'Cinzel', serif" }}
                                >
                                    15. Prohibited Activities
                                </h3>
                                <p>
                                    You must not: misuse the website; attempt unauthorised access; introduce malware;
                                    interfere with website security; submit fraudulent orders; impersonate another
                                    person; provide materially false information; misuse promotional offers; or use the
                                    website for any unlawful purpose.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h3
                                    className="text-lg font-serif text-[#d8b66a] font-bold"
                                    style={{ fontFamily: "'Cinzel', serif" }}
                                >
                                    16. Limitation of Liability
                                </h3>
                                <p>
                                    To the extent permitted by law, Go Amogh is not liable for indirect or consequential
                                    loss arising from use of the website, or for delay or failure caused by events
                                    beyond our reasonable control. Our liability for any product is limited to the
                                    remedies available under applicable law, and nothing in these Terms limits liability
                                    that cannot lawfully be limited.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h3
                                    className="text-lg font-serif text-[#d8b66a] font-bold"
                                    style={{ fontFamily: "'Cinzel', serif" }}
                                >
                                    17. Consumer Rights
                                </h3>
                                <p>
                                    Nothing in these Terms excludes, restricts or limits any right you have under Indian
                                    consumer-protection law that cannot lawfully be excluded.
                                </p>
                            </section>

                            <section className="space-y-3">
                                <h3
                                    className="text-lg font-serif text-[#d8b66a] font-bold"
                                    style={{ fontFamily: "'Cinzel', serif" }}
                                >
                                    18. Grievance Redressal
                                </h3>
                                <div className="p-5 bg-[#1a2416] border border-[#d8b66a]/20 rounded-xl space-y-1.5 text-xs font-mono text-[#d6cca9]">
                                    <p className="font-bold text-white text-sm">Grievance Officer: Aaradhya</p>
                                    <p>
                                        Email:{' '}
                                        <a href="mailto:aaradhya@goamogh.com" className="text-[#d8b66a] underline">
                                            aaradhya@goamogh.com
                                        </a>
                                    </p>
                                    <p>
                                        Phone:{' '}
                                        <a href="tel:+919903943909" className="text-white hover:text-[#d8b66a]">
                                            +91-9903943909
                                        </a>
                                    </p>
                                    <p>
                                        Address: Door No. 3-11-8, Lakshmi Gayatri Nivas, Kandukuri Vari Street,
                                        Ramanagar, Patimedha, Nidadavole, East Godavari District, Andhra Pradesh –
                                        534301 (registered office)
                                    </p>
                                </div>
                                <p className="text-xs text-[#d6cca9]/70 italic">
                                    We will acknowledge your complaint within 48 hours of receipt and will endeavour to
                                    resolve it within one month of receipt.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h3
                                    className="text-lg font-serif text-[#d8b66a] font-bold"
                                    style={{ fontFamily: "'Cinzel', serif" }}
                                >
                                    19. Governing Law and Jurisdiction
                                </h3>
                                <p>
                                    These Terms are governed by the laws of India. Consumers may bring complaints before
                                    the consumer commission having jurisdiction under the Consumer Protection Act, 2019.
                                    For any other dispute, the competent courts in East Godavari District, Andhra
                                    Pradesh shall have jurisdiction, subject to any mandatory jurisdictional rule of
                                    law.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h3
                                    className="text-lg font-serif text-[#d8b66a] font-bold"
                                    style={{ fontFamily: "'Cinzel', serif" }}
                                >
                                    20. Amendments
                                </h3>
                                <p>
                                    We may update these Terms when reasonably required. The latest version will be
                                    published on the website with its effective date, and will apply to orders placed
                                    after that date.
                                </p>
                            </section>
                        </div>
                    )}

                    {(selectedSection === 'all' || selectedSection === 'refund') && (
                        <div className="space-y-8 border-b border-[#d8b66a]/15 pb-12">
                            <div className="border-b border-[#d8b66a]/20 pb-4">
                                <span className="text-xs uppercase font-mono tracking-widest text-[#d8b66a]">
                                    Part C
                                </span>
                                <h2
                                    className="text-2xl md:text-3xl font-serif text-white font-bold"
                                    style={{ fontFamily: "'Cinzel', serif" }}
                                >
                                    Cancellation, Return and Refund Policy
                                </h2>
                            </div>

                            <section className="space-y-2">
                                <h3
                                    className="text-lg font-serif text-[#d8b66a] font-bold"
                                    style={{ fontFamily: "'Cinzel', serif" }}
                                >
                                    1. General
                                </h3>
                                <p>
                                    Go Amogh aims to deliver safe, genuine and properly packaged food products. Because
                                    food products involve hygiene and food-safety considerations, returns are handled
                                    according to the condition of the product and applicable law. Nothing in this Policy
                                    removes any mandatory consumer right.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h3
                                    className="text-lg font-serif text-[#d8b66a] font-bold"
                                    style={{ fontFamily: "'Cinzel', serif" }}
                                >
                                    2. Cancellation
                                </h3>
                                <p>
                                    You may request cancellation by contacting{' '}
                                    <a href="mailto:hello@goamogh.com" className="text-[#d8b66a] underline">
                                        hello@goamogh.com
                                    </a>{' '}
                                    /{' '}
                                    <a href="tel:+919515951985" className="text-white hover:text-[#d8b66a]">
                                        +91-9515951985
                                    </a>{' '}
                                    with your order number.
                                </p>
                                <ul className="list-disc pl-5 space-y-1 text-sm text-[#d6cca9]/85">
                                    <li>
                                        An order can be cancelled for a full refund before it is dispatched. Once an
                                        order has been dispatched, it cannot be cancelled, modified or replaced, except
                                        as stated in this Policy or where the law gives you the right.
                                    </li>
                                    <li>
                                        If we do not dispatch or deliver your order within the timeline shown at
                                        checkout, you may cancel it and receive a full refund, or accept a replacement
                                        subject to availability of the same items, or other items matching the order
                                        value, at your choice.
                                    </li>
                                    <li>
                                        If we cancel your order (for example because stock is unavailable), you will
                                        receive a full refund.
                                    </li>
                                    <li>
                                        <strong>We do not charge any cancellation fee.</strong>
                                    </li>
                                </ul>
                            </section>

                            <section className="space-y-2">
                                <h3
                                    className="text-lg font-serif text-[#d8b66a] font-bold"
                                    style={{ fontFamily: "'Cinzel', serif" }}
                                >
                                    3. Eligible Complaints
                                </h3>
                                <p>
                                    Please contact us if you receive a wrong product, a materially damaged product, a
                                    materially tampered package, a missing item, a materially defective product, or if
                                    there is another genuine fulfilment or product-quality issue. Please report the
                                    issue within <strong>48 hours of delivery</strong>, with the evidence described
                                    below, so that we can investigate while the facts are fresh. We will still consider
                                    a later report where the law requires.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h3
                                    className="text-lg font-serif text-[#d8b66a] font-bold"
                                    style={{ fontFamily: "'Cinzel', serif" }}
                                >
                                    4. Evidence
                                </h3>
                                <p>
                                    Where reasonably necessary we may ask for photographs or videos of the product and
                                    outer packaging, the order number, batch/lot number, expiry/best-before date,
                                    delivery details, and other information needed to investigate. We use this
                                    information only to resolve your complaint.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h3
                                    className="text-lg font-serif text-[#d8b66a] font-bold"
                                    style={{ fontFamily: "'Cinzel', serif" }}
                                >
                                    5. Food Safety Complaints
                                </h3>
                                <p>
                                    Food-safety complaints are escalated immediately to our designated food-safety
                                    contact (
                                    <a href="mailto:aaradhya@goamogh.com" className="text-[#d8b66a] underline">
                                        aaradhya@goamogh.com
                                    </a>
                                    ). We record the complaint date, product, batch/lot, customer details, nature of the
                                    complaint, investigation, corrective action, resolution and traceability
                                    information, and follow our recall/escalation procedure where necessary.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h3
                                    className="text-lg font-serif text-[#d8b66a] font-bold"
                                    style={{ fontFamily: "'Cinzel', serif" }}
                                >
                                    6. Returns and Replacements
                                </h3>
                                <p>
                                    For health, safety and hygiene reasons, we cannot ordinarily accept opened or used
                                    food products back into saleable inventory. Please keep the product, packaging and
                                    batch details until your complaint is resolved.
                                </p>
                                <p>Subject to your statutory rights, ordinary returns are not accepted where:</p>
                                <ul className="list-disc pl-5 space-y-1 text-sm text-[#d6cca9]/85">
                                    <li>the product has been opened or used without any product-related defect;</li>
                                    <li>
                                        the product was damaged after delivery due to customer handling or improper
                                        storage;
                                    </li>
                                    <li>you ordered the wrong product or quantity; or</li>
                                    <li>
                                        the issue is unrelated to the condition of the product at the time of delivery.
                                    </li>
                                </ul>
                                <p>
                                    If your complaint is upheld (for example wrong, damaged, tampered, missing or
                                    defective product, or late delivery where you have chosen to cancel), we will, at
                                    your choice where practicable, replace the product or refund the amount paid.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h3
                                    className="text-lg font-serif text-[#d8b66a] font-bold"
                                    style={{ fontFamily: "'Cinzel', serif" }}
                                >
                                    7. Refunds
                                </h3>
                                <p>
                                    Approved refunds are made to the account or payment source from which you paid.
                                    Where you paid by bank transfer or QR, we may ask you to confirm the bank account
                                    details to which the refund should be sent. We will never ask for your OTP, PIN,
                                    password or CVV.
                                </p>
                                <p>
                                    We will initiate an approved refund within <strong>5–7 business days</strong> of
                                    approval. The time taken for the amount to reach your account depends on your bank.
                                    Refunds require verification of your payment (transaction/reference number).
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h3
                                    className="text-lg font-serif text-[#d8b66a] font-bold"
                                    style={{ fontFamily: "'Cinzel', serif" }}
                                >
                                    8. Non-Delivery
                                </h3>
                                <p>
                                    If your order is not delivered, contact{' '}
                                    <a href="mailto:hello@goamogh.com" className="text-[#d8b66a] underline">
                                        hello@goamogh.com
                                    </a>{' '}
                                    /{' '}
                                    <a href="tel:+919515951985" className="text-white hover:text-[#d8b66a]">
                                        +91-9515951985
                                    </a>
                                    . We will investigate with the logistics provider and give an appropriate remedy,
                                    including a refund or re-dispatch, in accordance with applicable law.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h3
                                    className="text-lg font-serif text-[#d8b66a] font-bold"
                                    style={{ fontFamily: "'Cinzel', serif" }}
                                >
                                    9. Grievances
                                </h3>
                                <p>
                                    If you are unhappy with our response, contact our Grievance Officer: Aaradhya,{' '}
                                    <a href="mailto:aaradhya@goamogh.com" className="text-[#d8b66a] underline">
                                        aaradhya@goamogh.com
                                    </a>
                                    , +91-9903943909.
                                </p>
                            </section>
                        </div>
                    )}

                    {(selectedSection === 'all' || selectedSection === 'shipping') && (
                        <div className="space-y-8 border-b border-[#d8b66a]/15 pb-12">
                            <div className="border-b border-[#d8b66a]/20 pb-4">
                                <span className="text-xs uppercase font-mono tracking-widest text-[#d8b66a]">
                                    Part D
                                </span>
                                <h2
                                    className="text-2xl md:text-3xl font-serif text-white font-bold"
                                    style={{ fontFamily: "'Cinzel', serif" }}
                                >
                                    Shipping and Delivery Policy
                                </h2>
                            </div>

                            <section className="space-y-2">
                                <h3
                                    className="text-lg font-serif text-[#d8b66a] font-bold"
                                    style={{ fontFamily: "'Cinzel', serif" }}
                                >
                                    1. Delivery Area
                                </h3>
                                <p>
                                    We deliver to the PIN codes served by our logistics partners. Serviceability is
                                    checked at checkout. We may decline delivery to locations where delivery is not
                                    commercially or legally feasible.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h3
                                    className="text-lg font-serif text-[#d8b66a] font-bold"
                                    style={{ fontFamily: "'Cinzel', serif" }}
                                >
                                    2. Delivery Charges
                                </h3>
                                <p>
                                    Any delivery charges are displayed before you confirm your order and are included in
                                    the final payable amount.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h3
                                    className="text-lg font-serif text-[#d8b66a] font-bold"
                                    style={{ fontFamily: "'Cinzel', serif" }}
                                >
                                    3. Delivery Timelines
                                </h3>
                                <p>
                                    Expected delivery timelines are shown on the product page or at checkout. They are
                                    estimates and may vary with destination, courier capacity and other operational
                                    circumstances, including part-load consolidation, weather and government
                                    restrictions. We will inform you of any material delay.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h3
                                    className="text-lg font-serif text-[#d8b66a] font-bold"
                                    style={{ fontFamily: "'Cinzel', serif" }}
                                >
                                    4. Incorrect Address and Failed Delivery
                                </h3>
                                <p>
                                    Please provide an accurate delivery address and reachable phone number. If delivery
                                    fails because of incorrect information or because no one is available to receive the
                                    order, we may re-dispatch the order. Any additional delivery charge for re-dispatch
                                    will be clearly disclosed to you in advance and charged only where permitted by law.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h3
                                    className="text-lg font-serif text-[#d8b66a] font-bold"
                                    style={{ fontFamily: "'Cinzel', serif" }}
                                >
                                    5. Delivery and Inspection
                                </h3>
                                <p>
                                    Please check the outer packaging at delivery. If it is visibly damaged or tampered
                                    with, tell the delivery person, photograph or record a video of the package, and
                                    contact us as set out in Part C.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h3
                                    className="text-lg font-serif text-[#d8b66a] font-bold"
                                    style={{ fontFamily: "'Cinzel', serif" }}
                                >
                                    6. Contact
                                </h3>
                                <p>
                                    For delivery queries:{' '}
                                    <a href="mailto:hello@goamogh.com" className="text-[#d8b66a] underline">
                                        hello@goamogh.com
                                    </a>{' '}
                                    /{' '}
                                    <a href="tel:+919515951985" className="text-white hover:text-[#d8b66a]">
                                        +91-9515951985
                                    </a>
                                    .
                                </p>
                            </section>
                        </div>
                    )}

                    {(selectedSection === 'all' || selectedSection === 'cookie') && (
                        <div className="space-y-8">
                            <div className="border-b border-[#d8b66a]/20 pb-4">
                                <span className="text-xs uppercase font-mono tracking-widest text-[#d8b66a]">
                                    Part E
                                </span>
                                <h2
                                    className="text-2xl md:text-3xl font-serif text-white font-bold"
                                    style={{ fontFamily: "'Cinzel', serif" }}
                                >
                                    Cookie Policy
                                </h2>
                            </div>

                            <section className="space-y-2">
                                <h3
                                    className="text-lg font-serif text-[#d8b66a] font-bold"
                                    style={{ fontFamily: "'Cinzel', serif" }}
                                >
                                    1. What Are Cookies
                                </h3>
                                <p>
                                    Cookies are small text files stored on your device when you visit a website. We and
                                    our service providers use cookies and similar technologies on www.goamogh.com.
                                </p>
                            </section>

                            <section className="space-y-3">
                                <h3
                                    className="text-lg font-serif text-[#d8b66a] font-bold"
                                    style={{ fontFamily: "'Cinzel', serif" }}
                                >
                                    2. How We Use Them
                                </h3>
                                <ul className="list-disc pl-5 space-y-1.5 text-sm text-[#d6cca9]/85">
                                    <li>
                                        <strong>Strictly necessary cookies:</strong> needed for the website to work and
                                        stay secure (for example keeping your cart and preventing fraud). These do not
                                        need consent.
                                    </li>
                                    <li>
                                        <strong>Preference cookies:</strong> remember your settings and choices.
                                    </li>
                                    <li>
                                        <strong>Analytics cookies:</strong> help us understand how the website is used
                                        so we can improve it. Used only with your consent.
                                    </li>
                                    <li>
                                        <strong>Marketing cookies:</strong> used to show relevant advertising. Used only
                                        with your consent.
                                    </li>
                                </ul>
                            </section>

                            <section className="space-y-2">
                                <h3
                                    className="text-lg font-serif text-[#d8b66a] font-bold"
                                    style={{ fontFamily: "'Cinzel', serif" }}
                                >
                                    3. Your Choices
                                </h3>
                                <p>
                                    When you first visit the website you can accept or reject non-essential cookies
                                    using the cookie banner, and you can change your choice at any time through the
                                    cookie settings link on the website or your browser settings. Blocking strictly
                                    necessary cookies may stop parts of the website from working.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h3
                                    className="text-lg font-serif text-[#d8b66a] font-bold"
                                    style={{ fontFamily: "'Cinzel', serif" }}
                                >
                                    4. Details of Cookies
                                </h3>
                                <p>
                                    A current list of the cookies we use, with their provider, purpose and duration, is
                                    available in the cookie settings panel and on request at{' '}
                                    <a href="mailto:aaradhya@goamogh.com" className="text-[#d8b66a] underline">
                                        aaradhya@goamogh.com
                                    </a>
                                    .
                                </p>
                            </section>

                            <section className="space-y-2">
                                <h3
                                    className="text-lg font-serif text-[#d8b66a] font-bold"
                                    style={{ fontFamily: "'Cinzel', serif" }}
                                >
                                    5. Contact
                                </h3>
                                <p>
                                    Questions about this Cookie Policy:{' '}
                                    <a href="mailto:aaradhya@goamogh.com" className="text-[#d8b66a] underline">
                                        aaradhya@goamogh.com
                                    </a>
                                    .
                                </p>
                            </section>
                        </div>
                    )}
                </motion.div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#d6cca9]/60 font-mono border-t border-[#d8b66a]/15 pt-6">
                    <div className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-[#d8b66a]" />
                        <span>Go Amogh (OPC) Private Limited • Official Documentation</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/privacy" className="hover:text-[#d8b66a] underline transition">
                            Privacy Policy
                        </Link>
                        <Link href="/shop" className="hover:text-[#d8b66a] underline transition">
                            Shop
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}

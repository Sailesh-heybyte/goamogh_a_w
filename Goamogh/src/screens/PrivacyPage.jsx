'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Mail, Phone, MapPin, Building, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPage() {
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
                        href="/terms"
                        className="inline-flex items-center gap-1.5 text-xs text-[#d8b66a]/80 hover:text-[#efe3bf] transition font-mono underline"
                    >
                        <span>View Terms & Conditions</span>
                    </Link>
                </div>

                <div className="space-y-4 border-b border-[#d8b66a]/15 pb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0b150d] border border-[#d8b66a]/20 text-[#d8b66a] text-xs uppercase tracking-widest font-mono">
                        <ShieldCheck size={14} />
                        <span>Part A • Website Policies</span>
                    </div>
                    <h1
                        className="text-3xl md:text-5xl font-serif text-white tracking-wide"
                        style={{ fontFamily: "'Cinzel', serif" }}
                    >
                        PRIVACY POLICY
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#d8b66a]/80 font-mono">
                        <span>Effective Date: 12 October 2026</span>
                        <span>•</span>
                        <span>Version 1.0</span>
                        <span>•</span>
                        <span>DPDP Act 2023 Compliant</span>
                    </div>
                </div>

                <div className="bg-[#0b150d] border border-[#d8b66a]/30 rounded-2xl p-6 md:p-8 space-y-4 shadow-xl">
                    <div className="flex items-center gap-2.5 text-[#d8b66a]">
                        <Building size={18} />
                        <h2 className="text-sm md:text-base font-bold uppercase tracking-wider font-mono">
                            Data Fiduciary Identification
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

                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-[#0b150d] border border-[#d8b66a]/20 rounded-[32px] p-8 md:p-12 shadow-2xl space-y-10 font-sans text-sm md:text-base leading-relaxed text-[#d6cca9]/90"
                >
                    <section className="space-y-3">
                        <h2
                            className="text-xl font-serif text-[#d8b66a] font-bold"
                            style={{ fontFamily: "'Cinzel', serif" }}
                        >
                            1. Introduction
                        </h2>
                        <p>
                            Go Amogh (OPC) Private Limited (&quot;Go Amogh&quot;, &quot;Company&quot;, &quot;we&quot;,
                            &quot;us&quot; or &quot;our&quot;) respects the privacy of individuals whose personal data
                            we process in connection with our products, website, orders, customer support and
                            communications.
                        </p>
                        <p>
                            This Privacy Policy explains how we collect, use, share, retain and protect personal data
                            when you:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-[#d6cca9]/85">
                            <li>visit our website;</li>
                            <li>create an account, where available;</li>
                            <li>place an order or make payment;</li>
                            <li>contact us, including through WhatsApp, SMS, email, telephone or website forms;</li>
                            <li>subscribe to promotional communications; or</li>
                            <li>participate in surveys, offers or other activities.</li>
                        </ul>
                        <p>
                            We process personal data in accordance with applicable Indian law, including the Digital
                            Personal Data Protection Act, 2023 and the rules made under it, to the extent they apply to
                            the relevant processing.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2
                            className="text-xl font-serif text-[#d8b66a] font-bold"
                            style={{ fontFamily: "'Cinzel', serif" }}
                        >
                            2. Data Fiduciary
                        </h2>
                        <p>
                            The data fiduciary responsible for your personal data is{' '}
                            <strong>Go Amogh (OPC) Private Limited</strong>, registered in Andhra Pradesh, India. All
                            formal privacy queries and statutory notices may be directed to our dedicated contact at{' '}
                            <a href="mailto:aaradhya@goamogh.com" className="text-[#d8b66a] underline">
                                aaradhya@goamogh.com
                            </a>
                            .
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2
                            className="text-xl font-serif text-[#d8b66a] font-bold"
                            style={{ fontFamily: "'Cinzel', serif" }}
                        >
                            3. Personal Data We Collect
                        </h2>
                        <p>
                            Depending on how you interact with us, we may process the following categories of personal
                            data:
                        </p>

                        <div className="space-y-3 pl-2">
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-[#d8b66a] font-mono">
                                    A. Identity and contact information
                                </h3>
                                <ul className="list-disc pl-5 space-y-1 text-sm text-[#d6cca9]/85 mt-1">
                                    <li>name, mobile number and email address;</li>
                                    <li>billing address and shipping/delivery address.</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-[#d8b66a] font-mono">
                                    B. Order information
                                </h3>
                                <ul className="list-disc pl-5 space-y-1 text-sm text-[#d6cca9]/85 mt-1">
                                    <li>products purchased, quantity, order number, date and status;</li>
                                    <li>delivery information;</li>
                                    <li>customer-service communications; and</li>
                                    <li>returns, refunds and complaints.</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-[#d8b66a] font-mono">
                                    C. Payment-related information
                                </h3>
                                <p className="mt-1">
                                    We accept payment by IMPS, NEFT and QR/scanner payment directly into our bank
                                    account. To identify and reconcile your payment we may process the
                                    transaction/reference (UTR) number, payment date, amount, payer name or account
                                    details you provide, and payment confirmations or screenshots you send us. We do not
                                    store card details.
                                </p>
                                <div className="mt-2 p-3 bg-[#1a2416] border-l-2 border-[#d8b66a] rounded-r-lg text-xs font-mono text-[#efe3bf]">
                                    <strong>Important Security Reminder:</strong> We never ask for your password, PIN,
                                    CVV, OTP or any other authentication credential. Please never send these to us.
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-[#d8b66a] font-mono">
                                    D. Communication information
                                </h3>
                                <p className="mt-1">
                                    Content of messages you send us through WhatsApp, SMS, email, telephone, website
                                    contact forms and other support channels.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-[#d8b66a] font-mono">
                                    E. Technical information collected automatically
                                </h3>
                                <p className="mt-1">
                                    When you use our website we may automatically collect your IP address, browser type,
                                    device and operating system information, pages visited and interaction data, log
                                    information, and cookie identifiers (see Part E – Cookie Policy).
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h2
                            className="text-xl font-serif text-[#d8b66a] font-bold"
                            style={{ fontFamily: "'Cinzel', serif" }}
                        >
                            4. Why We Process Personal Data
                        </h2>
                        <p>We process personal data only for lawful purposes, as follows.</p>

                        <div className="space-y-3 pl-2">
                            <div>
                                <p className="font-semibold text-white">
                                    Purposes for which you voluntarily provide data to us (and for which we process only
                                    what is necessary):
                                </p>
                                <ul className="list-disc pl-5 space-y-1 text-sm text-[#d6cca9]/85 mt-1">
                                    <li>accepting, confirming and processing orders;</li>
                                    <li>verifying and reconciling payments;</li>
                                    <li>arranging shipment and delivery;</li>
                                    <li>providing customer support and responding to complaints;</li>
                                    <li>processing cancellations, returns and refunds; and</li>
                                    <li>sending order, payment and delivery updates.</li>
                                </ul>
                            </div>

                            <div>
                                <p className="font-semibold text-white">Purposes required or permitted by law:</p>
                                <ul className="list-disc pl-5 space-y-1 text-sm text-[#d6cca9]/85 mt-1">
                                    <li>maintaining accounting, tax and business records;</li>
                                    <li>
                                        complying with legal obligations and responding to lawful requests of
                                        governmental or regulatory authorities;
                                    </li>
                                    <li>preventing fraud, misuse and unauthorised transactions;</li>
                                    <li>maintaining information-security and audit records; and</li>
                                    <li>establishing, exercising or defending legal claims.</li>
                                </ul>
                            </div>

                            <div>
                                <p className="font-semibold text-white">
                                    Purposes for which we will ask for your consent:
                                </p>
                                <ul className="list-disc pl-5 space-y-1 text-sm text-[#d6cca9]/85 mt-1">
                                    <li>sending promotional communications;</li>
                                    <li>non-essential analytics and marketing cookies; and</li>
                                    <li>
                                        any other purpose that we specifically tell you about at or before collection.
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h2
                            className="text-xl font-serif text-[#d8b66a] font-bold"
                            style={{ fontFamily: "'Cinzel', serif" }}
                        >
                            5. Transactional Communications
                        </h2>
                        <p>
                            We send communications that are necessary to perform your order or provide a service you
                            requested, through WhatsApp, SMS, email or telephone. These include order and payment
                            confirmations, payment verification, dispatch and delivery information, cancellation and
                            refund information, customer-support responses, and security or fraud alerts. These are
                            operational messages, not promotions.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2
                            className="text-xl font-serif text-[#d8b66a] font-bold"
                            style={{ fontFamily: "'Cinzel', serif" }}
                        >
                            6. Promotional Communications
                        </h2>
                        <p>
                            We send promotional messages (offers, discounts, product launches and campaigns) by
                            WhatsApp, SMS or email only if you have given your consent, by a clear affirmative action
                            such as ticking an unticked consent box. Consent to marketing is not a condition for placing
                            an order.
                        </p>
                        <p>
                            You may opt out at any time by replying STOP (or following the unsubscribe instruction in
                            the message), or by emailing{' '}
                            <a href="mailto:aaradhya@goamogh.com" className="text-[#d8b66a] underline">
                                aaradhya@goamogh.com
                            </a>
                            . We will record your opt-out and will not send further promotional messages for that
                            channel. Promotional SMS are sent in compliance with applicable telecom regulations,
                            including the DND/preference framework.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2
                            className="text-xl font-serif text-[#d8b66a] font-bold"
                            style={{ fontFamily: "'Cinzel', serif" }}
                        >
                            7. Sharing of Personal Data
                        </h2>
                        <p>
                            We share personal data only to the extent reasonably necessary for the purposes in this
                            Policy, with:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-[#d6cca9]/85">
                            <li>courier and logistics providers;</li>
                            <li>website hosting and application service providers;</li>
                            <li>IT and cybersecurity service providers;</li>
                            <li>email, SMS and WhatsApp communication providers;</li>
                            <li>payment and banking service providers;</li>
                            <li>accounting and professional-service providers;</li>
                            <li>customer-support service providers;</li>
                            <li>government authorities or regulators where legally required; and</li>
                            <li>professional advisers where necessary for legitimate business or legal purposes.</li>
                        </ul>
                        <p>
                            We do not sell your personal data. Where we engage a service provider to process data on our
                            behalf, we do so under a contract that requires it to protect the data and to use it only
                            for our instructions.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2
                            className="text-xl font-serif text-[#d8b66a] font-bold"
                            style={{ fontFamily: "'Cinzel', serif" }}
                        >
                            8. Marketplaces and Quick-Commerce Platforms
                        </h2>
                        <p>
                            If you buy Go Amogh products through Amazon (including Amazon Fresh), Blinkit, Swiggy
                            Instamart or another third-party platform, your order is governed by that platform’s terms
                            and privacy policy, and that platform is a separate data fiduciary. We process only the
                            information the platform makes available to us for fulfilling and supporting your order.
                            This Policy applies to that information once we receive it; it does not describe the
                            platform’s own practices, which may differ from purchases made directly on our website.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2
                            className="text-xl font-serif text-[#d8b66a] font-bold"
                            style={{ fontFamily: "'Cinzel', serif" }}
                        >
                            9. Processing Outside India
                        </h2>
                        <p>
                            If any of our service providers processes personal data outside India, it will be done only
                            as permitted under applicable law.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2
                            className="text-xl font-serif text-[#d8b66a] font-bold"
                            style={{ fontFamily: "'Cinzel', serif" }}
                        >
                            10. Data Security
                        </h2>
                        <p>
                            We take reasonable technical and organisational measures to protect personal data, including
                            access controls and role-based access, secure transmission (HTTPS), backups, logging and
                            monitoring, confidentiality obligations on personnel, contractual controls on vendors,
                            secure disposal, and periodic review of these measures. No method of transmission or storage
                            is completely secure, but we work to prevent unauthorised access, loss or misuse.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2
                            className="text-xl font-serif text-[#d8b66a] font-bold"
                            style={{ fontFamily: "'Cinzel', serif" }}
                        >
                            11. Data Retention
                        </h2>
                        <p>
                            We retain personal data only as long as necessary for the purpose for which it was collected
                            and to meet legal requirements:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-[#d6cca9]/85">
                            <li>
                                <strong>order, delivery, refund and customer-service records:</strong> until the order
                                or complaint is closed and for up to three years afterwards, to deal with possible
                                claims;
                            </li>
                            <li>
                                <strong>accounting and tax records:</strong> for the periods prescribed under the
                                Companies Act, 2013 and GST law;
                            </li>
                            <li>
                                <strong>marketing preferences and consent records:</strong> until you withdraw consent,
                                and a minimal opt-out record afterwards so that we respect your choice;
                            </li>
                            <li>
                                <strong>technical and security logs:</strong> for the period required by law and
                                thereafter only as needed for security.
                            </li>
                        </ul>
                        <p>When data is no longer needed, we erase it or anonymise it.</p>
                    </section>

                    <section className="space-y-3">
                        <h2
                            className="text-xl font-serif text-[#d8b66a] font-bold"
                            style={{ fontFamily: "'Cinzel', serif" }}
                        >
                            12. Accuracy
                        </h2>
                        <p>
                            Please give us accurate and current information needed to fulfil your orders. You may ask us
                            to correct or update inaccurate data.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2
                            className="text-xl font-serif text-[#d8b66a] font-bold"
                            style={{ fontFamily: "'Cinzel', serif" }}
                        >
                            13. Your Rights
                        </h2>
                        <p>
                            Subject to applicable law (including the Digital Personal Data Protection Act, 2023), you
                            have the right to:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-[#d6cca9]/85">
                            <li>
                                obtain a summary of the personal data we process and the processing activities, and the
                                identities of those with whom we have shared it;
                            </li>
                            <li>correct, complete or update your personal data;</li>
                            <li>request erasure of your personal data, unless we must retain it by law;</li>
                            <li>withdraw consent where processing is based on consent;</li>
                            <li>have your grievance addressed; and</li>
                            <li>
                                nominate another person to exercise your rights in the event of your death or
                                incapacity.
                            </li>
                        </ul>
                        <p>
                            To exercise these rights, email{' '}
                            <a href="mailto:aaradhya@goamogh.com" className="text-[#d8b66a] underline">
                                aaradhya@goamogh.com
                            </a>{' '}
                            from the email address linked to your order, giving your name and order number. We will
                            respond within a reasonable time and in any case within the period required by law. If you
                            are not satisfied with our response to your grievance, you may complain to the Data
                            Protection Board of India after first using our grievance process.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2
                            className="text-xl font-serif text-[#d8b66a] font-bold"
                            style={{ fontFamily: "'Cinzel', serif" }}
                        >
                            14. Withdrawal of Consent
                        </h2>
                        <p>
                            You may withdraw any consent you have given as easily as you gave it: by replying STOP to a
                            promotional message, using the unsubscribe link, adjusting cookie settings (see Part E), or
                            emailing{' '}
                            <a href="mailto:aaradhya@goamogh.com" className="text-[#d8b66a] underline">
                                aaradhya@goamogh.com
                            </a>
                            . Withdrawal does not affect processing already done, or processing that is necessary to
                            complete an existing order or is otherwise required or permitted by law. Withdrawal may
                            affect our ability to provide a service that depends on the data concerned.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2
                            className="text-xl font-serif text-[#d8b66a] font-bold"
                            style={{ fontFamily: "'Cinzel', serif" }}
                        >
                            15. Children
                        </h2>
                        <p>
                            Our website is intended for persons aged 18 years and over. We do not knowingly collect
                            personal data of children, and we do not track or monitor the behaviour of children or
                            direct targeted advertising at them. If you believe a child has given us personal data,
                            please contact us and we will delete it unless the law requires otherwise.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2
                            className="text-xl font-serif text-[#d8b66a] font-bold"
                            style={{ fontFamily: "'Cinzel', serif" }}
                        >
                            16. Personal Data Breach
                        </h2>
                        <p>
                            We maintain a procedure for responding to security incidents. If a personal data breach
                            occurs, we will contain and investigate it, take remedial steps, and notify the Data
                            Protection Board of India and affected individuals as required by law.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2
                            className="text-xl font-serif text-[#d8b66a] font-bold"
                            style={{ fontFamily: "'Cinzel', serif" }}
                        >
                            17. Grievance Redressal
                        </h2>
                        <p>
                            For any privacy concern, data protection request or grievance, please reach out to our
                            designated Grievance Officer:
                        </p>
                        <div className="p-6 bg-[#1a2416] border border-[#d8b66a]/25 rounded-2xl space-y-2 text-xs font-mono text-[#d6cca9]">
                            <p className="text-white font-bold text-sm">Grievance Officer: Aaradhya</p>
                            <p className="flex items-center gap-2">
                                <Mail size={14} className="text-[#d8b66a]" />
                                <span>
                                    Email:{' '}
                                    <a href="mailto:aaradhya@goamogh.com" className="text-[#d8b66a] underline">
                                        aaradhya@goamogh.com
                                    </a>
                                </span>
                            </p>
                            <p className="flex items-center gap-2">
                                <Phone size={14} className="text-[#d8b66a]" />
                                <span>
                                    Phone:{' '}
                                    <a href="tel:+919903943909" className="text-white hover:text-[#d8b66a]">
                                        +91-9903943909
                                    </a>
                                </span>
                            </p>
                            <p className="flex items-start gap-2 pt-1">
                                <MapPin size={14} className="text-[#d8b66a] mt-0.5 shrink-0" />
                                <span>
                                    Address: Door No. 3-11-8, Lakshmi Gayatri Nivas, Kandukuri Vari Street, Ramanagar,
                                    Patimedha, Nidadavole, East Godavari District, Andhra Pradesh – 534301 (registered
                                    office)
                                </span>
                            </p>
                        </div>
                        <p className="text-xs text-[#d6cca9]/70 italic">
                            We will acknowledge your complaint within 48 hours of receipt and will endeavour to resolve
                            it within one month of receipt.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2
                            className="text-xl font-serif text-[#d8b66a] font-bold"
                            style={{ fontFamily: "'Cinzel', serif" }}
                        >
                            18. Changes to this Policy
                        </h2>
                        <p>
                            We may update this Policy to reflect changes in law, our operations, our website or our
                            practices. The updated version will be published on this website with its effective date.
                        </p>
                    </section>
                </motion.div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#d6cca9]/60 font-mono border-t border-[#d8b66a]/15 pt-6">
                    <div className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-[#d8b66a]" />
                        <span>Go Amogh (OPC) Private Limited • Official Privacy Policy</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/terms" className="hover:text-[#d8b66a] underline transition">
                            Terms & Conditions
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

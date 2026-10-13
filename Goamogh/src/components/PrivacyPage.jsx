"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, CheckCircle, ArrowLeft, Building2, Mail, Phone, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPage() {
    return (
        <main className="min-h-screen bg-[#1a2416] text-[#efe3bf] pt-32 pb-24 px-4 md:px-8 selection:bg-[#d8b66a] selection:text-[#0b150d]">
            <div className="max-w-4xl mx-auto space-y-12">
                
                {/* Back Link */}
                <Link
                    href="/shop"
                    className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-[#d8b66a] hover:text-[#efe3bf] transition duration-200 cursor-pointer"
                >
                    <ArrowLeft size={16} />
                    <span>Back to Shop</span>
                </Link>

                {/* Hero Title */}
                <div className="space-y-4 border-b border-[#d8b66a]/15 pb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0b150d] border border-[#d8b66a]/20 text-[#d8b66a] text-xs uppercase tracking-widest font-mono">
                        <ShieldCheck size={14} />
                        <span>Official Privacy Policy • DPDP Act 2023 Compliant</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-serif text-white" style={{ fontFamily: "'Cinzel', serif" }}>
                        PRIVACY POLICY
                    </h1>
                    <p className="text-xs text-[#d8b66a]/80 font-mono">
                        Go Amogh (OPC) Private Limited • Version 1.0
                    </p>
                </div>

                {/* Content Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#0b150d] border border-[#d8b66a]/20 rounded-[32px] p-8 md:p-12 shadow-2xl space-y-8 font-sans text-sm md:text-base leading-relaxed text-[#d6cca9]/85"
                >
                    {/* Entity Details Header Box */}
                    <div className="p-6 bg-[#1a2416] border border-[#d8b66a]/20 rounded-2xl space-y-2.5 text-xs font-mono">
                        <p className="text-white font-bold text-sm">Data Fiduciary: Go Amogh (OPC) Private Limited</p>
                        <p className="text-[#efe3bf]/90">
                            Registered Office: Door No. 3-11-8, Lakshmi Gayatri Nivas, Kandukuri Vari Street, Ramanagar, Patimedha, Nidadavole, East Godavari District, Andhra Pradesh – 534301
                        </p>
                        <div className="flex flex-wrap gap-x-6 gap-y-1 text-[#d8b66a]">
                            <span>CIN: U10799AP2025OPC121160</span>
                            <span>GSTIN: 37AAMCG3553B1ZP</span>
                            <span>FSSAI: 10126019000124</span>
                        </div>
                        <div className="flex flex-wrap gap-x-6 gap-y-1 pt-1 text-[#efe3bf]/80">
                            <span>Privacy Contact: <a href="mailto:aaradhya@goamogh.com" className="text-[#d8b66a] underline">aaradhya@goamogh.com</a></span>
                            <span>Customer Support: <a href="mailto:hello@goamogh.com" className="text-[#d8b66a] underline">hello@goamogh.com</a> / +91-9515951985</span>
                        </div>
                    </div>

                    <div className="space-y-6 text-sm">
                        <section className="space-y-2">
                            <h2 className="text-lg font-serif text-[#d8b66a] font-bold">1. INTRODUCTION</h2>
                            <p>Go Amogh (OPC) Private Limited ("Go Amogh", "Company", "we", "us" or "our") respects the privacy of individuals whose personal data we process in connection with our products, website, orders, customer support and communications.</p>
                            <p>This Privacy Policy explains how we collect, use, share, retain and protect personal data when you:</p>
                            <ul className="list-disc pl-5 space-y-1 text-[#efe3bf]/85">
                                <li>visit our website (www.goamogh.com);</li>
                                <li>create an account, where available;</li>
                                <li>place an order or make payment;</li>
                                <li>contact us, including through WhatsApp, SMS, email, telephone or website forms;</li>
                                <li>subscribe to promotional communications; or</li>
                                <li>participate in surveys, offers or other activities.</li>
                            </ul>
                            <p>We process personal data in accordance with applicable Indian law, including the Digital Personal Data Protection Act, 2023 (DPDP Act) and the rules made under it, to the extent they apply to the relevant processing.</p>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-lg font-serif text-[#d8b66a] font-bold">2. DATA FIDUCIARY DETAILS</h2>
                            <div className="space-y-1 pl-1">
                                <p><strong>Company:</strong> Go Amogh (OPC) Private Limited</p>
                                <p><strong>Registered Office:</strong> Door No. 3-11-8, Lakshmi Gayatri Nivas, Kandukuri Vari Street, Ramanagar, Patimedha, Nidadavole, East Godavari District, Andhra Pradesh – 534301</p>
                                <p><strong>CIN:</strong> U10799AP2025OPC121160</p>
                                <p><strong>GSTIN:</strong> 37AAMCG3553B1ZP</p>
                                <p><strong>FSSAI Licence / Registration No.:</strong> 10126019000124</p>
                                <p><strong>Website:</strong> www.goamogh.com</p>
                                <p><strong>Privacy & Grievance Contact:</strong> Aaradhya (<a href="mailto:aaradhya@goamogh.com" className="text-[#d8b66a] underline">aaradhya@goamogh.com</a>)</p>
                                <p><strong>Customer Support:</strong> <a href="mailto:hello@goamogh.com" className="text-[#d8b66a] underline">hello@goamogh.com</a> / +91-9515951985</p>
                            </div>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-lg font-serif text-[#d8b66a] font-bold">3. PERSONAL DATA WE COLLECT</h2>
                            <p>Depending on how you interact with us, we may process the following categories of data:</p>
                            <div className="space-y-3 pl-2">
                                <div>
                                    <h3 className="font-semibold text-white">A. Identity and contact information</h3>
                                    <ul className="list-disc pl-5 space-y-1 text-[#efe3bf]/85">
                                        <li>Name, mobile number and email address;</li>
                                        <li>Billing address and shipping / delivery address.</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">B. Order information</h3>
                                    <ul className="list-disc pl-5 space-y-1 text-[#efe3bf]/85">
                                        <li>Products purchased, quantity, order number, date and status;</li>
                                        <li>Delivery information;</li>
                                        <li>Customer-service communications; and</li>
                                        <li>Returns, refunds and complaints records.</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">C. Payment-related information</h3>
                                    <p>We accept payment by IMPS, NEFT and QR/scanner payment directly into our bank account. To identify and reconcile your payment we may process the transaction/reference (UTR) number, payment date, amount, payer name or account details you provide, and payment confirmations or screenshots you send us. We do not store credit or debit card details.</p>
                                    <p className="text-amber-300/90 font-medium">We never ask for your password, PIN, CVV, OTP or any other authentication credential. Please never send these to us.</p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">D. Communication information</h3>
                                    <p>Content of messages you send us through WhatsApp, SMS, email, telephone, website contact forms and other support channels.</p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">E. Technical information collected automatically</h3>
                                    <p>When you use our website we may automatically collect your IP address, browser type, device and operating system information, pages visited and interaction data, log information, and cookie identifiers.</p>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-lg font-serif text-[#d8b66a] font-bold">4. WHY WE PROCESS PERSONAL DATA</h2>
                            <p>We process personal data only for lawful purposes, as follows:</p>
                            <div className="space-y-3 pl-2">
                                <div>
                                    <h3 className="font-semibold text-white">Purposes for which you voluntarily provide data to us (necessary processing):</h3>
                                    <ul className="list-disc pl-5 space-y-1 text-[#efe3bf]/85">
                                        <li>Accepting, confirming and processing orders;</li>
                                        <li>Verifying and reconciling payments;</li>
                                        <li>Arranging shipment and delivery;</li>
                                        <li>Providing customer support and responding to complaints;</li>
                                        <li>Processing cancellations, returns and refunds; and</li>
                                        <li>Sending order, payment and delivery updates.</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">Purposes required or permitted by law:</h3>
                                    <ul className="list-disc pl-5 space-y-1 text-[#efe3bf]/85">
                                        <li>Maintaining accounting, tax and business records;</li>
                                        <li>Complying with legal obligations and responding to lawful requests of governmental or regulatory authorities;</li>
                                        <li>Preventing fraud, misuse and unauthorised transactions;</li>
                                        <li>Maintaining information-security and audit records; and</li>
                                        <li>Establishing, exercising or defending legal claims.</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">Purposes for which we will ask for your consent:</h3>
                                    <ul className="list-disc pl-5 space-y-1 text-[#efe3bf]/85">
                                        <li>Sending promotional communications;</li>
                                        <li>Non-essential analytics and marketing cookies; and</li>
                                        <li>Any other purpose that we specifically notify you about at or before collection.</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-lg font-serif text-[#d8b66a] font-bold">5. TRANSACTIONAL COMMUNICATIONS</h2>
                            <p>We send communications that are necessary to perform your order or provide a service you requested, through WhatsApp, SMS, email or telephone. These include order and payment confirmations, payment verification, dispatch and delivery information, cancellation and refund information, customer-support responses, and security or fraud alerts. These are operational messages, not promotional messages.</p>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-lg font-serif text-[#d8b66a] font-bold">6. PROMOTIONAL COMMUNICATIONS</h2>
                            <p>We send promotional messages (offers, discounts, product launches and campaigns) by WhatsApp, SMS or email only if you have given your consent, by a clear affirmative action such as ticking an unticked consent box. Consent to marketing is not a condition for placing an order.</p>
                            <p>You may opt out at any time by replying STOP (or following the unsubscribe instruction in the message), or by emailing <a href="mailto:aaradhya@goamogh.com" className="text-[#d8b66a] underline">aaradhya@goamogh.com</a>. We will record your opt-out and will not send further promotional messages for that channel. Promotional SMS are sent in compliance with applicable telecom regulations, including the DND/preference framework.</p>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-lg font-serif text-[#d8b66a] font-bold">7. SHARING OF PERSONAL DATA</h2>
                            <p>We share personal data only to the extent reasonably necessary for the purposes in this Policy, with:</p>
                            <ul className="list-disc pl-5 space-y-1 text-[#efe3bf]/85">
                                <li>Courier and logistics providers;</li>
                                <li>Website hosting and application service providers;</li>
                                <li>IT and cybersecurity service providers;</li>
                                <li>Email, SMS and WhatsApp communication providers;</li>
                                <li>Payment and banking service providers;</li>
                                <li>Accounting and professional-service providers;</li>
                                <li>Customer-support service providers;</li>
                                <li>Government authorities or regulators where legally required; and</li>
                                <li>Professional advisers where necessary for legitimate business or legal purposes.</li>
                            </ul>
                            <p>We do not sell your personal data. Where we engage a service provider to process data on our behalf, we do so under a contract that requires it to protect the data and to use it only per our instructions.</p>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-lg font-serif text-[#d8b66a] font-bold">8. MARKETPLACES AND QUICK-COMMERCE PLATFORMS</h2>
                            <p>If you buy Go Amogh products through Amazon (including Amazon Fresh), Blinkit, Swiggy Instamart or another third-party platform, your order is governed by that platform’s terms and privacy policy, and that platform is a separate data fiduciary. We process only the information the platform makes available to us for fulfilling and supporting your order. This Policy applies to that information once we receive it; it does not describe the platform’s own practices, which may differ from purchases made directly on our website.</p>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-lg font-serif text-[#d8b66a] font-bold">9. PROCESSING OUTSIDE INDIA</h2>
                            <p>If any of our service providers processes personal data outside India, it will be done only as permitted under applicable law.</p>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-lg font-serif text-[#d8b66a] font-bold">10. DATA SECURITY</h2>
                            <p>We take reasonable technical and organisational measures to protect personal data, including access controls and role-based access, secure transmission (HTTPS), backups, logging and monitoring, confidentiality obligations on personnel, contractual controls on vendors, secure disposal, and periodic review of these measures. No method of transmission or storage is completely secure, but we work diligently to prevent unauthorised access, loss or misuse.</p>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-lg font-serif text-[#d8b66a] font-bold">11. DATA RETENTION</h2>
                            <p>We retain personal data only as long as necessary for the purpose for which it was collected and to meet legal requirements:</p>
                            <ul className="list-disc pl-5 space-y-1 text-[#efe3bf]/85">
                                <li><strong>Order, delivery, refund and customer-service records:</strong> Until the order or complaint is closed and for up to three years afterwards, to deal with possible claims;</li>
                                <li><strong>Accounting and tax records:</strong> For the periods prescribed under the Companies Act, 2013 and GST law;</li>
                                <li><strong>Marketing preferences and consent records:</strong> Until you withdraw consent, and a minimal opt-out record afterwards so that we respect your choice;</li>
                                <li><strong>Technical and security logs:</strong> For the period required by law and thereafter only as needed for security.</li>
                            </ul>
                            <p>When data is no longer needed, we erase it or anonymise it.</p>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-lg font-serif text-[#d8b66a] font-bold">12. ACCURACY</h2>
                            <p>Please give us accurate and current information needed to fulfil your orders. You may ask us to correct or update inaccurate data.</p>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-lg font-serif text-[#d8b66a] font-bold">13. YOUR RIGHTS</h2>
                            <p>Subject to applicable law, you have the right to:</p>
                            <ul className="list-disc pl-5 space-y-1 text-[#efe3bf]/85">
                                <li>Obtain a summary of the personal data we process and the processing activities, and the identities of those with whom we have shared it;</li>
                                <li>Correct, complete or update your personal data;</li>
                                <li>Request erasure of your personal data, unless we must retain it by law;</li>
                                <li>Withdraw consent where processing is based on consent;</li>
                                <li>Have your grievance addressed; and</li>
                                <li>Nominate another person to exercise your rights in the event of your death or incapacity.</li>
                            </ul>
                            <p>To exercise these rights, email <a href="mailto:aaradhya@goamogh.com" className="text-[#d8b66a] underline">aaradhya@goamogh.com</a> from the email address linked to your order, giving your name and order number. We will respond within a reasonable time and in any case within the period required by law. If you are not satisfied with our response to your grievance, you may complain to the Data Protection Board of India after first using our grievance process.</p>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-lg font-serif text-[#d8b66a] font-bold">14. WITHDRAWAL OF CONSENT</h2>
                            <p>You may withdraw any consent you have given as easily as you gave it: by replying STOP to a promotional message, using the unsubscribe link, adjusting cookie settings, or emailing <a href="mailto:aaradhya@goamogh.com" className="text-[#d8b66a] underline">aaradhya@goamogh.com</a>. Withdrawal does not affect processing already done, or processing that is necessary to complete an existing order or is otherwise required or permitted by law. Withdrawal may affect our ability to provide a service that depends on the data concerned.</p>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-lg font-serif text-[#d8b66a] font-bold">15. CHILDREN</h2>
                            <p>Our website is intended for persons aged 18 years and over. We do not knowingly collect personal data of children, and we do not track or monitor the behaviour of children or direct targeted advertising at them. If you believe a child has given us personal data, please contact us and we will delete it unless the law requires otherwise.</p>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-lg font-serif text-[#d8b66a] font-bold">16. PERSONAL DATA BREACH</h2>
                            <p>We maintain a procedure for responding to security incidents. If a personal data breach occurs, we will contain and investigate it, take remedial steps, and notify the Data Protection Board of India and affected individuals as required by law.</p>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-lg font-serif text-[#d8b66a] font-bold">17. GRIEVANCE REDRESSAL</h2>
                            <p>For any privacy concern or request, contact:</p>
                            <div className="space-y-1 pl-1">
                                <p><strong>Grievance Officer:</strong> Aaradhya</p>
                                <p><strong>Email:</strong> <a href="mailto:aaradhya@goamogh.com" className="text-[#d8b66a] underline">aaradhya@goamogh.com</a></p>
                                <p><strong>Phone:</strong> +91-9903943909</p>
                                <p><strong>Address:</strong> Door No. 3-11-8, Lakshmi Gayatri Nivas, Kandukuri Vari Street, Ramanagar, Patimedha, Nidadavole, East Godavari District, Andhra Pradesh – 534301 (registered office)</p>
                            </div>
                            <p className="pt-1 text-[#efe3bf]/80">We will acknowledge your complaint within 48 hours of receipt and will endeavour to resolve it within one month of receipt.</p>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-lg font-serif text-[#d8b66a] font-bold">18. CHANGES TO THIS POLICY</h2>
                            <p>We may update this Policy to reflect changes in law, our operations, our website or our practices. The updated version will be published on this website with its effective date.</p>
                        </section>
                    </div>
                </motion.div>

                {/* Footer Assurance */}
                <div className="flex items-center justify-center gap-2 text-xs text-[#d6cca9]/60 font-mono">
                    <CheckCircle size={14} className="text-[#d8b66a]" />
                    <span>Goamogh Official Legal Documentation • Digital Personal Data Protection Act, 2023</span>
                </div>

            </div>
        </main>
    );
}

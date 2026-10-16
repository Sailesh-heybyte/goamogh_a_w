"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    MapPin, 
    Phone, 
    Mail, 
    Clock, 
    Send, 
    MessageSquare, 
    CheckCircle2, 
    ChevronDown, 
    Sparkles, 
    ArrowRight,
    Building2,
    ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { submitContactEnquiry } from '../api/contactService';
import { SOCIAL_LINKS } from '../components/social/socialLinks';

export default function ContactPage() {
    const { openLegalModal } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: 'General Inquiry',
        message: ''
    });

    const [termsAccepted, setTermsAccepted] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [successMsg, setSuccessMsg] = useState('Your message has been sent successfully.');
    const [errorMessage, setErrorMessage] = useState('');
    const [openFaq, setOpenFaq] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!termsAccepted) return;

        if (!formData.message || formData.message.trim().length < 5) {
            setErrorMessage('Enquiry message must be at least 5 characters long.');
            return;
        }

        setSubmitting(true);
        setErrorMessage('');

        try {
            const res = await submitContactEnquiry({
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                inquiry_topic: formData.subject,
                message: formData.message,
                terms_accepted: termsAccepted
            });
            if (res?.message) {
                setSuccessMsg(res.message);
            }
            setSubmitting(false);
            setSubmitted(true);
        } catch (err) {
            setSubmitting(false);
            setErrorMessage(err?.message || 'Failed to submit enquiry. Please try again.');
        }
    };

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const faqs = [
        {
            question: "Where are Goamogh spices sourced and produced?",
            answer: "All Goamogh spices are ethically sourced from verified heritage farms across India and hand-pounded in small batches at our unit in Nidadavole, East Godavari District, Andhra Pradesh."
        },
        {
            question: "How can I place bulk or wholesale orders?",
            answer: "For bulk orders, hotel & restaurant inquiries, or custom spice blends, you can select 'Bulk & Wholesale Order' in the contact form above or reach out directly to our WhatsApp support team."
        },
        {
            question: "What are your delivery timelines across India?",
            answer: "Standard orders are dispatched within 24-48 hours. Express delivery takes 2-4 business days, while standard shipping takes 4-7 business days across India."
        },
        {
            question: "Are your spice blends free from preservatives and artificial colors?",
            answer: "Yes, 100%. We do not use any anti-caking agents, artificial food colors, synthetic flavors, or chemical preservatives. Our spices are 100% pure and unadulterated."
        }
    ];

    const addressDetails = {
        doorNo: "3-11-8",
        street: "Kandukuri Vari Street",
        locality: "Ramnagar",
        city: "Nidadavole",
        district: "East Godavari",
        state: "Andhra Pradesh",
        pinCode: "534301",
        country: "India"
    };

    return (
        <main className="min-h-screen bg-[#1a2416] text-[#efe3bf] pt-32 pb-24 px-4 md:px-8 selection:bg-[#d8b66a] selection:text-[#0b150d]">
            <div className="max-w-7xl mx-auto space-y-16">

                {/* HERO SECTION */}
                <section className="text-center space-y-4 max-w-3xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0b150d] border border-[#d8b66a]/20 text-[#d8b66a] text-xs uppercase tracking-widest font-mono mb-2"
                    >
                        <Sparkles size={14} />
                        <span>Get In Touch</span>
                    </motion.div>
                    
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-4xl md:text-6xl font-serif text-white tracking-tight leading-tight"
                        style={{ fontFamily: "'Cinzel', serif" }}
                    >
                        We’d Love to Hear <br className="hidden md:block" /> From You
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-[#d6cca9]/75 text-base md:text-lg leading-relaxed font-sans"
                    >
                        Have questions about our artisanal hand-pounded spices, bulk inquiries, or order status? Reach out to our team at Goamogh — we are always here to assist.
                    </motion.p>
                </section>

                {/* CONTACT INFO GRID & ADDRESS CARD */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* REGISTERED ADDRESS CARD */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="lg:col-span-1 bg-[#0b150d] border border-[#d8b66a]/20 rounded-[32px] p-8 space-y-6 shadow-2xl relative overflow-hidden flex flex-col justify-between"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-[#d8b66a]/10 via-transparent to-transparent pointer-events-none" />

                        <div className="space-y-6">
                            <div className="flex items-center gap-3 border-b border-[#d8b66a]/15 pb-4">
                                <div className="w-10 h-10 rounded-full bg-[#1a2416] border border-[#d8b66a]/30 flex items-center justify-center text-[#d8b66a]">
                                    <Building2 size={20} />
                                </div>
                                <div>
                                    <h3 className="font-serif text-lg text-white font-bold" style={{ fontFamily: "'Cinzel', serif" }}>
                                        Registered Office
                                    </h3>
                                    <p className="text-[10px] uppercase font-mono tracking-wider text-[#d8b66a]/80">Official Business Location</p>
                                </div>
                            </div>

                            <div className="space-y-3 font-sans text-sm text-[#d6cca9]/85 leading-relaxed">
                                <p className="font-bold text-white text-base flex items-center gap-2">
                                    <MapPin size={16} className="text-[#d8b66a] shrink-0" />
                                    Goamogh Spices
                                </p>
                                <p className="pl-6 font-sans text-sm text-[#efe3bf]/90 leading-relaxed">
                                    Door No. {addressDetails.doorNo}, {addressDetails.street}, {addressDetails.locality}, {addressDetails.city}, {addressDetails.district} District, {addressDetails.state} – {addressDetails.pinCode}, {addressDetails.country}
                                </p>
                            </div>
                        </div>

                        {/* GOOGLE MAPS LINK BUTTON */}
                        <div className="pt-6 border-t border-[#d8b66a]/15 space-y-3">
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Ramnagar, Nidadavole, East Godavari, Andhra Pradesh 534301")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full bg-[#1a2416] hover:bg-[#d8b66a]/15 border border-[#d8b66a]/30 text-[#d8b66a] hover:text-white py-3 px-4 rounded-xl font-mono text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                            >
                                <MapPin size={14} />
                                <span>Open in Google Maps</span>
                            </a>
                        </div>
                    </motion.div>

                    {/* QUICK CONTACT CHANNELS */}
                    <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">

                        {/* CUSTOMER SUPPORT CARD */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="bg-[#0b150d] border border-[#d8b66a]/15 rounded-[28px] p-6 space-y-4 shadow-xl hover:border-[#d8b66a]/40 transition"
                        >
                            <div className="w-10 h-10 rounded-full bg-[#1a2416] border border-[#d8b66a]/20 flex items-center justify-center text-[#d8b66a]">
                                <Phone size={18} />
                            </div>
                            <h3 className="font-serif text-lg text-white font-semibold" style={{ fontFamily: "'Cinzel', serif" }}>
                                Phone & Helpline
                            </h3>
                            <p className="text-xs text-[#d6cca9]/70 leading-relaxed">
                                Reach out directly to our customer assistance team for immediate order queries.
                            </p>
                            <div className="font-mono text-sm text-[#d8b66a] font-bold space-y-1">
                                <div><a href="tel:+919903943909" className="hover:underline">+91 99039 43909</a></div>
                                <div><a href="tel:+918100081766" className="hover:underline">+91 81000 81766</a></div>
                            </div>
                        </motion.div>

                        {/* EMAIL INQUIRIES CARD */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.5 }}
                            className="bg-[#0b150d] border border-[#d8b66a]/15 rounded-[28px] p-6 space-y-4 shadow-xl hover:border-[#d8b66a]/40 transition"
                        >
                            <div className="w-10 h-10 rounded-full bg-[#1a2416] border border-[#d8b66a]/20 flex items-center justify-center text-[#d8b66a]">
                                <Mail size={18} />
                            </div>
                            <h3 className="font-serif text-lg text-white font-semibold" style={{ fontFamily: "'Cinzel', serif" }}>
                                Email Support
                            </h3>
                            <p className="text-xs text-[#d6cca9]/70 leading-relaxed">
                                Send us an email for detailed inquiries, feedback, or custom requests.
                            </p>
                            <div className="font-mono text-sm text-[#d8b66a] font-bold space-y-1">
                                <p className="text-[10px] uppercase tracking-[0.2em] text-[#d6cca9]/60 font-light font-sans">Grievance Officer</p>
                                <div><a href="mailto:aaradhya@goamogh.com" className="hover:underline">aaradhya@goamogh.com</a></div>
                                <div><a href="mailto:hello@goamogh.com" className="hover:underline">hello@goamogh.com</a></div>
                            </div>
                        </motion.div>

                        {/* WHATSAPP DIRECT CHAT */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.6 }}
                            className="bg-[#0b150d] border border-[#d8b66a]/15 rounded-[28px] p-6 space-y-4 shadow-xl hover:border-[#d8b66a]/40 transition"
                        >
                            <div className="w-10 h-10 rounded-full bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                                <MessageSquare size={18} />
                            </div>
                            <h3 className="font-serif text-lg text-white font-semibold" style={{ fontFamily: "'Cinzel', serif" }}>
                                Instant WhatsApp
                            </h3>
                            <p className="text-xs text-[#d6cca9]/70 leading-relaxed">
                                Connect with our spice consultants instantly on WhatsApp.
                            </p>
                            <a
                                href="https://wa.me/?text=Hello%20Goamogh%20Team%2C%20I%20have%20an%20inquiry%20regarding%20spices."
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-emerald-700/80 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition active:scale-95 cursor-pointer"
                            >
                                <MessageSquare size={14} />
                                <span>Chat on WhatsApp</span>
                            </a>
                        </motion.div>

                        {/* WORKING HOURS CARD */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.7 }}
                            className="bg-[#0b150d] border border-[#d8b66a]/15 rounded-[28px] p-6 space-y-4 shadow-xl hover:border-[#d8b66a]/40 transition"
                        >
                            <div className="w-10 h-10 rounded-full bg-[#1a2416] border border-[#d8b66a]/20 flex items-center justify-center text-[#d8b66a]">
                                <Clock size={18} />
                            </div>
                            <h3 className="font-serif text-lg text-white font-semibold" style={{ fontFamily: "'Cinzel', serif" }}>
                                Business Hours
                            </h3>
                            <p className="text-xs text-[#d6cca9]/70 leading-relaxed">
                                Our support team is available during standard operational hours.
                            </p>
                            <div className="font-mono text-xs text-[#efe3bf] space-y-1">
                                <p><strong>Mon - Sat:</strong> 9:00 AM – 6:00 PM IST</p>
                                <p className="font-bold text-[#efe3bf]/90">Sunday: Closed</p>
                            </div>
                        </motion.div>

                    </div>
                </div>

                {/* CONTACT FORM SECTION */}
                <motion.section
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="bg-[#0b150d] border border-[#d8b66a]/20 rounded-[32px] p-8 md:p-12 shadow-2xl relative overflow-hidden"
                >
                    <div className="max-w-3xl mx-auto space-y-8">
                        <div className="text-center space-y-2">
                            <h2 className="font-serif text-2xl md:text-4xl text-white" style={{ fontFamily: "'Cinzel', serif" }}>
                                Send Us a Message
                            </h2>
                            <p className="text-xs md:text-sm text-[#d6cca9]/70 font-sans">
                                Fill out the form below and our team will respond within 24 business hours.
                            </p>
                        </div>

                        {submitted ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-[#1a2416] border border-[#d8b66a]/30 rounded-2xl p-8 text-center space-y-4"
                            >
                                <div className="w-16 h-16 rounded-full bg-[#d8b66a]/15 text-[#d8b66a] flex items-center justify-center mx-auto border border-[#d8b66a]/30">
                                    <CheckCircle2 size={32} />
                                </div>
                                <h3 className="font-serif text-2xl text-white" style={{ fontFamily: "'Cinzel', serif" }}>
                                    Message Received!
                                </h3>
                                <p className="text-sm text-[#d6cca9]/80 max-w-md mx-auto leading-relaxed">
                                    {successMsg}
                                </p>
                                <button
                                    onClick={() => {
                                        setSubmitted(false);
                                        setFormData({ name: '', email: '', phone: '', subject: 'General Inquiry', message: '' });
                                    }}
                                    className="mt-4 px-6 py-2.5 bg-[#d8b66a] hover:bg-[#c5a47e] text-[#0b150d] font-bold text-xs uppercase tracking-widest rounded-xl transition cursor-pointer font-serif"
                                    style={{ fontFamily: "'Cinzel', serif" }}
                                >
                                    Send Another Message
                                </button>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-[10px] uppercase tracking-[0.2em] text-[#d8b66a] font-bold font-serif" style={{ fontFamily: "'Cinzel', serif" }}>
                                            Your Full Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Ananya Sharma"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            name="name"
                                            className="w-full bg-[#1a2416] border border-[#d8b66a]/20 rounded-xl px-4 py-3.5 text-white placeholder-[#d6cca9]/25 focus:border-[#d8b66a]/60 outline-none text-sm transition font-sans"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-[10px] uppercase tracking-[0.2em] text-[#d8b66a] font-bold font-serif" style={{ fontFamily: "'Cinzel', serif" }}>
                                            Email Address *
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            placeholder="name@example.com"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            name="email"
                                            className="w-full bg-[#1a2416] border border-[#d8b66a]/20 rounded-xl px-4 py-3.5 text-white placeholder-[#d6cca9]/25 focus:border-[#d8b66a]/60 outline-none text-sm transition font-sans"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-[10px] uppercase tracking-[0.2em] text-[#d8b66a] font-bold font-serif" style={{ fontFamily: "'Cinzel', serif" }}>
                                            Phone Number (Optional)
                                        </label>
                                        <input
                                            type="tel"
                                            placeholder="10-digit mobile number"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            name="phone"
                                            className="w-full bg-[#1a2416] border border-[#d8b66a]/20 rounded-xl px-4 py-3.5 text-white placeholder-[#d6cca9]/25 focus:border-[#d8b66a]/60 outline-none text-sm font-mono tracking-wider transition"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-[10px] uppercase tracking-[0.2em] text-[#d8b66a] font-bold font-serif" style={{ fontFamily: "'Cinzel', serif" }}>
                                            Inquiry Topic *
                                        </label>
                                        <select
                                            value={formData.subject}
                                            onChange={handleInputChange}
                                            name="subject"
                                            className="w-full bg-[#1a2416] border border-[#d8b66a]/20 rounded-xl px-4 py-3.5 text-white focus:border-[#d8b66a]/60 outline-none text-sm transition font-sans cursor-pointer"
                                        >
                                            <option value="General Inquiry">General Inquiry</option>
                                            <option value="Bulk & Wholesale Order">Bulk & Wholesale Order</option>
                                            <option value="Order & Shipping Status">Order & Shipping Status</option>
                                            <option value="Product Feedback">Product Feedback</option>
                                            <option value="Partnerships">Partnership Inquiry</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[10px] uppercase tracking-[0.2em] text-[#d8b66a] font-bold font-serif" style={{ fontFamily: "'Cinzel', serif" }}>
                                        Your Message *
                                    </label>
                                    <textarea
                                        required
                                        minLength={5}
                                        rows={4}
                                        placeholder="Please write your inquiry or message here (min. 5 characters)..."
                                        value={formData.message}
                                        onChange={handleInputChange}
                                        name="message"
                                        className="w-full bg-[#1a2416] border border-[#d8b66a]/20 rounded-xl px-4 py-3.5 text-white placeholder-[#d6cca9]/25 focus:border-[#d8b66a]/60 outline-none text-sm transition font-sans leading-relaxed"
                                    />
                                </div>

                                {/* DEFAULT ACCEPTED TERMS CHECKBOX */}
                                <div className="flex items-start gap-2.5 pt-1 pb-1 bg-[#1a2416]/50 p-4 rounded-xl border border-[#d8b66a]/15">
                                    <input
                                        type="checkbox"
                                        id="contact_terms_accept"
                                        checked={termsAccepted}
                                        onChange={(e) => setTermsAccepted(e.target.checked)}
                                        className="mt-0.5 rounded border-[#d8b66a]/30 text-[#d8b66a] focus:ring-[#d8b66a] accent-[#d8b66a] cursor-pointer"
                                    />
                                    <label htmlFor="contact_terms_accept" className="text-xs text-[#d6cca9]/80 cursor-pointer select-none leading-relaxed">
                                        Please accept <button type="button" onClick={() => openLegalModal('terms')} className="text-[#d8b66a] underline hover:text-white cursor-pointer">Terms & Conditions</button> and <button type="button" onClick={() => openLegalModal('privacy')} className="text-[#d8b66a] underline hover:text-white cursor-pointer">Privacy Policy</button>
                                    </label>
                                </div>

                                {errorMessage && (
                                    <div className="p-4 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs font-sans leading-relaxed">
                                        <p className="font-bold text-red-300">Failed to send enquiry:</p>
                                        <p>{errorMessage}</p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={submitting || !termsAccepted}
                                    className="w-full bg-[#d8b66a] hover:bg-[#c5a47e] disabled:bg-[#d8b66a]/50 disabled:cursor-not-allowed text-[#0b150d] font-bold py-4 rounded-xl uppercase tracking-widest transition duration-300 flex items-center justify-center gap-2 text-xs shadow-lg shadow-[#d8b66a]/5 hover:shadow-[#d8b66a]/15 font-serif cursor-pointer active:scale-95"
                                    style={{ fontFamily: "'Cinzel', serif" }}
                                >
                                    {submitting ? (
                                        <div className="w-4 h-4 border-2 border-[#0b150d] border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <span>Send Message</span>
                                            <Send size={14} />
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </motion.section>

                {/* FOLLOW US SECTION */}
                <section className="max-w-4xl mx-auto text-center space-y-6">
                    <div className="space-y-2">
                        <p className="font-sans font-bold text-[10px] tracking-[0.3em] text-[#d8b66a] uppercase">
                            Stay Connected
                        </p>
                        <h2 className="font-sans font-bold text-2xl md:text-3xl text-white">
                            Follow Our Journey
                        </h2>
                        <p className="text-xs md:text-sm text-[#d6cca9]/70">
                            Recipes, harvest stories and new arrivals from the Goamogh kitchen.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
                        {SOCIAL_LINKS.map((social) => (
                            <a
                                key={social.name}
                                href={social.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`Goamogh on ${social.name}`}
                                className="group inline-flex items-center gap-3 px-6 py-3 rounded-full border border-[#d8b66a]/25 bg-[#0b150d]/60 text-[#efe3bf] hover:bg-[#d8b66a] hover:border-[#d8b66a] hover:text-[#0b150d] transition-colors duration-300"
                            >
                                <span className="text-[#d8b66a] group-hover:text-[#0b150d] transition-colors duration-300">
                                    {social.icon}
                                </span>
                                <span className="font-sans text-xs font-bold uppercase tracking-wider">
                                    {social.name}
                                </span>
                            </a>
                        ))}
                    </div>
                </section>

                {/* FAQ ACCORDION SECTION */}
                <section className="space-y-8 max-w-4xl mx-auto pt-8">
                    <div className="text-center space-y-2">
                        <h2 className="font-sans font-bold text-2xl md:text-3xl text-white">
                            Frequently Asked Questions
                        </h2>
                        <p className="text-xs md:text-sm text-[#d6cca9]/70">
                            Quick answers to common questions about Goamogh spices.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, idx) => (
                            <div
                                key={idx}
                                className="bg-[#0b150d] border border-[#d8b66a]/15 rounded-2xl overflow-hidden transition-colors duration-200"
                            >
                                <button
                                    onClick={() => toggleFaq(idx)}
                                    className="w-full px-6 py-5 flex justify-between items-center text-left text-white font-sans font-medium text-sm md:text-base hover:text-[#d8b66a] transition cursor-pointer"
                                >
                                    <span>{faq.question}</span>
                                    <ChevronDown
                                        size={18}
                                        className={`text-[#d8b66a] transition-transform duration-300 ${openFaq === idx ? 'rotate-180' : ''}`}
                                    />
                                </button>
                                <AnimatePresence initial={false}>
                                    {openFaq === idx && (
                                        <motion.div
                                            key="content"
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.35, ease: [0.04, 0.62, 0.23, 0.98] }}
                                            className="overflow-hidden border-t border-[#d8b66a]/10"
                                        >
                                            <div className="px-6 py-4 text-xs md:text-sm text-[#d6cca9]/80 font-sans leading-relaxed">
                                                {faq.answer}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </section>

            </div>
        </main>
    );
}

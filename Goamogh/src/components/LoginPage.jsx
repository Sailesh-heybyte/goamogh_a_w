"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { addToDbCart } from '../services/api';
import { useRouter } from 'next/navigation';
import { ArrowRight, Phone, Lock, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const { 
        user,
        token,
        requestOtp, 
        submitOtpVerify, 
        loginPendingItem,
        setLoginPendingItem,
        openLegalModal
    } = useAuth();
    const { reloadCart } = useCart();

    const [phone, setPhone] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [step, setStep] = useState('phone'); // 'phone' | 'otp'
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const [expiryTimer, setExpiryTimer] = useState(0);
    const [termsAccepted, setTermsAccepted] = useState(true);
    
    const countryCode = '+91'; // Default country code
    const otpInputRef = useRef(null);

    // Redirect to shop if user is already logged in
    useEffect(() => {
        if (user && token && step === 'phone') {
            if (!user.first_name) {
                router.push('/profile/complete');
            } else {
                router.push('/shop');
            }
        }
    }, [user, token, router, step]);

    // Count down both timers
    useEffect(() => {
        let interval = null;
        if (resendTimer > 0 || expiryTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
                setExpiryTimer((prev) => (prev > 0 ? prev - 1 : 0));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [resendTimer, expiryTimer]);

    // Auto-focus OTP input on step change
    useEffect(() => {
        if (step === 'otp' && otpInputRef.current) {
            const timeout = setTimeout(() => {
                if (otpInputRef.current) {
                    otpInputRef.current.focus();
                }
            }, 50);
            return () => clearTimeout(timeout);
        }
    }, [step]);

    // Auto-submit OTP when 4 digits are entered
    useEffect(() => {
        if (otpCode.length === 4 && !submitting && expiryTimer > 0) {
            verifyOtpCode();
        }
    }, [otpCode]);

    const parseAndValidatePhone = (rawPhone) => {
        // Remove all non-digit characters
        const clean = rawPhone.replace(/\D/g, '');

        // Strip the "91" prefix if it has 12 digits (e.g. 919987654321 -> 9987654321)
        let finalPhone = clean;
        if (clean.length === 12 && clean.startsWith('91')) {
            finalPhone = clean.substring(2);
        }

        // Validate that we have exactly 10 digits
        if (!/^\d{10}$/.test(finalPhone)) {
            return { valid: false, error: 'Please enter a valid 10-digit mobile number.' };
        }
        return { valid: true, phone: finalPhone };
    };

    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (!termsAccepted) {
            setError('Please accept Terms & Conditions and Privacy Policy to continue.');
            return;
        }

        const validation = parseAndValidatePhone(phone);
        if (!validation.valid) {
            setError(validation.error);
            return;
        }

        setError('');
        setSubmitting(true);

        try {
            const response = await requestOtp(validation.phone);
            if (response.success) {
                setPhone(validation.phone); // Save E.164 formatted number in state
                setStep('otp');
                setResendTimer(60); // 60 seconds cooldown
                setExpiryTimer(600); // 10 minutes OTP expiration
            } else {
                setError(response.message || 'Failed to send OTP.');
            }
        } catch (err) {
            setError(err.message || 'An error occurred. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const verifyOtpCode = async (e) => {
        if (e) e.preventDefault();
        if (submitting) return;

        const trimmedOtp = otpCode.trim();
        if (!/^\d{4}$/.test(trimmedOtp)) {
            setError('OTP must be exactly 4 digits.');
            return;
        }

        if (expiryTimer === 0) {
            setError('OTP has expired. Please resend verification code.');
            return;
        }

        setError('');
        setSubmitting(true);

        try {
            const validation = parseAndValidatePhone(phone);
            if (!validation.valid) {
                setError(validation.error);
                setSubmitting(false);
                return;
            }
            const response = await submitOtpVerify(validation.phone, trimmedOtp);
            if (response.success && response.data) {
                const verifiedUser = response.data.user || response.data;
                const verifiedToken = response.data.access_token;

                // Sync pending cart item if exists
                if (loginPendingItem) {
                    try {
                        const dbItem = {
                            id: loginPendingItem.id,
                            name: loginPendingItem.name,
                            subtitle: loginPendingItem.subtitle || '',
                            image: loginPendingItem.image,
                            weight: loginPendingItem.weight,
                            price: loginPendingItem.price,
                            quantity: loginPendingItem.quantity || 1,
                            origin: loginPendingItem.origin || 'India'
                        };
                        await addToDbCart(verifiedToken, dbItem, loginPendingItem.quantity || 1);
                        // Clear pending item state
                        setLoginPendingItem(null);
                        reloadCart();
                    } catch (cartErr) {
                        console.error('Failed to sync pending item to database cart:', cartErr);
                    }
                }

                // Redirect based on profile completeness
                if (!verifiedUser.first_name) {
                    router.push('/profile/complete');
                } else {
                    router.push('/shop');
                }
            } else {
                setError(response.message || 'OTP verification failed.');
            }
        } catch (err) {
            setError(err.message || 'Invalid or expired OTP. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendTimer > 0) return;
        setError('');
        setSubmitting(true);
        try {
            const response = await requestOtp(phone);
            if (response.success) {
                setResendTimer(60);
                setExpiryTimer(600);
                setOtpCode('');
            } else {
                setError(response.message || 'Failed to resend OTP.');
            }
        } catch (err) {
            setError(err.message || 'An error occurred.');
        } finally {
            setSubmitting(false);
        }
    };

    const formatMaskedPhone = () => {
        const clean = phone.replace(/\s+/g, '');
        if (clean.startsWith('+91')) {
            const rest = clean.slice(3);
            if (rest.length >= 7) {
                return `+91 ${rest.slice(0, 5)}*****${rest.slice(-2)}`;
            }
        }
        if (clean.length >= 7) {
            return `${clean.slice(0, 5)}*****${clean.slice(-2)}`;
        }
        return clean;
    };

    const formatResendTimer = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `Resend OTP in ${m}:${s.toString().padStart(2, '0')}`;
    };

    const formatExpiryTimer = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `OTP expires in ${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const displayPhone = phone.startsWith('+') && !phone.startsWith('+91') ? phone : phone.replace(/^\+91/, '');

    return (
        <main className="min-h-screen bg-[#1a2416] flex items-center justify-center pt-32 pb-20 px-4 md:px-8">
            <div className="max-w-md w-full relative">
                
                {/* Back to Shop link */}
                <Link
                    href="/shop"
                    className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-[#d8b66a] hover:text-[#efe3bf] transition duration-200 cursor-pointer mb-6"
                >
                    <ArrowLeft size={16} />
                    <span>Back to Shop</span>
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="relative rounded-[32px] bg-[#0b150d] overflow-hidden shadow-[0_24px_50px_rgba(0,0,0,0.5)] border border-[#d8b66a]/15 p-8 md:p-10"
                >
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[#d8b66a]/5 via-transparent to-transparent opacity-60 pointer-events-none" />

                    {step === 'phone' ? (
                        /* PHONE SUBMISSION VIEW */
                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-full bg-[#1a2416] border border-[#d8b66a]/15 flex items-center justify-center text-[#d8b66a] mb-6">
                                <Phone size={20} />
                            </div>
                            <h2 className="font-serif text-2xl md:text-3xl text-white mb-2 leading-tight" style={{ fontFamily: "'Cinzel', serif" }}>
                                Welcome to Goamogh
                            </h2>
                            <p className="text-[#d6cca9]/70 text-sm mb-6">Enter your mobile number to log in or register.</p>

                            <form onSubmit={handleSendOtp} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="block text-[10px] uppercase tracking-[0.2em] text-[#d8b66a] font-bold font-serif" style={{ fontFamily: "'Cinzel', serif" }}>
                                        Mobile Number
                                    </label>
                                    <div className="relative flex items-center">
                                        <span className="absolute left-4 text-[#efe3bf]/50 text-sm font-mono tracking-wider border-r border-[#d8b66a]/15 pr-3">+91</span>
                                        <input
                                            type="tel"
                                            required
                                            placeholder="9876543210"
                                            value={displayPhone}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val.startsWith('+')) {
                                                    setPhone(val.replace(/[^\d+]/g, ''));
                                                } else {
                                                    setPhone(val.replace(/\D/g, ''));
                                                }
                                            }}
                                            className="w-full bg-[#1a2416] border border-[#d8b66a]/20 rounded-xl pl-16 pr-4 py-3.5 text-white placeholder-[#d6cca9]/25 focus:border-[#d8b66a]/60 outline-none text-sm font-mono tracking-widest transition"
                                            disabled={submitting}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-start gap-2.5 pt-1 pb-1">
                                    <input
                                        type="checkbox"
                                        id="login_terms_accept"
                                        checked={termsAccepted}
                                        onChange={(e) => setTermsAccepted(e.target.checked)}
                                        className="mt-0.5 rounded border-[#d8b66a]/30 text-[#d8b66a] focus:ring-[#d8b66a] accent-[#d8b66a] cursor-pointer"
                                    />
                                    <label htmlFor="login_terms_accept" className="text-xs text-[#d6cca9]/80 cursor-pointer select-none leading-relaxed">
                                        Please accept <button type="button" onClick={() => openLegalModal('terms')} className="text-[#d8b66a] underline hover:text-white cursor-pointer">Terms & Conditions</button> and <button type="button" onClick={() => openLegalModal('privacy')} className="text-[#d8b66a] underline hover:text-white cursor-pointer">Privacy Policy</button>
                                    </label>
                                </div>

                                {error && (
                                    <p className="text-xs text-red-400 font-mono bg-red-500/10 border border-red-500/20 px-3.5 py-2.5 rounded-xl">{error}</p>
                                )}

                                <button
                                    type="submit"
                                    disabled={submitting || !termsAccepted}
                                    className="w-full bg-[#d8b66a] hover:bg-[#c5a47e] disabled:bg-[#d8b66a]/50 disabled:cursor-not-allowed text-[#0b150d] font-bold py-4 rounded-xl uppercase tracking-widest transition duration-300 flex items-center justify-center gap-2 text-xs shadow-lg shadow-[#d8b66a]/5 hover:shadow-[#d8b66a]/15 transform active:scale-95 disabled:active:scale-100 font-serif cursor-pointer"
                                    style={{ fontFamily: "'Cinzel', serif" }}
                                >
                                    {submitting ? (
                                        <div className="w-4 h-4 border-2 border-[#0b150d] border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <span>Send Verification Code</span>
                                            <ArrowRight size={14} />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    ) : (
                        /* OTP VERIFICATION VIEW */
                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-full bg-[#1a2416] border border-[#d8b66a]/15 flex items-center justify-center text-[#d8b66a] mb-6">
                                <Lock size={20} />
                            </div>
                            <h2 className="font-serif text-2xl md:text-3xl text-white mb-2 leading-tight" style={{ fontFamily: "'Cinzel', serif" }}>
                                Verification Code
                            </h2>
                            <p className="text-[#d6cca9]/70 text-sm mb-6">
                                We sent a 4-digit code to <span className="font-mono text-white">{formatMaskedPhone()}</span>
                            </p>

                            <form onSubmit={verifyOtpCode} className="space-y-5">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="block text-[10px] uppercase tracking-[0.2em] text-[#d8b66a] font-bold font-serif" style={{ fontFamily: "'Cinzel', serif" }}>
                                            Enter 4-Digit OTP
                                        </label>
                                        {expiryTimer > 0 && (
                                            <span className="text-[10px] font-mono text-[#d8b66a]/90 bg-[#1a2416] px-2 py-0.5 rounded border border-[#d8b66a]/10">
                                                {formatExpiryTimer(expiryTimer)}
                                            </span>
                                        )}
                                    </div>
                                    <input
                                        ref={otpInputRef}
                                        type="text"
                                        required
                                        maxLength={4}
                                        placeholder="••••"
                                        value={otpCode}
                                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                        className="w-full bg-[#1a2416] border border-[#d8b66a]/20 rounded-xl px-4 py-3.5 text-white placeholder-[#d6cca9]/25 focus:border-[#d8b66a]/60 outline-none text-center text-lg font-mono tracking-[0.5em] transition"
                                        disabled={submitting || expiryTimer === 0}
                                    />
                                    <p className="text-[10px] text-[#d6cca9]/45 font-mono text-center mt-1">
                                        {expiryTimer > 0 
                                            ? "Enter the 4-digit verification code sent to your phone number." 
                                            : "OTP has expired. Please click Resend Code."}
                                    </p>
                                </div>

                                {error && (
                                    <p className="text-xs text-red-400 font-mono bg-red-500/10 border border-red-500/20 px-3.5 py-2.5 rounded-xl text-center">{error}</p>
                                )}

                                <button
                                    type="submit"
                                    disabled={submitting || expiryTimer === 0}
                                    className="w-full bg-[#d8b66a] hover:bg-[#c5a47e] disabled:bg-[#d8b66a]/50 text-[#0b150d] font-bold py-4 rounded-xl uppercase tracking-widest transition duration-300 flex items-center justify-center gap-2 text-xs shadow-lg shadow-[#d8b66a]/5 hover:shadow-[#d8b66a]/15 transform active:scale-95 disabled:active:scale-100 font-serif cursor-pointer"
                                    style={{ fontFamily: "'Cinzel', serif" }}
                                >
                                    {submitting ? (
                                        <div className="w-4 h-4 border-2 border-[#0b150d] border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <span>Verify & Log In</span>
                                    )}
                                </button>
                            </form>

                            {/* Resend Cooldown triggers */}
                            <div className="text-center mt-6 text-xs">
                                {resendTimer > 0 ? (
                                    <p className="text-[#d6cca9]/50 font-mono">{formatResendTimer(resendTimer)}</p>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleResendOtp}
                                        className="text-[#d8b66a] hover:text-[#c5a47e] font-semibold underline transition cursor-pointer"
                                        disabled={submitting}
                                    >
                                        Resend Code
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </main>
    );
}

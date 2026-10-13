"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, Lock, Check, AlertCircle, Loader } from 'lucide-react';

export default function CompleteProfilePage() {
    const { user, token, loading, updateProfile, triggerLoginModal } = useAuth();
    const router = useRouter();

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: ''
    });

    const [saving, setSaving] = useState(false);
    const [validationError, setValidationError] = useState('');
    const [apiError, setApiError] = useState('');
    const [success, setSuccess] = useState(false);

    // Redirect checks
    useEffect(() => {
        if (!loading) {
            if (!user || !token) {
                // If not logged in at all, open login modal and redirect to home/shop
                triggerLoginModal();
                router.push('/shop');
            } else if (user.first_name) {
                // If profile is already complete, redirect to shop
                router.push('/shop');
            }
        }
    }, [user, token, loading, router, triggerLoginModal]);

    // Handle form input updates
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const validateForm = () => {
        if (!formData.first_name.trim()) {
            setValidationError('First name is required.');
            return false;
        }
        if (!formData.last_name.trim()) {
            setValidationError('Last name is required.');
            return false;
        }
        if (formData.email.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email.trim())) {
                setValidationError('Please enter a valid email address.');
                return false;
            }
        }
        setValidationError('');
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setApiError('');
        setValidationError('');

        if (!validateForm()) return;

        setSaving(true);
        try {
            const res = await updateProfile({
                first_name: formData.first_name.trim(),
                last_name: formData.last_name.trim(),
                email: formData.email.trim() || null
            });

            if (res && res.success) {
                setSuccess(true);
                // Wait briefly for a smooth transition animation, then redirect
                setTimeout(() => {
                    router.push('/shop');
                }, 1500);
            } else {
                setApiError(res?.message || 'Failed to update profile. Please try again.');
            }
        } catch (err) {
            console.error('Complete profile error:', err);
            setApiError(err.message || 'An unexpected error occurred. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading || !user || user.first_name) {
        return (
            <main className="min-h-screen bg-[#1a2416] flex items-center justify-center pt-20">
                <div className="text-center">
                    <Loader className="w-12 h-12 text-[#d8b66a] animate-spin mx-auto mb-4" />
                    <p className="text-[#efe3bf]/70 font-mono text-sm tracking-widest uppercase">Checking Session...</p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#1a2416] pt-32 pb-20 px-4 md:px-8 flex items-center justify-center">
            <div className="max-w-md w-full">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="relative rounded-[32px] bg-[#0b150d] overflow-hidden shadow-[0_24px_50px_rgba(0,0,0,0.5)] border border-[#d8b66a]/15 p-8 md:p-10"
                >
                    {/* Glowing radial background effect */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[#d8b66a]/5 via-transparent to-transparent opacity-60 pointer-events-none" />

                    {/* Header info */}
                    <div className="text-center relative z-10 mb-8">
                        <div className="w-16 h-16 rounded-full bg-[#d8b66a]/10 text-[#d8b66a] flex items-center justify-center mx-auto mb-5 border border-[#d8b66a]/20">
                            <User size={28} />
                        </div>
                        <h1 className="font-serif text-3xl text-[#f3e7c6] tracking-tight mb-2" style={{ fontFamily: "'Cinzel', serif" }}>
                            Complete Your Profile
                        </h1>
                        <p className="text-[#d6cca9]/75 text-sm leading-relaxed">
                            Welcome to Goamogh! Let us know your name and contact details to finalize your account setup.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                        {/* Alert message displays */}
                        <AnimatePresence mode="wait">
                            {validationError && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-xs flex items-center gap-3 font-mono"
                                >
                                    <AlertCircle size={16} className="text-red-400 shrink-0" />
                                    <span>{validationError}</span>
                                </motion.div>
                            )}

                            {apiError && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-xs flex items-center gap-3 font-mono"
                                >
                                    <AlertCircle size={16} className="text-red-400 shrink-0" />
                                    <span>{apiError}</span>
                                </motion.div>
                            )}

                            {success && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-200 text-xs flex items-center gap-3 font-mono"
                                >
                                    <Check size={16} className="text-green-400 shrink-0" />
                                    <span>Profile saved successfully! Redirecting to shop...</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* First Name Field */}
                        <div className="space-y-1.5">
                            <label className="block text-[10px] uppercase tracking-[0.2em] text-[#d8b66a] font-bold font-serif" style={{ fontFamily: "'Cinzel', serif" }}>
                                First Name *
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#efe3bf]/30 w-4.5 h-4.5" />
                                <input
                                    type="text"
                                    required
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleInputChange}
                                    disabled={saving || success}
                                    placeholder="Enter your first name"
                                    className="w-full bg-[#1a2416]/50 text-[#efe3bf] border border-[#d8b66a]/20 rounded-xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:border-[#d8b66a] focus:bg-[#1a2416] transition-all duration-300"
                                />
                            </div>
                        </div>

                        {/* Last Name Field */}
                        <div className="space-y-1.5">
                            <label className="block text-[10px] uppercase tracking-[0.2em] text-[#d8b66a] font-bold font-serif" style={{ fontFamily: "'Cinzel', serif" }}>
                                Last Name *
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#efe3bf]/30 w-4.5 h-4.5" />
                                <input
                                    type="text"
                                    required
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleInputChange}
                                    disabled={saving || success}
                                    placeholder="Enter your last name"
                                    className="w-full bg-[#1a2416]/50 text-[#efe3bf] border border-[#d8b66a]/20 rounded-xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:border-[#d8b66a] focus:bg-[#1a2416] transition-all duration-300"
                                />
                            </div>
                        </div>

                        {/* Email Address Field (Optional) */}
                        <div className="space-y-1.5">
                            <label className="block text-[10px] uppercase tracking-[0.2em] text-[#d8b66a] font-bold font-serif" style={{ fontFamily: "'Cinzel', serif" }}>
                                Email Address (Optional)
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#efe3bf]/30 w-4.5 h-4.5" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    disabled={saving || success}
                                    placeholder="Enter your email address"
                                    className="w-full bg-[#1a2416]/50 text-[#efe3bf] border border-[#d8b66a]/20 rounded-xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:border-[#d8b66a] focus:bg-[#1a2416] transition-all duration-300"
                                />
                            </div>
                        </div>

                        {/* Phone field (Read Only) */}
                        <div className="space-y-1.5 opacity-70">
                            <div className="flex justify-between items-center">
                                <label className="block text-[10px] uppercase tracking-[0.2em] text-[#d8b66a] font-bold font-serif" style={{ fontFamily: "'Cinzel', serif" }}>
                                    Phone Number
                                </label>
                                <span className="text-[8px] text-[#efe3bf]/30 uppercase font-mono tracking-wider font-semibold">Locked</span>
                            </div>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#efe3bf]/30 w-4.5 h-4.5" />
                                <input
                                    type="text"
                                    value={user?.phone || ''}
                                    disabled
                                    className="w-full bg-[#11180f]/20 text-[#efe3bf]/40 border border-white/5 rounded-xl pl-12 pr-4 py-3.5 text-sm cursor-not-allowed font-mono"
                                />
                                <Lock size={12} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#efe3bf]/30" />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={saving || success}
                                className="w-full bg-[#d8b66a] hover:bg-[#c5a47e] disabled:bg-[#d8b66a]/50 text-[#0b150d] font-bold py-4 rounded-xl uppercase tracking-widest transition duration-300 font-serif text-[11px] shadow-lg shadow-[#d8b66a]/5 hover:shadow-[#d8b66a]/15 transform active:scale-95 disabled:active:scale-100 flex items-center justify-center gap-2 cursor-pointer"
                                style={{ fontFamily: "'Cinzel', serif" }}
                            >
                                {saving ? (
                                    <>
                                        <Loader className="w-4 h-4 animate-spin text-[#0b150d]" />
                                        <span>Saving Profile...</span>
                                    </>
                                ) : (
                                    <span>Complete Registration</span>
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </main>
    );
}

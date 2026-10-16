import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, CheckCircle2, AlertCircle, Loader } from 'lucide-react';
import { submitOrderFeedback } from '../../api/api';

export default function OrderFeedbackModal({ orderId, orderNumber, onSuccess, onClose }) {
    const [rating, setRating] = useState(5);
    const [hoverRating, setHoverRating] = useState(0);
    const [comments, setComments] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating < 1 || rating > 5) {
            setErrorMsg('Please select a star rating between 1 and 5.');
            return;
        }
        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const token =
                typeof window !== 'undefined'
                    ? localStorage.getItem('goamogh_access_token') || localStorage.getItem('customer_token')
                    : null;

            const res = await submitOrderFeedback(token, orderId, {
                rating: Number(rating),
                comments: comments.trim() ? comments.trim() : null,
            });

            if (res && res.success !== false) {
                const msg = res.message || 'Thank you for your feedback!';
                setSuccessMsg(msg);
                setTimeout(() => {
                    if (onSuccess) onSuccess();
                    if (onClose) onClose();
                }, 1800);
            } else {
                setErrorMsg(res?.detail || res?.message || 'Failed to submit review.');
            }
        } catch (err) {
            console.error('Feedback submission error:', err);
            setErrorMsg(err.message || 'Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <div
                data-lenis-prevent
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="relative w-full max-w-lg rounded-2xl p-8 border shadow-2xl overflow-hidden"
                    style={{
                        background: '#0D1F15',
                        borderColor: '#1F382A',
                        color: '#FFFFFF',
                    }}
                >
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 text-[#A0B0A5] hover:text-[#E6C577] transition-colors rounded-full hover:bg-[#14291D]"
                            aria-label="Close feedback modal"
                        >
                            <X size={20} />
                        </button>
                    )}

                    <div className="text-center mb-6">
                        <h3
                            className="text-xl font-bold tracking-wider uppercase mb-1"
                            style={{ color: '#E6C577', fontFamily: "'Cinzel', serif" }}
                        >
                            HOW WAS YOUR EXPERIENCE?
                        </h3>
                        {orderNumber && (
                            <p className="text-xs uppercase tracking-widest font-mono" style={{ color: '#A0B0A5' }}>
                                Order #{orderNumber}
                            </p>
                        )}
                    </div>

                    {errorMsg && (
                        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2 font-mono">
                            <AlertCircle size={16} className="shrink-0 text-red-400" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {successMsg && (
                        <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2 font-mono">
                            <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
                            <span>{successMsg}</span>
                        </div>
                    )}

                    <div className="flex justify-center items-center gap-3 my-6 text-3xl">
                        {[1, 2, 3, 4, 5].map((star) => {
                            const active = star <= (hoverRating || rating);
                            return (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    className="transition-transform transform hover:scale-125 focus:outline-none cursor-pointer"
                                    style={{
                                        color: active ? '#E6C577' : '#334D3D',
                                    }}
                                    aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                                >
                                    <Star size={34} fill={active ? '#E6C577' : 'transparent'} strokeWidth={1.5} />
                                </button>
                            );
                        })}
                    </div>

                    <div className="text-center -mt-3 mb-6">
                        <span className="text-[11px] font-mono uppercase tracking-widest text-[#E6C577]">
                            {rating === 5 && '🌟 Exceptional!'}
                            {rating === 4 && '👍 Very Good!'}
                            {rating === 3 && '👌 Good'}
                            {rating === 2 && '😐 Fair'}
                            {rating === 1 && '👎 Poor'}
                        </span>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest mb-1.5 font-mono text-[#A0B0A5]">
                                Your Feedback (Optional)
                            </label>
                            <textarea
                                rows={4}
                                placeholder="Share your thoughts about product quality, packaging, or delivery..."
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                disabled={loading || Boolean(successMsg)}
                                className="w-full text-sm font-sans focus:outline-none focus:border-[#E6C577] transition duration-200"
                                style={{
                                    background: '#14291D',
                                    border: '1px solid #284735',
                                    borderRadius: '8px',
                                    color: '#E0E0E0',
                                    padding: '12px',
                                    resize: 'vertical',
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || Boolean(successMsg)}
                            className="w-full font-bold transition duration-300 uppercase tracking-widest text-xs flex items-center justify-center gap-2 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            style={{
                                marginTop: '16px',
                                background: '#E6C577',
                                color: '#0A1810',
                                padding: '14px',
                                borderRadius: '8px',
                                border: 'none',
                            }}
                        >
                            {loading ? (
                                <>
                                    <Loader size={16} className="animate-spin text-[#0A1810]" />
                                    <span>SUBMITTING...</span>
                                </>
                            ) : successMsg ? (
                                <span>SUBMITTED! ⭐</span>
                            ) : (
                                <span>SUBMIT REVIEW ⭐</span>
                            )}
                        </button>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

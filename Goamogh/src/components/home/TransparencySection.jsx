import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, FileText } from 'lucide-react';
import Link from 'next/link';

export default function TransparencySection() {
    const [cardRotation, setCardRotation] = useState({ x: 0, y: 0 });

    const cardRef = useRef(null);
    const containerRef = useRef(null);

    const features = [
        {
            id: 'moisture',
            title: 'Moisture Control',
            description: 'Optimized to prevent degradation and mold growth.',
        },
        {
            id: 'purity',
            title: 'Purity Testing',
            description: 'Verified absence of fillers, dyes, or synthetic additives.',
        },
        {
            id: 'consistency',
            title: 'Consistency Analysis',
            description: 'Uniform essential oil content across every batch.',
        },
    ];

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        setCardRotation({ x: y * 5, y: -x * 5 });
    };

    const handleMouseLeave = () => {
        setCardRotation({ x: 0, y: 0 });
    };

    return (
        <section
            id="transparency"
            ref={containerRef}
            className="relative w-full scroll-mt-32 py-24 px-4 overflow-hidden md:px-8 lg:px-10"
            style={{ backgroundColor: '#0a1209' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <div className="absolute inset-0 opacity-30">
                <div
                    className="absolute inset-0"
                    style={{
                        background: 'radial-gradient(circle at 20% 50%, rgba(197, 164, 126, 0.1) 0%, transparent 50%)',
                    }}
                />
            </div>

            <div className="relative z-10 mx-auto grid max-w-[110rem] grid-cols-1 items-center gap-8 md:gap-14 lg:grid-cols-2">
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="mb-8">
                        <p className="mb-4 text-xs md:text-sm font-bold tracking-[0.18em]" style={{ color: '#c5a47e' }}>
                            UNCOMPROMISED STANDARDS
                        </p>
                        <h2
                            className="mb-6 font-serif text-[clamp(2rem,5vw,5.2rem)] font-bold leading-[1.06]"
                            style={{ color: '#f5f5f5' }}
                        >
                            Quality Should Be <em style={{ fontStyle: 'normal', color: '#c5a47e' }}>Measurable</em>
                        </h2>
                        <p className="mb-4 max-w-3xl text-base md:text-xl leading-relaxed font-light text-[#c5a47e]">
                            Good intentions don't make good spices. Standards do.
                        </p>
                        <p
                            className="mb-8 max-w-3xl text-sm md:text-lg leading-relaxed font-light"
                            style={{ color: 'rgba(245, 245, 245, 0.8)' }}
                        >
                            Every batch is subject to quality checks designed to verify its safety, purity and
                            consistency—before it makes its way to your kitchen. No vague promises. No hidden
                            behind-the-label assurances. Just the numbers, the results and the standard we hold
                            ourselves to.
                        </p>
                    </div>

                    <div className="space-y-5 md:space-y-7">
                        {features.map((feature, idx) => (
                            <motion.div
                                key={feature.id}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1, duration: 0.6 }}
                                className="group"
                            >
                                <div className="flex gap-4 items-start">
                                    <div style={{ color: '#c5a47e' }}>
                                        <CheckCircle2 size={24} className="md:w-7 md:h-7" />
                                    </div>
                                    <div>
                                        <h3 className="mb-1 text-xl md:text-2xl font-semibold text-white">
                                            {feature.title}
                                        </h3>
                                        <p className="text-sm md:text-lg" style={{ color: 'rgba(245, 245, 245, 0.7)' }}>
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-block mt-10"
                    >
                        <Link
                            href="/certificates"
                            className="inline-block rounded-xl border-2 px-9 py-4 text-sm md:text-base font-semibold uppercase tracking-wider transition-all duration-300"
                            style={{
                                borderColor: '#c5a47e',
                                color: '#c5a47e',
                                backgroundColor: 'transparent',
                            }}
                        >
                            View All Certificates
                        </Link>
                    </motion.div>
                </motion.div>

                <motion.div
                    ref={cardRef}
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="perspective lg:pl-4"
                    style={{
                        transformStyle: 'preserve-3d',
                        transform: `rotateX(${cardRotation.x}deg) rotateY(${cardRotation.y}deg)`,
                        transition: 'transform 0.1s ease-out',
                    }}
                >
                    <div
                        className="relative overflow-hidden rounded-2xl shadow-2xl p-6 md:p-11"
                        style={{
                            background: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                        }}
                    >
                        <div className="mb-6">
                            <h3 className="text-center text-xl md:text-4xl font-bold" style={{ color: '#1a1a1a' }}>
                                CERTIFICATE OF ANALYSIS
                            </h3>
                        </div>

                        <div className="py-4 space-y-5 text-center">
                            <div className="flex items-center justify-center gap-2">
                                <FileText size={28} className="md:w-8 md:h-8" style={{ color: '#c5a47e' }} />
                            </div>
                            <div>
                                <h4
                                    className="text-lg md:text-2xl font-bold leading-snug px-2"
                                    style={{ color: '#1a1a1a' }}
                                >
                                    Batch-wise Lab Reports
                                </h4>
                                <p className="mt-2 text-xs md:text-sm font-medium" style={{ color: '#666' }}>
                                    Moisture, purity and consistency results for our batches.
                                </p>
                            </div>
                            <div className="pt-2">
                                <Link
                                    href="/certificates"
                                    className="inline-flex items-center gap-1.5 rounded-lg border-2 px-5 py-2 text-xs md:text-sm font-semibold uppercase tracking-wider transition-all duration-300 hover:scale-105 active:scale-95"
                                    style={{
                                        borderColor: '#c5a47e',
                                        color: '#c5a47e',
                                        backgroundColor: 'transparent',
                                    }}
                                >
                                    View Certificates →
                                </Link>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 pt-5 mt-4 text-center">
                            <p className="text-xs md:text-sm font-medium" style={{ color: '#666' }}>
                                Certificates open as PDF documents
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

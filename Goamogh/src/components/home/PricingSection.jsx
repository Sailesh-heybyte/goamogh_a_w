import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import TransparencySection from './TransparencySection';
import BentoGrid from './BentoGrid';
import millingBg from '../../assets/images/about/heritage_grinding.webp';

export default function PricingSection() {
    const parallaxRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: parallaxRef,
        offset: ["start end", "end start"]
    });
    const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);
    const opacity = useTransform(scrollYProgress, [0.3, 0.5, 0.7], [0, 1, 0]);

    return (
        <div className="bg-[#0c120b] overflow-hidden">
            {/* Manifesto Section */}
            <section className="relative px-6 py-32 md:py-48 flex flex-col items-center text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    className="max-w-5xl"
                >
                    <p className="text-[11px] tracking-[0.5em] uppercase eyebrow-gold mb-8">Brand Philosophy</p>
                    <h2 className="font-display text-[clamp(2.5rem,6vw,6rem)] leading-[0.95] tracking-[-0.04em] text-[#f3e7c6] mb-8">
                        When Quality Leads, <br /> Flavor Follows.
                    </h2>
                    <p className="text-base md:text-xl text-[#efe3bf]/85 font-light leading-relaxed max-w-3xl mx-auto">
                        There’s a quiet confidence in doing things the right way. Choosing quality ingredients, processing them with care, leaving out what doesn’t belong, and letting the spice speak for itself.
                    </p>
                    <p className="mt-4 text-sm md:text-base text-[#d9b86d] font-serif">
                        Simple. Pure. Full of character. Just as good spice should be.
                    </p>
                </motion.div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-48 bg-gradient-to-b from-[#d9b86d]/0 via-[#d9b86d]/40 to-[#d9b86d]/0" />
            </section>

            {/* Bento Grid Section */}
            <BentoGrid />

            {/* Super Editorial Handpounding Section */}
            <section ref={parallaxRef} className="relative h-[100vh] md:h-[160vh] flex flex-col items-center bg-[#0c120b] -mb-px z-0">
                <div className="sticky top-0 h-screen w-full overflow-hidden">
                    <motion.div style={{ y }} className="absolute inset-x-0 -top-[12%] -bottom-[12%] will-change-transform">
                        <img 
                            src={millingBg.src} 
                            alt="Goamogh Heritage Grinding" 
                            className="w-full h-full object-cover object-[center_30%]"
                        />
                    </motion.div>
                    
                    {/* Professional Vignette & Overlays */}
                    <div className="absolute inset-0 bg-[#0c120b]/30" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#0c120b_90%)] opacity-80" />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#0c120b] via-transparent to-[#0c120b] 100%" />
                    
                    <motion.div 
                        style={{ opacity }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                        <div className="max-w-6xl px-6 md:px-8 w-full">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-20 items-center md:items-end">
                                <div>
                                    <h3 className="font-display text-[clamp(2.2rem,7vw,6.5rem)] text-[#f3e7c6] leading-[0.9] mb-4 md:mb-8 mix-blend-difference">
                                        The Cadence <br /> of Stone
                                    </h3>
                                    <p className="text-lg md:text-2xl text-[#d9b86d] font-serif mb-4">
                                        Good Spice Has a Rhythm.
                                    </p>
                                    <div className="w-24 h-px bg-[#d9b86d] mb-6 md:mb-12" />
                                </div>
                                <div className="flex flex-col gap-6 md:gap-8 pb-6 md:pb-12">
                                    <div className="max-w-[36ch]">
                                        <p className="text-[11px] tracking-[0.4em] uppercase eyebrow-gold mb-2 md:mb-3">Stone Meets Spice</p>
                                        <p className="text-[14px] md:text-[15px] text-[#efe3bf]/90 leading-relaxed font-light">
                                            Slowly. Steadily. Naturally. Inspired by traditional stone-grinding techniques that help preserve nutrients and essential oils.
                                        </p>
                                    </div>
                                    <div className="max-w-[36ch]">
                                        <p className="text-[11px] tracking-[0.4em] uppercase eyebrow-gold mb-2 md:mb-3">Slowly Crafted</p>
                                        <p className="text-[14px] md:text-[15px] text-[#efe3bf]/90 leading-relaxed font-light">
                                            Patience unlocks the fullest expression of flavor. The aroma stays richer, the color stays vibrant, and the character remains true to the spice.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Transparency Section - Relative position and higher z-index to mask the gap */}
            <motion.section
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative z-10 w-full bg-[#0c120b] py-16 md:py-24 px-4 md:px-8"
            >
                <TransparencySection />
            </motion.section>
        </div>
    );
}


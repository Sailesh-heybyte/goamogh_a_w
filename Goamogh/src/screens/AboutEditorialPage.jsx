"use client";
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

import aboutDrying from '../assets/images/about/drying.webp';
import aboutMacro from '../assets/images/about/macro.webp';
import aboutMilling from '../assets/images/about/heritage_grinding.webp';
import aboutLab from '../assets/images/about/lab.webp';
import aboutJar from '../assets/images/home/goamogh_jar_final.webp';

function AbstractCardArt({ tone = 'red', image }) {
  const palettes = {
    red: 'from-[#0d120b] via-[#182015] to-[#10170d]',
    orange: 'from-[#11180f] via-[#1f2a19] to-[#0d120b]',
    blue: 'from-[#1a2416] via-[#24311f] to-[#11180f]'
  };

  return (
    <div className={`absolute inset-0 bg-gradient-to-br ${palettes[tone]}`}>
      {image && (
        <img 
          src={image} 
          alt="Artistic spice detail" 
          className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-luminosity"
        />
      )}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `
            radial-gradient(circle at 18% 24%, rgba(217, 184, 109, 0.42) 0 5%, transparent 6%),
            radial-gradient(circle at 72% 20%, rgba(217, 184, 109, 0.12) 0 6%, transparent 7%),
            radial-gradient(circle at 64% 74%, rgba(205, 164, 77, 0.18) 0 8%, transparent 9%)
          `,
          backgroundSize: '100% 100%'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#11180f] via-transparent to-transparent opacity-80" />
    </div>
  );
}

function ValueCard({ title, text, tone = 'gold' }) {
  const gradient =
    tone === 'blue'
      ? 'from-[#d7f0ff]/20 via-[#8fc5ff]/10 to-transparent'
      : tone === 'peach'
        ? 'from-[#ffd8a9]/20 via-[#f8b35c]/10 to-transparent'
        : tone === 'sand'
          ? 'from-[#f0dec1]/20 via-[#d8b07c]/10 to-transparent'
          : 'from-[#f3e4be]/20 via-[#dbb56c]/10 to-transparent';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group p-8 bg-[#11180f]/50 border border-white/5 hover:border-[#d9b86d]/30 transition-all duration-500"
    >
      <div className="relative h-1 w-12 bg-[#d9b86d] mb-8 group-hover:w-full transition-all duration-700" />
      <h3 className="font-display text-[24px] leading-[1.1] text-[#f3e7c6] mb-4">{title}</h3>
      <p className="text-[14px] leading-relaxed text-[#efe3bf]/70 max-w-[30ch]">{text}</p>
    </motion.div>
  );
}

export default function AboutEditorialPage() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="bg-[#0c120b] text-[#efe3bf] overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] md:min-h-screen flex flex-col justify-between pt-28 md:pt-36 pb-12 md:pb-20 px-4 sm:px-6 md:px-10 overflow-hidden bg-[#0c120b]">
        {/* Desktop Full-Bleed Background Artwork (Hidden on Mobile) */}
        <div className="hidden md:block absolute inset-0 z-0">
          <img 
            src="/images/about-hero.webp" 
            alt="Go Amogh Heritage Kitchen" 
            className="w-full h-full object-cover scale-105"
          />
          <div className="absolute inset-0 bg-[#0c120b]/35" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0c120b]/80 via-transparent to-[#0c120b]" />
        </div>

        {/* Ambient Glow & Subtle Texture */}
        <div className="absolute inset-0 opacity-30 pointer-events-none z-0">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#d9b86d]/15 blur-[120px] rounded-full" />
        </div>

        {/* Hero Header Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[11px] tracking-[0.35em] uppercase text-[#ead89b] mb-4 md:mb-6 font-mono"
          >
            EST. 2025 — GOAMOGH
          </motion.p>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-[1.1] tracking-[-0.015em] text-[#fff4d6] max-w-[22ch] mx-auto"
          >
            “Spices made for kitchens that care about flavor”
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mx-auto mt-4 md:mt-6 max-w-2xl text-xs sm:text-sm md:text-base leading-relaxed text-[#f0e2ba]/85 font-light"
          >
            We believe a good spice should do more than color a dish. It should bring aroma to the first tempering, depth to the last spoonful, and a little more character to everyday food. That is what we set out to SERVE at Goamogh.
          </motion.p>
        </div>

        {/* Mobile Artwork Showcase Card */}
        <div className="relative z-10 md:hidden mt-8 max-w-xl mx-auto w-full">
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden border border-[#d9b86d]/30 shadow-2xl bg-[#11180f]"
          >
            <img 
              src="/images/about-hero.webp" 
              alt="Go Amogh Heritage Artwork" 
              className="w-full h-full object-contain p-1 bg-[#0c120b]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c120b]/80 via-transparent to-transparent pointer-events-none" />
          </motion.div>
        </div>

        {/* Bottom Fade Gradient into Methodology Section */}
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#0c120b] to-transparent pointer-events-none z-10" />
      </section>

      {/* Methodology & Features Section */}
      <section className="px-4 sm:px-6 md:px-10 pt-24 pb-32">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-end text-center md:text-left mb-12 border-b border-white/5 pb-8">
            <div className="w-full md:w-auto flex flex-col items-center md:items-start">
              <p className="text-[10px] tracking-[0.4em] uppercase eyebrow-gold mb-3">OUR METHODOLOGY</p>
              <h2 className="text-[28px] md:text-[42px] font-display text-[#f3e7c6]">THE ART OF THE GRIND</h2>
            </div>
            <p className="text-[13px] text-[#efe3bf]/80 max-w-[44ch] mt-4 md:mt-0 text-center md:text-left mx-auto md:mx-0 font-light leading-relaxed">
              Where tradition meets precision. Indian kitchens have always known that how you treat a spice matters. We pair that wisdom with careful sourcing & controlled processing. Traditional thinking. Modern control. Better spice.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.article 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative min-h-[350px] md:min-h-[450px] overflow-hidden bg-[#11180f] border border-white/5 group"
            >
              <AbstractCardArt tone="orange" image={aboutDrying.src} />
              <div className="absolute inset-0 z-10 p-6 md:p-12 flex flex-col justify-end">
                <span className="text-[10px] tracking-[0.3em] uppercase eyebrow-gold mb-2 block">CARE IN EVERY STEP</span>
                <h3 className="text-xl md:text-[32px] max-w-[20ch] text-balance leading-tight text-[#f3e7c6] font-light mb-3">Let the spice keep its character.</h3>
                <p className="text-[13px] md:text-[14px] md:min-h-[8.2em] leading-relaxed text-[#efe3bf]/80 max-w-[36ch] text-pretty">
                  A spice is at its best when its natural aroma, color and flavor are given the right conditions to shine. Careful handling, considered grinding and attention to detail.
                </p>
              </div>
            </motion.article>

            <motion.article 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative min-h-[350px] md:min-h-[450px] overflow-hidden bg-[#11180f] border border-white/5 group"
            >
              <AbstractCardArt tone="blue" image={aboutMacro.src} />
              <div className="absolute inset-0 z-10 p-6 md:p-12 flex flex-col justify-end">
                <span className="text-[10px] tracking-[0.3em] uppercase eyebrow-gold mb-2 block">KNOW YOUR SPICE</span>
                <h3 className="text-xl md:text-[32px] max-w-[20ch] text-balance leading-tight text-[#f3e7c6] font-light mb-3">From where it grows to where it goes.</h3>
                <p className="text-[13px] md:text-[14px] md:min-h-[8.2em] leading-relaxed text-[#efe3bf]/80 max-w-[36ch] text-pretty">
                  Good sourcing begins with knowing the ingredient. Origin, harvest and quality so what starts with raw spice ends with confidence in your kitchen. Traceability isn't a buzzword.
                </p>
              </div>
            </motion.article>
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="px-6 md:px-10 py-32 md:py-48 bg-[#11180f]/30">
        <div className="mx-auto max-w-6xl">
          <motion.h2 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="font-display text-center text-[clamp(1.8rem,5.5vw,5rem)] leading-[0.95] tracking-[-0.04em] text-[#f3e7c6]"
          >
            “We don't make spices for the shelf.
            <br />
            We make them for the moment 
            <br />
            they hit the pan.”
          </motion.h2>
        </div>
      </section>

      {/* Heritage, Quality & Packaging Grid */}
      <section className="px-4 sm:px-6 md:px-10 py-32">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <article className="flex flex-col">
              <div className="aspect-[4/5] bg-[#0d120b] relative overflow-hidden border border-white/5 mb-8 group">
                <img 
                  src={aboutMilling.src} 
                  alt="Old kitchen wisdom" 
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-all duration-700" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c120b] via-transparent to-transparent opacity-40" />
                <div className="absolute bottom-8 left-8 right-8">
                  <h3 className="text-[11px] tracking-[0.3em] uppercase eyebrow-gold mb-2">HERITAGE</h3>
                  <p className="text-[18px] text-[#f3e7c6] font-light">The wisdom of the old kitchen.</p>
                </div>
              </div>
              <p className="text-[13px] leading-relaxed text-[#efe3bf]/70">
                Before spices came in measured packets, they were selected by hand, dried, ground, stored and used with instinct. Goamogh draws from those traditions—because progress doesn't mean forgetting our ROOTS.
              </p>
            </article>

            <article className="flex flex-col md:translate-y-16">
              <div className="aspect-[4/5] bg-[#0d120b] relative overflow-hidden border border-white/5 mb-8 group">
                <img 
                  src={aboutLab.src} 
                  alt="Quality control laboratory" 
                  className="absolute inset-0 w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:scale-110 group-hover:opacity-100 transition-all duration-700" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c120b] to-transparent opacity-60" />
                <div className="absolute bottom-8 left-8 right-8">
                  <h3 className="text-[11px] tracking-[0.3em] uppercase eyebrow-gold mb-2">QUALITY / LABORATORY</h3>
                  <p className="text-[18px] text-[#f3e7c6] font-light">Modern Precision</p>
                </div>
              </div>
              <p className="text-[13px] leading-relaxed text-[#efe3bf]/70">
                Tradition gives us the direction. Science gives us the check. Laboratory testing and defined checks help ensure every product meets the standard we set for it.
              </p>
            </article>

            <article className="flex flex-col">
              <div className="aspect-[4/5] bg-[#0d120b] relative overflow-hidden border border-white/5 mb-8 group">
                <img 
                  src={aboutJar.src} 
                  alt="From our hands to yours" 
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-all duration-700" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c120b] via-transparent to-transparent opacity-40" />
                <div className="absolute bottom-8 left-8 right-8">
                  <h3 className="text-[11px] tracking-[0.3em] uppercase eyebrow-gold mb-2">PACKAGING</h3>
                  <p className="text-[18px] text-[#f3e7c6] font-light">From Our Hands to Yours</p>
                </div>
              </div>
              <p className="text-[13px] leading-relaxed text-[#efe3bf]/70">
                Every detail has a purpose. We pay attention beyond the spice itself—from processing to packaging—because the journey doesn't end when the spice is made.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="px-4 sm:px-6 md:px-10 py-32 bg-[#0d120b]">
        <div className="mx-auto max-w-[1400px] mb-20">
          <div className="max-w-3xl">
            <p className="text-[11px] tracking-[0.4em] uppercase eyebrow-gold mb-6">OUR VALUES</p>
            <h2 className="font-display text-[clamp(2.5rem,5vw,5rem)] leading-[1] text-[#f3e7c6]">
              Four things we don't compromise on.
            </h2>
          </div>
        </div>

        <div className="mx-auto max-w-[1400px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ValueCard title="01 — THE INGREDIENT" text="Start with something worth putting in the packet." />
          <ValueCard title="02 — THE PROCESS" text="Treat every spice with the care it deserves." />
          <ValueCard title="03 — THE PROOF" text="Make quality measurable, not merely promised." />
          <ValueCard title="04 — THE PURPOSE" text="Make spices for real food, real kitchens and everyday cooking." />
        </div>
      </section>

      {/* Closing CTA Section */}
      <section className="px-6 md:px-8 pb-32 pt-20 text-center">
        <div className="mx-auto max-w-5xl">
          <p className="text-[11px] tracking-[0.4em] uppercase eyebrow-gold mb-4">CLOSING STORY</p>
          <h2 className="font-display text-[clamp(2.2rem,4.5vw,4.5rem)] leading-[1.1] tracking-[-0.04em] mb-6 text-[#f3e7c6]">
            From our spice story to yours.
          </h2>
          <p className="text-sm md:text-lg text-[#efe3bf]/80 max-w-2xl mx-auto mb-10 font-light">
            Every kitchen has its own way of cooking. A pinch here. A little more there. A recipe remembered without ever being written down. We simply want to give those kitchens better spices to work with.
          </p>
          <p className="text-base md:text-xl font-serif text-[#d9b86d] mb-12">
            Goamogh — made with care, meant for the kitchen.
          </p>
          <motion.a 
            href="/shop"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-6 rounded-full border border-[#d9b86d]/40 px-10 py-4 text-[11px] tracking-[0.3em] uppercase text-[#f3e7c6] hover:bg-[#d9b86d] hover:text-[#0c120b] transition-all duration-500 group"
          >
            <span>Explore Our Spices</span>
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#d9b86d] text-[#0c120b] group-hover:bg-[#0c120b] group-hover:text-[#d9b86d] transition-colors duration-500">→</span>
          </motion.a>
        </div>
      </section>

    </div>
  );
}

import { motion } from "framer-motion";
import heritageJar from "../assets/images/home/goamogh_jar_final.webp";
import pouches from "../assets/images/home/pouches.webp";
import bentoPowder from "../assets/images/home/bento_powder.webp";

export default function BentoGrid() {
  return (
    <section className="px-4 py-16 md:py-32 max-w-[1400px] mx-auto bg-transparent">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto md:h-[900px]">
        
        {/* Main Product Card - Now with actual Heritage Jar */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="md:col-span-7 relative h-[380px] md:h-auto group overflow-hidden bg-[#11180f] border border-white/5"
        >
          <img 
            src={heritageJar.src} 
            alt="Goamogh Heritage Jar" 
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0c120b]/90 via-[#0c120b]/55 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c120b]/80 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 text-on-image">
            <p className="text-[11px] tracking-[0.4em] uppercase eyebrow-gold mb-3 md:mb-4">The Standard</p>
            <h3 className="font-display text-[28px] md:text-[48px] text-[#f3e7c6] leading-none mb-3 md:mb-4">
              Goamogh <br /> Heritage Jars
            </h3>
            <p className="text-[13px] md:text-[14px] text-[#efe3bf]/90 max-w-[30ch]">
              Smoked Chili & Single-Origin blends, preserved in ultraviolet-blocking glass and artisanal wood.
            </p>
          </div>
        </motion.div>

        {/* Right Column */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="md:col-span-5 flex flex-col gap-6"
        >
          {/* Potency Card / Current Harvest */}
          <div className="h-[280px] md:h-1/2 relative bg-[#1a2416] p-6 md:p-10 border border-white/5 overflow-hidden flex flex-col justify-between group">
             <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                    <span className="w-2 h-2 rounded-full bg-[#d9b86d] animate-pulse" />
                    <h4 className="text-[11px] tracking-[0.3em] uppercase eyebrow-gold">The Current Harvest</h4>
                </div>
                <h5 className="font-display text-xl md:text-2xl text-[#f3e7c6] mb-2">
                    Where Quality Begins
                </h5>
             </div>
             <p className="relative z-10 text-[13px] text-[#efe3bf]/80 leading-relaxed max-w-[32ch]">
                We select each harvest for its aroma, color, character and suitability for the kitchen—not simply because it is available.
             </p>
             <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-[#d9b86d]/5 rounded-full blur-3xl group-hover:bg-[#d9b86d]/10 transition-all duration-500" />
          </div>

          {/* Actual Pouch Product Card / Retail Collection */}
          <div className="h-[240px] md:h-1/2 relative bg-[#0d120b] overflow-hidden border border-white/5 group">
            <img 
                src={pouches.src} 
                alt="Goamogh Pouches" 
                className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-90" />
            <div className="absolute bottom-6 left-6 right-6 text-on-image">
                <p className="text-[11px] tracking-[0.4em] uppercase eyebrow-gold mb-1">Retail Collection</p>
                <p className="text-base font-display text-[#f3e7c6]">Good Spice Belongs in Everyday Food.</p>
                <p className="text-[12px] text-[#efe3bf]/90 mt-1">From the first tempering to the last pinch, spices made to live in your kitchen forever.</p>
            </div>
          </div>
        </motion.div>

        {/* Bottom Wide Card - Refined Standards Band */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="md:col-span-12 relative py-10 md:py-16 bg-[#11180f] border border-white/5 flex items-center justify-center overflow-hidden group"
        >
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-center gap-10 md:gap-20 w-full max-w-5xl px-6 text-center md:text-left">
                <div className="flex flex-col gap-1.5 max-w-xs">
                    <h4 className="text-[15px] font-display text-[#f3e7c6]">Tested for Quality</h4>
                    <p className="text-[11px] text-[#efe3bf]/60 leading-normal">Our spices undergo laboratory testing for purity & active oil content.</p>
                </div>
                <div className="w-px h-10 bg-white/10 hidden md:block" />
                <div className="flex flex-col gap-1.5 max-w-xs">
                    <h4 className="text-[15px] font-display text-[#f3e7c6]">Built on Standards</h4>
                    <p className="text-[11px] text-[#efe3bf]/60 leading-normal">Compliant with FSSAI and ISO food-safety requirements.</p>
                </div>
                <div className="w-px h-10 bg-white/10 hidden md:block" />
                <div className="flex flex-col gap-1.5 max-w-xs">
                    <h4 className="text-[15px] font-display text-[#f3e7c6]">Ready for the World</h4>
                    <p className="text-[11px] text-[#efe3bf]/60 leading-normal">Operations aligned for responsible domestic & international trade.</p>
                </div>
            </div>
            <div className="absolute top-0 right-0 w-1/3 h-full bg-[radial-gradient(circle_at_100%_50%,rgba(217,184,109,0.03),transparent)]" />
        </motion.div>

      </div>
    </section>
  );
}



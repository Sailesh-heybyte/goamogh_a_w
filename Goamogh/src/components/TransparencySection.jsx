import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, RotateCw } from 'lucide-react';

const AnimatedCounter = ({ from = 0, to, duration = 2, suffix = '', decimals = 0 }) => {
  const [count, setCount] = useState(from);

  useEffect(() => {
    let startTime;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const next = from + (to - from) * progress;
      setCount(Number(next.toFixed(decimals)));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [from, to, duration]);

  return (
    <span>
      {count}
      {suffix}
    </span>
  );
};

export default function TransparencySection() {
  const [cardRotation, setCardRotation] = useState({ x: 0, y: 0 });
  const [activeFeature, setActiveFeature] = useState(null);
  const cardRef = useRef(null);
  const containerRef = useRef(null);

  const features = [
    {
      id: 'moisture',
      title: 'Moisture Control',
      description: 'Optimized to prevent degradation and mold growth.',
      certRow: 'Total Ash'
    },
    {
      id: 'purity',
      title: 'Purity Testing',
      description: 'Verified absence of fillers, dyes, or synthetic additives.',
      certRow: 'Volatile Oil'
    },
    {
      id: 'consistency',
      title: 'Consistency Analysis',
      description: 'Uniform essential oil content across every batch.',
      certRow: 'Lead Content'
    }
  ];

  const certificateData = [
    { label: 'Total Ash', value: '5.4%', status: 'Pass' },
    { label: 'Volatile Oil', value: '3.2%', status: 'Pass' },
    { label: 'Lead Content', value: '<0.01ppm', status: 'Pass' },
    { label: 'Aflatoxins', value: 'Negative', status: 'Pass' }
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
    setActiveFeature(null);
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
      {/* Background gradient */}
      <div className="absolute inset-0 opacity-30">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 20% 50%, rgba(197, 164, 126, 0.1) 0%, transparent 50%)'
          }}
        />
      </div>

      <div className="relative z-10 mx-auto grid max-w-[110rem] grid-cols-1 items-center gap-8 md:gap-14 lg:grid-cols-2">
        {/* Left Column */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="mb-8">
            <p
              className="mb-4 text-xs md:text-sm font-bold tracking-[0.18em]"
              style={{ color: '#c5a47e' }}
            >
              UNCOMPROMISED STANDARDS
            </p>
            <h2
              className="mb-6 font-serif text-[clamp(2rem,5vw,5.2rem)] font-bold leading-[1.06]"
              style={{ color: '#f5f5f5' }}
            >
              Quality Should Be <em style={{ fontStyle: 'normal', color: '#c5a47e' }}>Measurable</em>
            </h2>
            <p
              className="mb-4 max-w-3xl text-base md:text-xl leading-relaxed font-light text-[#c5a47e]"
            >
              Good intentions don't make good spices. Standards do.
            </p>
            <p
              className="mb-8 max-w-3xl text-sm md:text-lg leading-relaxed font-light"
              style={{ color: 'rgba(245, 245, 245, 0.8)' }}
            >
              Every batch is subject to quality checks designed to verify its safety, purity and consistency—before it makes its way to your kitchen. No vague promises. No hidden behind-the-label assurances. Just the numbers, the results and the standard we hold ourselves to.
            </p>
          </div>

          {/* Features List */}
          <div className="space-y-5 md:space-y-7">
            {features.map((feature, idx) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.6 }}
                onMouseEnter={() => setActiveFeature(feature.id)}
                onMouseLeave={() => setActiveFeature(null)}
                className="group cursor-pointer"
              >
                <div className="flex gap-4 items-start">
                  <motion.div
                    animate={{
                      scale: activeFeature === feature.id ? 1.2 : 1,
                      color: activeFeature === feature.id ? '#c5a47e' : '#c5a47e'
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <CheckCircle2 size={24} className="md:w-7 md:h-7" />
                  </motion.div>
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

          {/* CTA Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mt-10 rounded-xl border-2 px-9 py-4 text-sm md:text-base font-semibold uppercase tracking-wider transition-all duration-300"
            style={{
              borderColor: '#c5a47e',
              color: '#c5a47e',
              backgroundColor: 'transparent'
            }}
          >
            View Sample Report
          </motion.button>
        </motion.div>

        {/* Right Column - 3D Certificate Card */}
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
            transition: 'transform 0.1s ease-out'
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
            {/* Rotating Verification Badge */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="absolute -right-2 -top-2 md:-right-4 md:-top-4 z-20 flex h-16 w-16 md:h-24 md:w-24 items-center justify-center rounded-full border border-dashed"
              style={{
                borderColor: '#c5a47e',
                backgroundColor: 'rgba(197, 164, 126, 0.1)'
              }}
            >
              <div className="text-center text-[9px] md:text-xs font-bold" style={{ color: '#c5a47e' }}>
                <RotateCw size={12} className="mx-auto mb-1 md:w-4 md:h-4" />
                VERIFIED
              </div>
            </motion.div>

            {/* Certificate Header */}
            <div className="mb-6 pr-10 md:pr-0">
              <h3 className="text-center text-xl md:text-4xl font-bold" style={{ color: '#1a1a1a' }}>
                CERTIFICATE OF ANALYSIS
              </h3>
              <p
                className="mt-2 text-center text-sm md:text-lg"
                style={{ color: '#666' }}
              >
                Batch #GM-SR-2024-008
              </p>
            </div>

            {/* Certificate Table */}
            <div className="mb-6 space-y-2 md:space-y-3">
              {certificateData.map((item, idx) => (
                <motion.div
                  key={idx}
                  animate={{
                    backgroundColor:
                      activeFeature === features[idx]?.id
                        ? 'rgba(197, 164, 126, 0.1)'
                        : 'transparent',
                    x: activeFeature === features[idx]?.id ? 4 : 0
                  }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-2 gap-4 rounded-lg border border-transparent p-2 md:p-3"
                  style={{
                    borderColor:
                      activeFeature === features[idx]?.id
                        ? 'rgba(197, 164, 126, 0.3)'
                        : 'transparent'
                  }}
                >
                  <div>
                    <p className="text-sm md:text-lg font-medium" style={{ color: '#666' }}>
                      {item.label}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg md:text-2xl font-bold" style={{ color: '#1a1a1a' }}>
                      {item.label.includes('Ash') && (
                        <AnimatedCounter from={0} to={5.4} suffix="%" decimals={1} />
                      )}
                      {item.label.includes('Oil') && (
                        <AnimatedCounter from={0} to={3.2} suffix="%" decimals={1} />
                      )}
                      {!item.label.includes('Ash') && !item.label.includes('Oil') && item.value}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pass Status with Stamp Effect */}
            <div className="flex items-center justify-between border-t border-gray-200 pt-6">
              <p className="text-sm" style={{ color: '#999' }}>
                This document verifies that the batch complies with all health and safety standards.
              </p>
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 0.6, type: 'spring' }}
                className="px-4 py-2 rounded-lg font-bold text-sm"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
                }}
              >
                ✓ PASSED
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

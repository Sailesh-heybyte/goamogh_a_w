"use client";
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { useMemoriesAudio } from '../hooks/useMemoriesAudio';

gsap.registerPlugin(ScrollTrigger);

const heritageStory = [
  {
    phase: 1,
    title: 'Where Every Spice Story Begins',
    subtitle: 'Before the aroma. Before the grind. Before the kitchen. There is a seed, a soil, a season—and the hands that bring it to harvest.',
    range: [0, 11],
    image: '/images/heritage/1.webp',
    hudData: 'THE ORIGIN',
    hudYear: 'Step 01 / 09',
    audioTrigger: 'wind-and-birds',
  },
  {
    phase: 2,
    title: 'More Than a Spice. A Way of Cooking.',
    subtitle: 'For centuries, Indian kitchens have known that the smallest ingredients make the biggest difference. Spices were toasted, crushed, pounded and blended by instinct.',
    range: [11, 22],
    image: '/images/heritage/2.webp',
    hudData: 'HERITAGE WISDOM',
    hudYear: 'Step 02 / 09',
    audioTrigger: 'child-laugh-grinding',
  },
  {
    phase: 3,
    title: 'We Keep the Wisdom. We Raise the Standard.',
    subtitle: 'Heritage gives us a starting point—not a reason to stop evolving. Traditional character, backed by modern discipline, lab testing, and clear quality standards.',
    range: [22, 33],
    image: '/images/heritage/3.webp',
    hudData: 'OUR APPROACH',
    hudYear: 'Step 03 / 09',
    audioTrigger: 'child-laugh-grinding',
  },
  {
    phase: 4,
    title: 'A Spice Has a Journey',
    subtitle: 'From field to harvest, selection to preparation: 01 GROWN → 02 SELECTED → 03 PROCESSED → 04 DELIVERED. Protect what makes the spice worth having.',
    range: [33, 44],
    image: '/images/heritage/4.webp',
    hudData: 'FOUR STAGES',
    hudYear: 'Step 04 / 09',
    audioTrigger: 'child-laugh-grinding',
  },
  {
    phase: 5,
    title: 'Some Things Were Never Meant to Be Rushed.',
    subtitle: 'Before modern machines, there were hands, stone and time. Spices were roasted until their aroma opened up. Tradition is knowing what is worth carrying forward.',
    range: [44, 55],
    image: '/images/heritage/5.webp',
    hudData: 'KITCHEN WISDOM',
    hudYear: 'Step 05 / 09',
    audioTrigger: 'wind-and-birds',
  },
  {
    phase: 6,
    title: 'Good Spice Starts With Good Ground.',
    subtitle: 'Before there was a spice, there was a seed. The soil, the season, the climate shape the color and character of the ingredient. Rooted in the land.',
    range: [55, 66],
    image: '/images/heritage/6.webp',
    hudData: 'THE LAND',
    hudYear: 'Step 06 / 09',
    audioTrigger: 'child-laugh-grinding',
  },
  {
    phase: 7,
    title: 'Every Season Leaves Its Mark.',
    subtitle: 'The character of a spice changes with the harvest. We pay attention to the details—because the best ingredients deserve to be noticed before reaching the grinder.',
    range: [66, 77],
    image: '/images/heritage/7.webp',
    hudData: 'THE HARVEST',
    hudYear: 'Step 07 / 09',
    audioTrigger: 'pressurized-thud',
  },
  {
    phase: 8,
    title: '',
    subtitle: '',
    range: [77, 88],
    image: '/images/heritage/8.webp',
    hudData: '',
    hudYear: '',
    audioTrigger: 'pressurized-thud',
  },
  {
    phase: 9,
    title: 'From Our Heritage to Your Kitchen.',
    subtitle: 'A spice begins in soil, passes through many hands, finds its way into a pan, and becomes part of your story. That is the heritage we carry forward.',
    range: [88, 100],
    image: '/images/heritage/9.webp',
    hudData: 'JOURNEY CONTINUES',
    hudYear: 'Step 09 / 09',
    audioTrigger: 'wind-and-birds',
  },
];

export default function HeritagePage() {
  const containerRef = useRef(null);
  const [currentPhase, setCurrentPhase] = useState(1);
  const [imageOpacity, setImageOpacity] = useState(1);
  const [hudData, setHudData] = useState(heritageStory[0].hudData);
  const [hudYear, setHudYear] = useState(heritageStory[0].hudYear);
  const [hudTitle, setHudTitle] = useState(heritageStory[0].title);
  const [bgPosX, setBgPosX] = useState(50);
  const { playAudio } = useMemoriesAudio();
  const lastAudioPhaseRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.timeline({
        scrollTrigger: {
          trigger: '.heritage-scroll-track',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
          onUpdate: (self) => {
            const progress = self.progress * 100;
            const matchedIndex = heritageStory.findIndex(({ range }) => progress >= range[0] && progress < range[1]);
            const activeIndex = matchedIndex !== -1 ? matchedIndex : heritageStory.length - 1;
            const nextPhase = activeIndex + 1;
            const nextStory = heritageStory[activeIndex];

            // Compute local progress within current phase (0 to 1) for horizontal pan effect
            const phaseRange = nextStory.range;
            const localProgress = Math.max(0, Math.min(1, (progress - phaseRange[0]) / (phaseRange[1] - phaseRange[0])));
            
            // Pan from 10% (left) to 90% (right) across each phase on mobile & desktop
            const panX = 10 + localProgress * 80;
            setBgPosX(panX);

            setCurrentPhase(nextPhase);
            setImageOpacity(Math.min(progress / 10, 1));
            setHudTitle(nextStory.title);
            setHudData(nextStory.hudData);
            setHudYear(nextStory.hudYear);

            if (lastAudioPhaseRef.current !== nextPhase) {
              playAudio(nextStory.audioTrigger);
              lastAudioPhaseRef.current = nextPhase;
            }
          },
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, [playAudio]);

  return (
    <div ref={containerRef} className="relative bg-[#1a2416] text-white min-h-screen">
      {/* Fixed Full-Screen Background Artwork Layer */}
      <div className="fixed top-0 left-0 w-full h-screen overflow-hidden z-0">
        <motion.div
          className="heritage-image w-full h-full bg-cover transition-all duration-300 ease-out"
          style={{
            backgroundImage: `url(${heritageStory[currentPhase - 1]?.image || '/images/heritage/1.webp'})`,
            backgroundPosition: `${bgPosX}% 50%`,
            opacity: imageOpacity,
          }}
          animate={{ scale: 1.03 }}
          transition={{ duration: 0.2 }}
        />

        {/* Ambient Top and Bottom Gradient Overlays for High Legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/20 to-black/80 pointer-events-none" />
      </div>

      {/* Sticky Content Track */}
      <div className="heritage-scroll-track relative z-10 h-[500vh]">
        <div className="sticky top-0 h-screen flex flex-col justify-end pb-12 md:justify-center md:pb-0 px-6 text-center">
          {currentPhase !== 8 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="max-w-2xl mx-auto w-full"
            >
              {/* Phase Tag */}
              <div className="flex items-center justify-center">
                <p className="inline-flex items-center rounded-full border border-white/20 bg-black/40 px-4 py-1 text-xs tracking-[0.25em] uppercase text-white/90 shadow-lg backdrop-blur-sm">
                  Heritage • Step {currentPhase} / 9
                </p>
              </div>

              {/* Title */}
              {hudTitle && (
                <h1 className="mt-4 md:mt-6 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#d6b56b] drop-shadow-lg">
                  {hudTitle}
                </h1>
              )}

              {/* Subtitle */}
              {heritageStory[currentPhase - 1]?.subtitle && (
                <p className="mt-2 md:mt-3 text-base md:text-lg text-white/90 drop-shadow">
                  {heritageStory[currentPhase - 1]?.subtitle}
                </p>
              )}

              {/* Data HUD Stats */}
              {(hudData || hudYear) && (
                <div className="mt-4 md:mt-6 flex items-center justify-center gap-3 text-xs md:text-sm text-white/80 font-mono drop-shadow">
                  {hudData && <span>{hudData}</span>}
                  {hudData && hudYear && <span className="text-[#d6b56b]">•</span>}
                  {hudYear && <span>{hudYear}</span>}
                </div>
              )}

              {/* Step Progress Indicators */}
              <div className="flex justify-center items-center gap-1.5 md:gap-2 mt-6 md:mt-8">
                {heritageStory.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 md:h-1 rounded-full transition-all duration-500 ${
                      i + 1 === currentPhase
                        ? 'w-6 md:w-12 bg-[#d6b56b]'
                        : i < currentPhase
                        ? 'w-2 md:w-12 bg-[#d6b56b]/60'
                        : 'w-2 md:w-12 bg-white/30'
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Scroll indicator for mobile */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 md:hidden pointer-events-none">
        <motion.div
          className="text-center text-white/70 text-[11px] font-mono bg-black/40 px-3.5 py-1 rounded-full border border-white/10 backdrop-blur-sm shadow-md"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          ↓ Scroll to explore ↓
        </motion.div>
      </div>

      {/* Scroll indicator for desktop */}
      <div className="hidden md:fixed md:bottom-8 md:left-1/2 md:-translate-x-1/2 md:z-50 pointer-events-none">
        <motion.div
          className="text-center text-white/40 text-sm font-mono"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          ↓ Scroll to explore heritage ↓
        </motion.div>
      </div>

      <div className="fixed bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#1a2416] to-transparent pointer-events-none z-20" />
    </div>
  );
}

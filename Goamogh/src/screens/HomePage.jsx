'use client';
import React, { useRef } from 'react';
import dynamic from 'next/dynamic';
import HeroCanvas from '../components/home/HeroCanvas';

const PricingSection = dynamic(() => import('../components/home/PricingSection'));

export default function HomePage() {
    const containerRef = useRef(null);

    return (
        <main className="w-full bg-[#0c0c0c]">
            <h1 className="sr-only">Goamogh — Premium Spices and Blends</h1>
            <div ref={containerRef} className="relative h-[160svh] md:h-[220vh]">
                <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
                    <HeroCanvas scrollTrackRef={containerRef} />
                </div>
            </div>

            <div className="relative z-10 -mt-16 md:-mt-24 bg-[#0c0c0c]">
                <PricingSection />
            </div>
        </main>
    );
}

"use client";
import { ReactLenis, useLenis } from '@studio-freight/react-lenis';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import gsap from 'gsap';

gsap.registerPlugin(ScrollTrigger);

const lenisOptions = {
    lerp: 0.1,
    smoothWheel: true,
    wheelMultiplier: 1,
};

function ScrollTriggerSync() {
    useLenis(ScrollTrigger.update);
    return null;
}

export default function LenisProvider({ children }) {
    return (
        <ReactLenis root options={lenisOptions}>
            <ScrollTriggerSync />
            {children}
        </ReactLenis>
    );
}

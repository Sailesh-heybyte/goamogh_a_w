import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useCanvasVideo } from '../../hooks/useCanvasVideo';

gsap.registerPlugin(ScrollTrigger);

const MOBILE_FRAME_CONFIG = { folder: '/frames-mobile/', frameCount: 240, fit: 'contain' };
const DESKTOP_FRAME_CONFIG = { folder: '/frames-desktop/', frameCount: 360, fit: 'cover' };

export default function HeroCanvas({ scrollTrackRef }) {
    const canvasRef = useRef(null);
    const [isPortrait, setIsPortrait] = useState(false);

    useEffect(() => {
        const mql = window.matchMedia('(orientation: portrait)');
        setIsPortrait(mql.matches);
        const handleChange = (e) => setIsPortrait(e.matches);
        mql.addEventListener('change', handleChange);
        return () => {
            mql.removeEventListener('change', handleChange);
        };
    }, []);

    const frameConfig = isPortrait ? MOBILE_FRAME_CONFIG : DESKTOP_FRAME_CONFIG;

    const { drawFrame, isReady } = useCanvasVideo(canvasRef, frameConfig);

    useEffect(() => {
        if (!isReady) return;

        drawFrame(0);

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }

        const tl = gsap.timeline({
            scrollTrigger: {
                id: 'hero-scroll',
                trigger: scrollTrackRef.current,
                start: 'top top',
                end: 'bottom bottom',
                scrub: true,
                onUpdate: (self) => {
                    const frameIndex = Math.floor(self.progress * (frameConfig.frameCount - 1));
                    drawFrame(frameIndex);
                },
            },
        });

        return () => {
            ScrollTrigger.getById('hero-scroll')?.kill();
            tl.kill();
        };
    }, [isReady, drawFrame, scrollTrackRef, frameConfig]);

    return (
        <div className="relative w-full h-full bg-[var(--hero-paper)]">
            <picture>
                <source media="(orientation: portrait)" srcSet="/frames-mobile/f-001.webp" />
                <img
                    src="/frames-desktop/f-001.webp"
                    alt=""
                    aria-hidden="true"
                    fetchPriority="high"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover portrait:object-contain"
                />
            </picture>
            <canvas
                ref={canvasRef}
                className={`absolute inset-0 block w-full h-full transition-opacity duration-300 ${isReady ? 'opacity-100' : 'opacity-0'}`}
            />
        </div>
    );
}

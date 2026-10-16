import { useEffect, useState, useRef, useCallback } from 'react';

export function useCanvasVideo(canvasRef, options = {}) {
    const { folder = '/frames-desktop/', frameCount = 360, fit = 'cover' } = options;

    const [isReady, setIsReady] = useState(false);

    const imagesRef = useRef([]);
    const ctxRef = useRef(null);
    const dimensionsRef = useRef({ width: 0, height: 0, dpr: 1 });
    const lastDrawnIndexRef = useRef(-1);
    const lastRequestedIndexRef = useRef(0);
    const heroPaperColorRef = useRef(null);
    const isCancelledRef = useRef(false);
    const inFlightImagesRef = useRef(new Set());
    const queueRef = useRef([]);
    const activeLoadsRef = useRef(0);

    const getContext = useCallback(() => {
        if (ctxRef.current) return ctxRef.current;
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const ctx = canvas.getContext('2d', { alpha: false });
        ctxRef.current = ctx;
        return ctx;
    }, [canvasRef]);

    const drawFrame = useCallback(
        (index, force = false) => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const ctx = ctxRef.current || getContext();
            if (!ctx) return;

            const { width, height } = dimensionsRef.current;
            if (width <= 0 || height <= 0) return;

            const targetIndex = Math.min(frameCount - 1, Math.max(0, Math.round(index)));
            lastRequestedIndexRef.current = targetIndex;

            let chosenIndex = -1;
            const images = imagesRef.current;
            if (images[targetIndex]?.complete && images[targetIndex]?.naturalWidth > 0) {
                chosenIndex = targetIndex;
            } else {
                for (let offset = 1; offset < frameCount; offset++) {
                    const left = targetIndex - offset;
                    if (left >= 0 && images[left]?.complete && images[left]?.naturalWidth > 0) {
                        chosenIndex = left;
                        break;
                    }
                    const right = targetIndex + offset;
                    if (right < frameCount && images[right]?.complete && images[right]?.naturalWidth > 0) {
                        chosenIndex = right;
                        break;
                    }
                }
            }

            if (chosenIndex === -1) return;

            if (!force && chosenIndex === lastDrawnIndexRef.current) return;

            const img = images[chosenIndex];
            const vW = img.naturalWidth;
            const vH = img.naturalHeight;
            if (!vW || !vH) return;

            const rW = width / vW;
            const rH = height / vH;
            const ratio = fit === 'contain' ? Math.min(rW, rH) : Math.max(rW, rH);

            const newW = vW * ratio;
            const newH = vH * ratio;
            const x = (width - newW) / 2;
            const y = (height - newH) / 2;

            if (fit === 'contain') {
                if (!heroPaperColorRef.current && typeof window !== 'undefined') {
                    const style = getComputedStyle(document.documentElement);
                    heroPaperColorRef.current = style.getPropertyValue('--hero-paper').trim() || '#1a2416';
                }
                ctx.fillStyle = heroPaperColorRef.current || '#1a2416';
                ctx.fillRect(0, 0, width, height);
            }

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, x, y, newW, newH);

            lastDrawnIndexRef.current = chosenIndex;
        },
        [canvasRef, frameCount, fit, getContext]
    );

    const resize = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = ctxRef.current || getContext();
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const cssWidth = rect.width;
        const cssHeight = rect.height;
        if (cssWidth <= 0 || cssHeight <= 0) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(cssWidth * dpr);
        canvas.height = Math.round(cssHeight * dpr);

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        dimensionsRef.current = { width: cssWidth, height: cssHeight, dpr };

        drawFrame(lastRequestedIndexRef.current, true);
    }, [canvasRef, getContext, drawFrame]);

    useEffect(() => {
        resize();
        window.addEventListener('resize', resize);
        return () => {
            window.removeEventListener('resize', resize);
        };
    }, [resize]);

    useEffect(() => {
        if (isReady) {
            resize();
            drawFrame(0, true);
        }
    }, [isReady, resize, drawFrame]);

    useEffect(() => {
        isCancelledRef.current = false;
        imagesRef.current = new Array(frameCount);
        lastDrawnIndexRef.current = -1;
        queueRef.current = [];
        activeLoadsRef.current = 0;
        inFlightImagesRef.current.clear();

        const cleanFolder = folder.endsWith('/') ? folder : `${folder}/`;
        const getFrameUrl = (i) => `${cleanFolder}f-${String(i).padStart(3, '0')}.webp`;

        const pumpQueue = () => {
            while (activeLoadsRef.current < 6 && queueRef.current.length > 0 && !isCancelledRef.current) {
                const frameNum = queueRef.current.shift();
                const img = new Image();
                activeLoadsRef.current++;
                inFlightImagesRef.current.add(img);

                img.onload = () => {
                    inFlightImagesRef.current.delete(img);
                    activeLoadsRef.current--;
                    if (!isCancelledRef.current) {
                        imagesRef.current[frameNum - 1] = img;
                        pumpQueue();
                    }
                };

                img.onerror = () => {
                    inFlightImagesRef.current.delete(img);
                    activeLoadsRef.current--;
                    if (!isCancelledRef.current) {
                        pumpQueue();
                    }
                };

                img.src = getFrameUrl(frameNum);
            }
        };

        const firstImg = new Image();
        inFlightImagesRef.current.add(firstImg);

        firstImg.onload = () => {
            inFlightImagesRef.current.delete(firstImg);
            if (isCancelledRef.current) return;

            imagesRef.current[0] = firstImg;
            setIsReady(true);

            const seen = new Set([1]);
            const queue = [];
            const steps = [16, 8, 4, 2, 1];

            for (const step of steps) {
                for (let i = 1; i <= frameCount; i += step) {
                    if (!seen.has(i)) {
                        seen.add(i);
                        queue.push(i);
                    }
                }
                if (!seen.has(frameCount)) {
                    seen.add(frameCount);
                    queue.push(frameCount);
                }
            }

            for (let i = 1; i <= frameCount; i++) {
                if (!seen.has(i)) {
                    seen.add(i);
                    queue.push(i);
                }
            }

            queueRef.current = queue;
            pumpQueue();
        };

        firstImg.onerror = () => {
            inFlightImagesRef.current.delete(firstImg);
        };

        firstImg.src = getFrameUrl(1);

        return () => {
            isCancelledRef.current = true;
            inFlightImagesRef.current.forEach((img) => {
                img.onload = null;
                img.onerror = null;
                img.src = '';
            });
            inFlightImagesRef.current.clear();
            queueRef.current = [];
            activeLoadsRef.current = 0;
        };
    }, [folder, frameCount]);

    return { isReady, drawFrame, resize };
}

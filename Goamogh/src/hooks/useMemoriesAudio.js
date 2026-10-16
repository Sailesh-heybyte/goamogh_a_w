import { useEffect, useRef } from 'react';

export function useMemoriesAudio() {
    const audioContextRef = useRef(null);
    const oscillatorsRef = useRef({});
    const gainsRef = useRef({});

    useEffect(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        return () => {
            Object.values(oscillatorsRef.current).forEach((osc) => {
                try {
                    osc.stop();
                } catch (e) {
                    // Already stopped
                }
            });
        };
    }, []);

    const playAudio = (audioType, trigger = false) => {
        try {
            const ctx = audioContextRef.current;
            if (!ctx || ctx.state === 'closed') return;

            if (ctx.state === 'suspended') {
                ctx.resume();
            }

            Object.values(oscillatorsRef.current).forEach((osc) => {
                try {
                    osc.stop();
                } catch (e) {
                    // Already stopped
                }
            });
            oscillatorsRef.current = {};
            Object.values(gainsRef.current).forEach((gain) => gain.gain.setValueAtTime(0, ctx.currentTime));
            gainsRef.current = {};

            const now = ctx.currentTime;
            const masterGain = ctx.createGain();
            masterGain.connect(ctx.destination);
            masterGain.gain.setValueAtTime(0.1, now);

            switch (audioType) {
                case 'wind-and-birds': {
                    const bufferSize = ctx.sampleRate * 4;
                    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                    const data = noiseBuffer.getChannelData(0);
                    for (let i = 0; i < bufferSize; i++) {
                        data[i] = Math.random() * 2 - 1;
                    }
                    const noiseSource = ctx.createBufferSource();
                    noiseSource.buffer = noiseBuffer;
                    noiseSource.loop = true;

                    const filter = ctx.createBiquadFilter();
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(800, now);

                    noiseSource.connect(filter);
                    filter.connect(masterGain);
                    noiseSource.start();
                    oscillatorsRef.current['wind'] = noiseSource;

                    const birdOsc = ctx.createOscillator();
                    birdOsc.frequency.setValueAtTime(2000, now);
                    birdOsc.frequency.exponentialRampToValueAtTime(1500, now + 0.3);

                    const birdGain = ctx.createGain();
                    birdGain.gain.setValueAtTime(0.05, now);
                    birdGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

                    birdOsc.connect(birdGain);
                    birdGain.connect(masterGain);
                    birdOsc.start();
                    oscillatorsRef.current['bird'] = birdOsc;
                    gainsRef.current['bird'] = birdGain;

                    masterGain.gain.exponentialRampToValueAtTime(0.01, now + 8);
                    setTimeout(() => {
                        try {
                            noiseSource.stop();
                            birdOsc.stop();
                        } catch (e) {
                            // Already stopped
                        }
                    }, 8000);
                    break;
                }

                case 'child-laugh-grinding': {
                    const osc1 = ctx.createOscillator();
                    osc1.frequency.setValueAtTime(150, now);

                    const lfo = ctx.createOscillator();
                    lfo.frequency.setValueAtTime(3, now);

                    const gain1 = ctx.createGain();
                    gain1.gain.setValueAtTime(0.15, now);

                    lfo.connect(gain1.gain);
                    osc1.connect(gain1);
                    gain1.connect(masterGain);

                    osc1.start();
                    lfo.start();
                    oscillatorsRef.current['grind'] = osc1;
                    oscillatorsRef.current['lfo'] = lfo;

                    const laughOsc = ctx.createOscillator();
                    laughOsc.frequency.setValueAtTime(800 + Math.random() * 400, now);

                    const laughGain = ctx.createGain();
                    laughGain.gain.setValueAtTime(0, now);
                    laughGain.gain.linearRampToValueAtTime(0.08, now + 0.1);
                    laughGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

                    laughOsc.connect(laughGain);
                    laughGain.connect(masterGain);
                    laughOsc.start();
                    oscillatorsRef.current['laugh'] = laughOsc;

                    masterGain.gain.exponentialRampToValueAtTime(0.01, now + 10);
                    setTimeout(() => {
                        try {
                            osc1.stop();
                            lfo.stop();
                            laughOsc.stop();
                        } catch (e) {
                            // Already stopped
                        }
                    }, 10000);
                    break;
                }

                case 'pressurized-thud': {
                    const osc = ctx.createOscillator();
                    osc.frequency.setValueAtTime(200, now);
                    osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);

                    const gain = ctx.createGain();
                    gain.gain.setValueAtTime(0.3, now);
                    gain.gain.exponentialRampToValueAtTime(0.05, now + 0.1);
                    gain.gain.linearRampToValueAtTime(0, now + 0.5);

                    osc.connect(gain);
                    gain.connect(masterGain);
                    osc.start();
                    oscillatorsRef.current['thud'] = osc;
                    gainsRef.current['thud'] = gain;

                    setTimeout(() => {
                        try {
                            osc.stop();
                        } catch (e) {
                            // Already stopped
                        }
                    }, 500);
                    break;
                }

                default:
                    break;
            }
        } catch (error) {
            console.warn('Audio playback error:', error);
        }
    };

    const stopAllAudio = () => {
        Object.values(oscillatorsRef.current).forEach((osc) => {
            try {
                osc.stop();
            } catch (e) {
                // Already stopped
            }
        });
        oscillatorsRef.current = {};
    };

    return {
        playAudio,
        stopAllAudio,
    };
}

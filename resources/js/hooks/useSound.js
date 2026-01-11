import { useCallback, useRef, useEffect } from 'react';

export const useSound = (enabled = true) => {
    const audioContextRef = useRef(null);

    useEffect(() => {
        // Initialize AudioContext on first interaction or mount if allowed
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            audioContextRef.current = new AudioContext();
        }

        return () => {
            if (audioContextRef.current?.state !== 'closed') {
                audioContextRef.current?.close();
            }
        };
    }, []);

    const playThock = useCallback(() => {
        if (!enabled || !audioContextRef.current) return;

        const ctx = audioContextRef.current;

        // Resume context if suspended (browser policy)
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        const t = ctx.currentTime;

        // ** Oscillator for the "Boing/Thud" (Body of the sound) **
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'triangle'; // Thocky base
        osc.frequency.setValueAtTime(120, t); // Start low
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.1); // Drop pitch quickly

        // ** Filter for "Creaminess" (Low Pass) **
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, t); // Dampen highs
        filter.Q.value = 1;

        // ** Envelope (Percussive shape) **
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.4, t + 0.01); // Attack
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15); // Decay

        // Connect graph
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.2);

        // ** Noise for the "Keycap impact" (Optional secondary layer) **
        // Keeping it simple for now, just the osc thud often sounds surprisingly good for "thock"
        // if filtered right.

    }, [enabled]);

    return { playThock };
};

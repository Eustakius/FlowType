import { useState, useEffect } from 'react';

export function useGhostTyper(targetText, enabled, speed = 100, wait = 2000) {
    const [ghostInput, setGhostInput] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (!enabled) {
            setGhostInput('');
            return;
        }

        let timeout;

        const loop = () => {
            setGhostInput(current => {
                if (isDeleting) {
                    if (current.length === 0) {
                        setIsDeleting(false);
                        return '';
                    }
                    return current.slice(0, -1);
                } else {
                    // Type up to ~50 chars or end of sentence/line for demo
                    const limit = Math.min(targetText.length, 50);
                    if (current.length >= limit) {
                        // Wait is handled by effect schedule, here we just return and toggle state in effect
                        return current;
                    }
                    return targetText.slice(0, current.length + 1);
                }
            });
        };

        // We need to manage phase transitions (Typing -> Waiting -> Deleting -> Waiting)
        // This simple interval approach above in setState is tricky with timing.
        // Let's use the phase state pattern.
    }, [enabled, targetText]); // cleanup

    // Refined implementation inside the hook
    const [index, setIndex] = useState(0);
    const [phase, setPhase] = useState('typing'); // typing, waiting, deleting

    useEffect(() => {
        if (!enabled) {
            setIndex(0);
            setPhase('typing');
            setGhostInput('');
            return;
        }

        // Limit ghost typing to first 50 chars or so
        const limit = Math.min(targetText.length, 50);
        let timeout;

        if (phase === 'typing') {
            if (index < limit) {
                // Randomize speed slightly for realism
                const randomSpeed = speed + Math.random() * 50 - 25;
                timeout = setTimeout(() => {
                    setIndex(prev => prev + 1);
                }, randomSpeed);
            } else {
                setPhase('waiting');
            }
        } else if (phase === 'waiting') {
            timeout = setTimeout(() => {
                setPhase('deleting');
            }, wait);
        } else if (phase === 'deleting') {
            if (index > 0) {
                timeout = setTimeout(() => {
                    setIndex(prev => prev - 1);
                }, speed / 2);
            } else {
                setPhase('typing');
            }
        }

        setGhostInput(targetText.slice(0, index));

        return () => clearTimeout(timeout);
    }, [enabled, index, phase, targetText, speed, wait]);

    return ghostInput;
}

import React, { useState, useEffect } from 'react';
import { useTypingEngine } from '../hooks/useTypingEngine';
import { useGhostTyper } from '../hooks/useGhostTyper'; // Import the new hook
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import clsx from 'clsx';
import { useSound } from '../hooks/useSound';
import ConfigBar from './ConfigBar';

// Simple Typewriter Component
const Typewriter = ({ text, speed = 100, wait = 2000 }) => {
    const [displayText, setDisplayText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        let timeout;

        const type = () => {
            setDisplayText(prev => {
                if (isDeleting) {
                    if (prev.length === 0) {
                        setIsDeleting(false);
                        return prev;
                    }
                    return prev.slice(0, -1);
                } else {
                    if (prev.length === text.length) {
                        return prev;
                    }
                    return text.slice(0, prev.length + 1);
                }
            });

            let nextSpeed = speed;

            if (isDeleting) nextSpeed /= 2; // Delete faster

            if (!isDeleting && displayText === text) {
                // Finished typing, wait before deleting
                nextSpeed = wait;
                setIsDeleting(true);
            } else if (isDeleting && displayText === '') {
                // Finished deleting, wait before typing
                nextSpeed = 500;
                setIsDeleting(false);
            }

            // Correction for state lag vs var check:
            // The check above uses stale state inside `prev` callback potentially or simple render cycle.
            // Using a simpler recursive timeout structure is safer.
        };
        // We need a ref or effect to manage the loop correctly to access latest state
        // Simplest implementation for React:
    }, []); // This approach above is buggy with closure.

    // Better implementation:
    const [index, setIndex] = useState(0);
    const [phase, setPhase] = useState('typing'); // typing, waiting, deleting

    useEffect(() => {
        if (phase === 'typing') {
            if (index < text.length) {
                const timeout = setTimeout(() => {
                    setDisplayText(prev => prev + text.charAt(index));
                    setIndex(prev => prev + 1);
                }, speed);
                return () => clearTimeout(timeout);
            } else {
                setPhase('waiting');
            }
        } else if (phase === 'waiting') {
            const timeout = setTimeout(() => {
                setPhase('deleting');
            }, wait);
            return () => clearTimeout(timeout);
        } else if (phase === 'deleting') {
            if (index > 0) {
                const timeout = setTimeout(() => {
                    setDisplayText(prev => prev.slice(0, -1));
                    setIndex(prev => prev - 1);
                }, speed / 2);
                return () => clearTimeout(timeout);
            } else {
                setPhase('typing');
            }
        }
    }, [index, phase, text, speed, wait]);

    return (
        <span className="flex items-center">
            {displayText}
            <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                className="w-[3px] h-[1em] bg-primary ml-1"
            />
        </span>
    );
};

// Game.jsx

export default function Game() {
    const { playThock } = useSound();

    // UI State
    const [theme, setTheme] = useState('default');
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [isFocused, setIsFocused] = useState(true);
    const [capsLock, setCapsLock] = useState(false);

    // Ghost & QoL State
    const [lastStats, setLastStats] = useState(null); // { wpm: 0 }
    const [ghostIndex, setGhostIndex] = useState(0);
    const [shake, setShake] = useState(0);

    const [config, setConfig] = useState({
        mode: 'time',
        duration: 30,
        wordCount: 25
    });

    const {
        input,
        text,
        timeLeft,
        isRunning,
        isFinished,
        stats,
        handleKeyDown,
        reset: engineReset,
        config: engineConfig
    } = useTypingEngine({
        duration: config.duration,
        mode: config.mode,
        initialWordCount: config.wordCount
    });

    const zenMode = isRunning && !isFinished;

    // Custom Reset to handle Ghost
    const reset = () => {
        setGhostIndex(0);
        engineReset();
    };

    // Ghost Racer Logic
    useEffect(() => {
        if (isRunning && lastStats && lastStats.wpm > 0) {
            // Calculate characters per second based on WPM (standard 5 chars/word)
            const charPerSec = (lastStats.wpm * 5) / 60;
            const intervalMs = 1000 / charPerSec;

            const interval = setInterval(() => {
                setGhostIndex(prev => {
                    if (prev < text.length) return prev + 1;
                    return prev;
                });
            }, intervalMs);

            return () => clearInterval(interval);
        } else if (!isRunning) {
            setGhostIndex(0);
        }
    }, [isRunning, lastStats, text.length]);

    // Focus & CapsLock handler
    useEffect(() => {
        const handleBlur = () => setIsFocused(false);

        const handleGlobalKeyDown = (e) => {
            if (e.getModifierState("CapsLock")) setCapsLock(true);
            else setCapsLock(false);

            if (!isFocused) return;

            // Hotkeys
            if (e.key === 'Tab' || (isFinished && e.key === 'Enter')) {
                e.preventDefault();
                reset();
                return;
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                reset();
                return;
            }

            // Sound & Shake Logic
            if (!e.ctrlKey && !e.altKey && !e.metaKey && e.key.length === 1) {
                playThock();

                // Error Shake check (predictive)
                // If key doesn't match next char, shake.
                const nextChar = text[input.length];
                if (nextChar && e.key !== nextChar) {
                    setShake(prev => prev + 1);
                }
            }

            handleKeyDown(e);
        };

        const handleKeyUp = (e) => {
            if (e.getModifierState("CapsLock")) setCapsLock(true);
            else setCapsLock(false);
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('blur', handleBlur);

        return () => {
            window.removeEventListener('keydown', handleGlobalKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('blur', handleBlur);
        };
    }, [handleKeyDown, engineReset, isFinished, playThock, isFocused, text, input]);

    // Submit stats on finish & Update Last Stats
    useEffect(() => {
        if (isFinished) {
            setLastStats({ wpm: stats.wpm }); // Save for next run
            submitResults();
        }
    }, [isFinished, stats.wpm]);

    const submitResults = async () => {
        try {
            await axios.post('/api/tests', {
                mode: config.mode,
                duration: config.duration,
                wpm: stats.wpm,
                raw_wpm: stats.rawWpm,
                accuracy: stats.accuracy,
                chars_data: []
            });
            console.log('Results saved');
        } catch (error) {
            console.error('Failed to save results', error);
        }
    };

    const words = text.split('');

    return (
        <div
            className="min-h-screen bg-bg-color text-text-main font-sans flex flex-col items-center justify-center p-8 transition-colors duration-300 relative overflow-hidden"
            data-theme={theme}
            style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}
        >
            {/* Focus Overlay */}
            <AnimatePresence>
                {!isFocused && !isFinished && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsFocused(true)}
                        className="absolute inset-0 z-50 flex items-center justify-center bg-bg-color/60 backdrop-blur-sm cursor-pointer"
                    >
                        <div className="text-xl font-mono text-primary flex items-center gap-2">
                            <span className="animate-pulse">Click or Press to Focus</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Caps Lock Warning */}
            <AnimatePresence>
                {capsLock && isFocused && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="fixed top-8 bg-error text-white px-4 py-2 rounded shadow-lg z-40 font-bold"
                    >
                        CAPS LOCK IS ON
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Config & UI Wrapper with Zen Mode Opacity & Shake Effect */}
            <motion.div
                className="w-full max-w-4xl flex flex-col items-center"
                animate={{
                    opacity: zenMode ? 0.3 : 1,
                    x: shake % 2 === 0 ? 0 : [-5, 5, -5, 5, 0] // Simple shake animation keyframes
                }}
                transition={{
                    opacity: { duration: 0.5 },
                    x: { duration: 0.2 }
                }}
                key={shake} // Force re-render animation on shake change
            >
                <ConfigBar
                    config={config}
                    setConfig={setConfig}
                    theme={theme}
                    setTheme={setTheme}
                    soundEnabled={soundEnabled}
                    setSoundEnabled={setSoundEnabled}
                />

                {/* Header / Stats */}
                <div className="w-full flex justify-between items-end mb-12 text-sub font-medium font-mono">
                    <div className="text-3xl font-bold text-main font-sans flex items-center min-h-[40px]">
                        <Typewriter text="FlowType" speed={150} wait={5000} />
                    </div>

                    <div className="flex gap-8 text-2xl">
                        <div className="flex flex-col items-end">
                            <span className="text-xs uppercase tracking-widest text-sub">
                                {config.mode === 'time' ? 'time' : 'words'}
                            </span>
                            <span className="text-primary">{config.mode === 'time' ? timeLeft : `${input.split(' ').length}/${config.wordCount}`}</span>
                        </div>
                        {/* Show Ghost WPM if available */}
                        {lastStats && (
                            <div className="flex flex-col items-end opacity-50">
                                <span className="text-xs uppercase tracking-widest text-sub">last</span>
                                <span>{lastStats.wpm}</span>
                            </div>
                        )}
                        <div className="flex flex-col items-end">
                            <span className="text-xs uppercase tracking-widest text-sub">wpm</span>
                            <span>{stats.wpm}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-xs uppercase tracking-widest text-sub">acc</span>
                            <span>{stats.accuracy}%</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Typing Area (Always visible) */}
            <div className="relative w-full max-w-4xl text-2xl leading-relaxed font-mono break-all outline-none z-10">

                {/* Result Overlay */}
                <AnimatePresence>
                    {isFinished && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                            />

                            <motion.div
                                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                                animate={{ scale: 1, y: 0, opacity: 1 }}
                                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                                className="relative bg-bg-color border border-main/20 p-12 rounded-2xl shadow-2xl max-w-3xl w-full flex flex-col items-center min-h-[400px]"
                            >
                                {/* Decorative line */}
                                <div className="absolute top-0 left-0 w-full h-1 bg-primary opacity-50" />

                                <h2 className="text-4xl font-bold mb-12 text-main tracking-tight">Test Complete</h2>

                                <div className="grid grid-cols-4 gap-8 text-center mb-auto w-full">
                                    <div className="flex flex-col gap-2">
                                        <div className="text-sub text-xs font-bold uppercase tracking-widest">wpm</div>
                                        <div className="text-7xl font-mono text-primary font-bold leading-none drop-shadow-lg">
                                            {stats.wpm}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <div className="text-sub text-xs font-bold uppercase tracking-widest">acc</div>
                                        <div className="text-6xl font-mono text-main font-bold leading-none">
                                            {stats.accuracy}<span className="text-3xl opacity-50">%</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <div className="text-sub text-xs font-bold uppercase tracking-widest">raw</div>
                                        <div className="text-5xl font-mono text-sub font-bold leading-none mt-2">
                                            {stats.rawWpm}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <div className="text-sub text-xs font-bold uppercase tracking-widest">
                                            {config.mode === 'time' ? 'time' : 'words'}
                                        </div>
                                        <div className="text-5xl font-mono text-sub font-bold leading-none mt-2">
                                            {config.mode === 'time' ? config.duration : config.wordCount}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-6 mt-12">
                                    <button
                                        onClick={reset}
                                        className="group px-8 py-3 bg-text-main text-bg-color font-bold rounded-lg flex items-center gap-3 hover:bg-primary hover:text-bg-color transition-all duration-200 outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg-color"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m-15.357-2a7.999 7.999 0 0012.586 1.414m-1.415-1.415L19 19" />
                                        </svg>
                                        <span>Restart Test</span>
                                    </button>
                                </div>
                                <div className="mt-6 text-sub text-xs uppercase tracking-widest opacity-50 font-mono">
                                    <span className="bg-sub/10 px-2 py-1 rounded mx-1">Tab</span> or <span className="bg-sub/10 px-2 py-1 rounded mx-1">Enter</span>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Text render */}
                <div className="relative" onClick={() => document.getElementById('input-capture')?.focus()}>
                    {words.map((char, index) => {
                        const isTyped = index < input.length;
                        const isCorrect = isTyped && input[index] === char;
                        const isCurrent = index === input.length;
                        const isGhostCurrent = isRunning && lastStats && index === ghostIndex;

                        return (
                            <span key={index} className="relative">
                                {/* User Cursor */}
                                {isCurrent && !isFinished && (
                                    <motion.span
                                        layoutId="cursor"
                                        className="absolute left-0 -top-1 bottom-1 w-[2px] bg-primary z-10"
                                        transition={{ layout: { duration: 0.1, type: "spring", stiffness: 600, damping: 30 } }}
                                        animate={{ opacity: isRunning ? 1 : [1, 0, 1] }} // Blink if idle
                                        transitionDict={{ opacity: { repeat: Infinity, duration: 1 } }}
                                    />
                                )}

                                {/* Ghost Cursor - Only show if running and distinct from main cursor position usually */}
                                {isGhostCurrent && !isFinished && (
                                    <motion.span
                                        layoutId="ghost-cursor"
                                        className="absolute left-0 -top-1 bottom-1 w-[2px] bg-sub opacity-50 z-0"
                                        transition={{ layout: { duration: 0.1, type: "linear" } }} // Linear movement for robot
                                    />
                                )}

                                <span className={clsx(
                                    isTyped ? (isCorrect ? 'text-main' : 'text-error underline') : 'text-sub',
                                    'transition-colors duration-100'
                                )}>
                                    {char}
                                </span>
                            </span>
                        );
                    })}
                </div>

            </div>

            {/* Footer */}
            <motion.div
                className="mt-16 text-sub text-sm flex gap-6"
                animate={{ opacity: zenMode ? 0 : 1 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex items-center gap-2">
                    <kbd className="bg-white/10 px-2 py-1 rounded text-xs">tab</kbd>
                    <span>restart</span>
                </div>
                <div className="flex items-center gap-2">
                    <kbd className="bg-white/10 px-2 py-1 rounded text-xs">esc</kbd>
                    <span>stop</span>
                </div>
            </motion.div>

        </div>
    );
}


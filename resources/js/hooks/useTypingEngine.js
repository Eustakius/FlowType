import { useState, useEffect, useCallback, useRef } from 'react';

// Simple word list for MVP generation
const WORD_LIST = [
    "the", "be", "of", "and", "a", "to", "in", "he", "have", "it", "that", "for", "they", "i", "with", "as", "not", "on", "she", "at", "by", "this", "we", "you", "do", "but", "from", "or", "which", "one", "would", "all", "will", "there", "say", "who", "make", "when", "can", "more", "if", "no", "man", "out", "other", "so", "what", "time", "up", "go", "about", "than", "into", "could", "state", "only", "new", "year", "some", "take", "come", "these", "know", "see", "use", "get", "like", "then", "first", "any", "work", "now", "may", "such", "give", "over", "think", "most", "even", "find", "day", "also", "after", "way", "many", "must", "look", "before", "great", "back", "through", "long", "where", "much", "should", "well", "people", "down", "own", "just", "because", "good", "each", "those", "feel", "seem", "how", "high", "too", "place", "little", "world", "very", "still", "nation", "hand", "old", "life", "tell", "write", "become", "here", "show", "house", "large", "animal", "point", "mother", "world", "near", "build", "self", "earth", "father"
];

const generateText = (count = 25) => {
    let result = [];
    for (let i = 0; i < count; i++) {
        result.push(WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)]);
    }
    return result.join(" ");
};

export const useTypingEngine = ({
    duration = 30,
    mode = 'time',
    initialWordCount = 25
} = {}) => {
    // Game State
    const [text, setText] = useState(() => generateText(initialWordCount));
    const [input, setInput] = useState('');
    const [startTime, setStartTime] = useState(null);
    const [timeLeft, setTimeLeft] = useState(duration);
    const [isRunning, setIsRunning] = useState(false);
    const [isFinished, setIsFinished] = useState(false);

    // Stats
    const [wpm, setWpm] = useState(0);
    const [rawWpm, setRawWpm] = useState(0);
    const [accuracy, setAccuracy] = useState(100);

    const intervalRef = useRef(null);

    const calculateStats = useCallback(() => {
        if (!startTime) return;

        const timeNow = Date.now();
        const timeElapsed = (timeNow - startTime) / 1000 / 60; // in minutes

        // Prevent division by zero or negative time
        if (timeElapsed <= 0.0001) return;

        const totalChars = input.length;
        const correctChars = input.split('').filter((char, i) => char === text[i]).length;

        setRawWpm(Math.round((totalChars / 5) / timeElapsed));
        setWpm(Math.round((correctChars / 5) / timeElapsed));

        setAccuracy(totalChars > 0
            ? Math.round((correctChars / totalChars) * 100)
            : 100
        );

        return {
            correctChars,
            incorrectChars: totalChars - correctChars
        };
    }, [input, startTime, text]);

    const start = useCallback(() => {
        setIsRunning(true);
        setStartTime(Date.now());
        setIsFinished(false);

        if (intervalRef.current) clearInterval(intervalRef.current);

        if (mode === 'time') {
            intervalRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        finish();
                        return 0;
                    }
                    return prev - 1;
                });
                calculateStats();
            }, 1000);
        } else if (mode === 'words') {
            // For words mode, we might just track elapsed time for stats, 
            // but maybe we want to show a timer counting up?
            // For now, let's rely on startTime in calculateStats, 
            // but we still need an interval to update specific stats live if we want live WPM 
            // although live WPM in words mode is usually fine.
            intervalRef.current = setInterval(() => {
                calculateStats();
                // We could update a "timeElapsed" state if we wanted to show it
                setTimeLeft(prev => prev + 1);
            }, 1000);
        }
    }, [mode, calculateStats]); // Note: dependency loop handled by ref or careful structure usually, but this is simple enough.

    const stop = useCallback(() => {
        setIsRunning(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
    }, []);

    const finish = useCallback(() => {
        setIsRunning(false); // don't call stop() to avoid loop if stop calls something
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsFinished(true);
        calculateStats();
    }, [calculateStats]);

    // Enhanced Reset: generates new text
    const reset = useCallback(() => {
        stop();
        setText(generateText(initialWordCount));
        setInput('');
        setStartTime(null);
        setTimeLeft(mode === 'time' ? duration : 0);
        setIsFinished(false);
        setWpm(0);
        setRawWpm(0);
        setAccuracy(100);
    }, [duration, stop, initialWordCount]);

    const handleInput = useCallback((char) => {
        if (isFinished) return;

        // Start on first input
        if (!isRunning && !startTime) {
            start();
        }

        setInput(prev => {
            const nextInput = prev + char;

            // Auto-finish detection
            if (nextInput.length >= text.length) {
                // Determine if we should finish immediately logic
                // If typed matching length, finish.
                // We need to use `nextInput` length here since state update is async
                // But we can't call finish() inside setter efficiently without refs usually
                // simpler: let an effect handle it or check here.
                // Checking here is faster for UI response.

                // We need to setFinished(true) but also ensure stats run one last time.
                // Since this runs before state update, we defer finish call slightly or call it after render.
                // Actually, let's use an effect on [input] to check for finish.
            }
            return nextInput;
        });

    }, [isFinished, isRunning, startTime, start, text]);

    const handleKeyDown = useCallback((e) => {
        if (isFinished) return;

        if (e.ctrlKey || e.altKey || e.metaKey) return;
        if (e.key.length > 1 && e.key !== 'Backspace') return;

        if (e.key === 'Backspace') {
            setInput(prev => prev.slice(0, -1));
        } else {
            e.preventDefault();
            handleInput(e.key);
        }
    }, [isFinished, handleInput]);

    // Auto-finish Effect
    useEffect(() => {
        if (isRunning && input.length >= text.length && text.length > 0) {
            finish();
        }
    }, [input, text, isRunning, finish]);

    // Live Stats Effect
    useEffect(() => {
        if (isRunning) {
            calculateStats();
        }
    }, [input, isRunning, calculateStats]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    return {
        input,
        text,
        timeLeft,
        isRunning,
        isFinished,
        stats: { wpm, rawWpm, accuracy },
        start,
        stop,
        reset,
        handleKeyDown,
        config: { duration, mode }
    };
};

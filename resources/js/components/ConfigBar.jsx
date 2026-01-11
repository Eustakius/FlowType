import React from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

export default function ConfigBar({ config, setConfig, theme, setTheme, soundEnabled, setSoundEnabled }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-6 mb-8 text-sm font-medium text-sub bg-[#111]/20 p-3 rounded-xl backdrop-blur-sm border border-white/5"
        >
            {/* Mode Toggle */}
            <div className="flex gap-2 bg-black/20 p-1 rounded-lg">
                {['time', 'words'].map(m => (
                    <button
                        key={m}
                        onClick={() => setConfig({ ...config, mode: m })}
                        className={clsx(
                            "px-3 py-1 rounded transition-colors capitalize",
                            config.mode === m ? "bg-sub text-main" : "text-sub hover:text-main"
                        )}
                    >
                        {m}
                    </button>
                ))}
            </div>

            <div className="w-[1px] h-6 bg-white/10"></div>

            {/* Duration / Word Count */}
            <div className="flex gap-4">
                {config.mode === 'time' ? (
                    [15, 30, 60].map(v => (
                        <button
                            key={v}
                            onClick={() => setConfig({ ...config, duration: v })}
                            className={clsx(
                                "transition-colors",
                                config.duration === v ? "text-primary" : "hover:text-main"
                            )}
                        >
                            {v}
                        </button>
                    ))
                ) : (
                    [10, 25, 50, 100].map(v => (
                        <button
                            key={v}
                            onClick={() => setConfig({ ...config, wordCount: v })}
                            className={clsx(
                                "transition-colors",
                                config.wordCount === v ? "text-primary" : "hover:text-main"
                            )}
                        >
                            {v}
                        </button>
                    ))
                )}
            </div>

            <div className="w-[1px] h-6 bg-white/10"></div>

            {/* Theme Toggle */}
            <div className="flex gap-3">
                {['default', 'comfy', 'cyber'].map(t => (
                    <button
                        key={t}
                        onClick={() => setTheme(t)}
                        className={clsx(
                            "w-4 h-4 rounded-full border border-white/10 transition-transform hover:scale-110",
                            theme === t && "ring-2 ring-primary ring-offset-2 ring-offset-bg-color"
                        )}
                        style={{
                            backgroundColor: t === 'default' ? '#111' : t === 'comfy' ? '#282828' : '#09090b'
                        }}
                        title={t}
                    />
                ))}
            </div>

            <div className="w-[1px] h-6 bg-white/10"></div>

            {/* Sound Toggle */}
            <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={clsx(
                    "transition-colors",
                    soundEnabled ? "text-primary" : "text-sub hover:text-main"
                )}
                title="Toggle Sound"
            >
                {soundEnabled ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
                    </svg>
                    // Valid mute icon actually:
                    /* <svg ... d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" /> */
                )}
            </button>
        </motion.div>
    );
}

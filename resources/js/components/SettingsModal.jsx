import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useSettings } from '../contexts/SettingsContext';

const TABS = [
    { id: 'behavior', label: 'Behavior', icon: '⚡' },
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
    { id: 'sound', label: 'Sound', icon: '🔊' }
];

export default function SettingsModal({ isOpen, onClose }) {
    const { settings, updateSettings, resetSettings } = useSettings();
    const [activeTab, setActiveTab] = useState('behavior');

    // Prevent propagation to avoid closing when clicking inside
    const handleContentClick = (e) => e.stopPropagation();

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="bg-[#1a1a1a] w-full max-w-4xl h-[600px] rounded-2xl shadow-2xl overflow-hidden flex border border-white/10"
                        onClick={handleContentClick}
                    >
                        {/* Sidebar */}
                        <div className="w-64 bg-black/20 border-r border-white/5 p-6 flex flex-col">
                            <h2 className="text-2xl font-bold text-main mb-8 flex items-center gap-2">
                                <span className="text-primary">⚙️</span> Settings
                            </h2>

                            <div className="flex flex-col gap-2">
                                {TABS.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={clsx(
                                            "flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all",
                                            activeTab === tab.id
                                                ? "bg-primary/10 text-primary font-bold"
                                                : "text-sub hover:bg-white/5 hover:text-main"
                                        )}
                                    >
                                        <span>{tab.icon}</span>
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            <div className="mt-auto pt-6 border-t border-white/5">
                                <button
                                    onClick={resetSettings}
                                    className="w-full px-4 py-2 text-error text-sm hover:bg-error/10 rounded transition-colors"
                                >
                                    Reset to Defaults
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-[#1a1a1a]">
                            <h3 className="text-3xl font-bold text-main mb-2 capitalize">{activeTab}</h3>
                            <p className="text-sub mb-8 text-sm">Customize your experience</p>

                            <div className="space-y-8">
                                {activeTab === 'behavior' && (
                                    <div className="space-y-6">
                                        <Section title="Test Configuration">
                                            <SettingRow label="Default Mode">
                                                <ToggleGroup
                                                    options={['time', 'words']}
                                                    value={settings.mode}
                                                    onChange={v => updateSettings('mode', v)}
                                                />
                                            </SettingRow>
                                            <SettingRow label="Default Duration (Time Mode)">
                                                <ToggleGroup
                                                    options={[15, 30, 60, 120]}
                                                    value={settings.duration}
                                                    onChange={v => updateSettings('duration', v)}
                                                />
                                            </SettingRow>
                                            <SettingRow label="Default Word Count">
                                                <ToggleGroup
                                                    options={[10, 25, 50, 100]}
                                                    value={settings.wordCount}
                                                    onChange={v => updateSettings('wordCount', v)}
                                                />
                                            </SettingRow>
                                        </Section>
                                    </div>
                                )}

                                {activeTab === 'appearance' && (
                                    <div className="space-y-6">
                                        <Section title="Visuals">
                                            <SettingRow label="Theme">
                                                <div className="grid grid-cols-3 gap-3">
                                                    {['default', 'comfy', 'cyber'].map(t => (
                                                        <button
                                                            key={t}
                                                            onClick={() => updateSettings('theme', t)}
                                                            className={clsx(
                                                                "px-4 py-3 rounded border text-sm capitalize transition-all",
                                                                settings.theme === t
                                                                    ? "border-primary bg-primary/10 text-primary"
                                                                    : "border-white/10 text-sub hover:border-white/30"
                                                            )}
                                                        >
                                                            {t}
                                                        </button>
                                                    ))}
                                                </div>
                                            </SettingRow>
                                            <SettingRow label="Font Family">
                                                <ToggleGroup
                                                    options={['font-mono', 'font-sans']}
                                                    labels={{ 'font-mono': 'Monospace', 'font-sans': 'Sans-Serif' }}
                                                    value={settings.fontFamily}
                                                    onChange={v => updateSettings('fontFamily', v)}
                                                />
                                            </SettingRow>
                                            <SettingRow label="Caret Style">
                                                <ToggleGroup
                                                    options={['line', 'block', 'underline']}
                                                    value={settings.caretStyle}
                                                    onChange={v => updateSettings('caretStyle', v)}
                                                />
                                            </SettingRow>
                                            <SettingRow label="Blur Strength (UI)">
                                                <ToggleGroup
                                                    options={['none', 'sm', 'md', 'lg']}
                                                    value={settings.blurStrength}
                                                    onChange={v => updateSettings('blurStrength', v)}
                                                />
                                            </SettingRow>
                                        </Section>
                                    </div>
                                )}

                                {activeTab === 'sound' && (
                                    <div className="space-y-6">
                                        <Section title="Audio Feedback">
                                            <SettingRow label="Master Sound">
                                                <button
                                                    onClick={() => updateSettings('soundEnabled', !settings.soundEnabled)}
                                                    className={clsx(
                                                        "w-12 h-6 rounded-full p-1 transition-colors",
                                                        settings.soundEnabled ? "bg-primary" : "bg-white/10"
                                                    )}
                                                >
                                                    <div className={clsx(
                                                        "w-4 h-4 rounded-full bg-white shadow-sm transition-transform",
                                                        settings.soundEnabled ? "translate-x-6" : "translate-x-0"
                                                    )} />
                                                </button>
                                            </SettingRow>

                                            <div className={clsx("transition-opacity", !settings.soundEnabled && "opacity-50 pointer-events-none")}>
                                                <SettingRow label="Volume">
                                                    <input
                                                        type="range"
                                                        min="0" max="1" step="0.1"
                                                        value={settings.soundVolume}
                                                        onChange={(e) => updateSettings('soundVolume', parseFloat(e.target.value))}
                                                        className="w-full accent-primary h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                                    />
                                                </SettingRow>
                                            </div>
                                        </Section>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Close Button top right */}
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 text-sub hover:text-main p-2"
                        >
                            ✕
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// Sub-components for clean code
const Section = ({ title, children }) => (
    <div className="bg-white/5 p-6 rounded-xl border border-white/5">
        <h4 className="text-main font-bold mb-6 text-sm uppercase tracking-wider opacity-80">{title}</h4>
        <div className="space-y-6">{children}</div>
    </div>
);

const SettingRow = ({ label, children }) => (
    <div className="flex flex-col gap-3">
        <label className="text-sub font-medium text-sm">{label}</label>
        <div>{children}</div>
    </div>
);

const ToggleGroup = ({ options, value, onChange, labels = {} }) => (
    <div className="flex bg-black/30 p-1 rounded-lg w-max">
        {options.map(opt => (
            <button
                key={opt}
                onClick={() => onChange(opt)}
                className={clsx(
                    "px-4 py-2 rounded text-sm transition-all capitalize",
                    value === opt ? "bg-sub text-bg-color font-bold shadow-sm" : "text-sub hover:text-main"
                )}
            >
                {labels[opt] || opt}
            </button>
        ))}
    </div>
);

import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
    // Default Settings
    const defaultSettings = {
        theme: 'default', // default, comfy, cyber
        soundEnabled: true,
        soundVolume: 0.5,
        fontFamily: 'font-mono', // font-mono, font-sans, etc.
        caretStyle: 'line', // line, block, underline, box
        zenMode: false,
        blurStrength: 'sm', // none, sm, md, lg

        // Game Config (these were previously separate)
        mode: 'time', // time, words
        duration: 30,
        wordCount: 50,
    };

    // Lazy load from localStorage
    const [settings, setSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('flowtype_settings');
            return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
        } catch (e) {
            console.error("Failed to load settings:", e);
            return defaultSettings;
        }
    });

    // Auto-save to localStorage
    useEffect(() => {
        localStorage.setItem('flowtype_settings', JSON.stringify(settings));

        // Apply Theme to Document Body immediately for global CSS vars
        document.documentElement.setAttribute('data-theme', settings.theme);

        // Apply Font to Body (optional, or just use utility classes)
        // We will likely just pass this down, but setting a CSS var is robust
        // document.documentElement.style.setProperty('--font-family', settings.fontFamily);
    }, [settings]);

    const updateSettings = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const resetSettings = () => setSettings(defaultSettings);

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};

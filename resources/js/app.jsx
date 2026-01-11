import './bootstrap';
import React from 'react';
import { createRoot } from 'react-dom/client';
import Game from './components/Game';
import { SettingsProvider } from './contexts/SettingsContext';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 text-red-500 bg-gray-900 min-h-screen font-mono whitespace-pre-wrap">
                    <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
                    <p className="font-bold text-white mb-2">{this.state.error?.toString()}</p>
                    <pre className="text-xs text-gray-400 overflow-auto max-h-[500px]">
                        {this.state.errorInfo?.componentStack}
                    </pre>
                </div>
            );
        }

        return this.props.children;
    }
}

if (document.getElementById('app')) {
    createRoot(document.getElementById('app')).render(
        <React.StrictMode>
            <ErrorBoundary>
                <SettingsProvider>
                    <Game />
                </SettingsProvider>
            </ErrorBoundary>
        </React.StrictMode>
    );
}

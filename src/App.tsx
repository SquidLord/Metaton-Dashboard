import { useState, useEffect, useRef } from "react";
import "./App.css";

// Modules
import TimeModule from "./modules/TimeModule";
import WeatherModule from "./modules/WeatherModule";
import SystemMonitor from "./modules/SystemMonitor";
import NetworkModule from "./modules/NetworkModule";
import NotesModule from "./modules/NotesModule";
import PomodoroModule from "./modules/PomodoroModule";
import ObliqueStrategiesModule from "./modules/ObliqueStrategiesModule";
import NewsTickerModule from "./modules/NewsTickerModule";

const MODULES_CONFIG = [
    { id: 'time', label: 'Time Module', component: TimeModule, props: { title: 'Time' } },
    { id: 'weather', label: 'Weather Module', component: WeatherModule, props: { title: 'Weather' } },
    { id: 'system', label: 'System Monitor', component: SystemMonitor, props: { title: 'System' } },
    { id: 'network', label: 'Network Traffic', component: NetworkModule, props: { title: 'Network' } },
    { id: 'notes', label: 'Captain\'s Log', component: NotesModule, props: { title: 'Notes' } },
    { id: 'pomodoro', label: 'Pomodoro Timer', component: PomodoroModule, props: { title: 'Pomodoro' } },
    { id: 'oblique', label: 'Oblique Strategies', component: ObliqueStrategiesModule, props: { title: 'Strategies' } },
    { id: 'news', label: 'News Wire', component: NewsTickerModule, props: { title: 'News' } },
];

function App() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showSettings, setShowSettings] = useState(false);
    const [activeModules, setActiveModules] = useState<Record<string, boolean>>(() => {
        const saved = localStorage.getItem('dashboard_modules');
        return saved ? JSON.parse(saved) : {
            time: true,
            weather: true,
            system: true,
            network: true,
            notes: true,
            pomodoro: true,
            oblique: true,
            news: true,
        };
    });

    // Save modules config on change
    useEffect(() => {
        localStorage.setItem('dashboard_modules', JSON.stringify(activeModules));
    }, [activeModules]);

    const settingsRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                showSettings &&
                settingsRef.current &&
                !settingsRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setShowSettings(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showSettings]);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const toggleModule = (id: string) => {
        setActiveModules(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // Reset Logic
    const [isResetting, setIsResetting] = useState(false);
    const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const startReset = () => {
        setIsResetting(true);
        resetTimerRef.current = setTimeout(() => {
            window.location.reload();
        }, 1500); // 1.5s long press
    };

    const cancelReset = () => {
        if (resetTimerRef.current) {
            clearTimeout(resetTimerRef.current);
            resetTimerRef.current = null;
        }
        setIsResetting(false);
    };

    return (
        <div className="container">


            <main className="dashboard-grid">
                <header className="top-bar">
                    <div className="header-left">
                        {/* Settings Toggle */}
                        <button
                            ref={buttonRef}
                            className="settings-button"
                            onClick={() => setShowSettings(!showSettings)}
                            title="Modules"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
                            </svg>
                        </button>

                        {/* App Icon (Long Press to Reset) */}
                        <div
                            className={`icon-container ${isResetting ? 'icon-resetting' : ''}`}
                            onMouseDown={startReset}
                            onMouseUp={cancelReset}
                            onMouseLeave={cancelReset}
                            onTouchStart={startReset}
                            onTouchEnd={cancelReset}
                            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                            title="Long Press to Reset"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--md-sys-color-primary)" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="2" x2="12" y2="22" />
                                <line x1="2" y1="12" x2="22" y2="12" />
                            </svg>
                        </div>
                        <span style={{ fontSize: '18px', fontWeight: 500, fontFamily: 'var(--font-sans)', color: 'var(--md-sys-color-on-background)' }}>
                            Metaton
                        </span>

                        {/* Dropdown Menu */}
                        {showSettings && (
                            <div className="modules-dropdown" ref={settingsRef}>
                                {MODULES_CONFIG.map(mod => (
                                    <label key={mod.id} className="dropdown-item">
                                        <input
                                            type="checkbox"
                                            checked={activeModules[mod.id]}
                                            onChange={() => toggleModule(mod.id)}
                                        />
                                        {mod.label}
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="status-indicator">
                        {/* Dynamic Status Icon */}
                        <svg width="16" height="16" viewBox="0 0 16 16">
                            <circle
                                cx="8" cy="8" r="6"
                                fill={isOnline ? "var(--md-sys-color-tertiary)" : "var(--md-sys-color-error)"}
                                className={isOnline ? "blink-anim" : "offline-icon"}
                            />
                        </svg>
                    </div>
                </header>

                <section className="content-area">
                    {MODULES_CONFIG.map(mod => (
                        activeModules[mod.id] && <mod.component key={mod.id} {...mod.props} />
                    ))}
                </section>
            </main>
        </div>
    );
}

export default App;

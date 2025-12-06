import React, { useState, useEffect } from 'react';
import DashboardWidget from '../components/DashboardWidget';

const PomodoroModule: React.FC<{ title: string }> = ({ title }) => {
    const [seconds, setSeconds] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<'WORK' | 'BREAK'>('WORK');

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;
        if (isActive && seconds > 0) {
            interval = setInterval(() => {
                setSeconds(s => s - 1);
            }, 1000);
        } else if (seconds === 0) {
            setIsActive(false);
            // Auto-switch mode (optional, or just stop)
            if (mode === 'WORK') {
                setMode('BREAK');
                setSeconds(5 * 60);
            } else {
                setMode('WORK');
                setSeconds(25 * 60);
            }
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, seconds, mode]);

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        setSeconds(mode === 'WORK' ? 25 * 60 : 5 * 60);
    };

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const progress = 100 - (seconds / (mode === 'WORK' ? 1500 : 300)) * 100;

    return (
        <DashboardWidget title={title}>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
                <div style={{ fontSize: '1.2em', marginBottom: '10px', color: mode === 'WORK' ? 'var(--color-amber)' : 'var(--color-phosphor)' }}>
                    [{mode === 'WORK' ? 'CYCLE ACTIVE' : 'COOLING DOWN'}]
                </div>

                <div style={{ fontSize: '4em', fontWeight: 'bold', lineHeight: 1, textShadow: `0 0 10px ${mode === 'WORK' ? 'var(--color-amber)' : 'var(--color-phosphor)'}` }}>
                    {formatTime(seconds)}
                </div>

                <div className="progress-bar" style={{ margin: '15px 0' }}>
                    <div style={{
                        width: `${progress}%`,
                        background: mode === 'WORK' ? 'var(--color-amber)' : 'var(--color-phosphor)',
                        boxShadow: `0 0 8px ${mode === 'WORK' ? 'var(--color-amber)' : 'var(--color-phosphor)'}`
                    }}></div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    <button className="retro-btn" onClick={toggleTimer}>
                        {isActive ? 'HALT' : 'INITIATE'}
                    </button>
                    <button className="retro-btn" onClick={resetTimer}>
                        RESET
                    </button>
                    <button className="retro-btn" onClick={() => {
                        const newMode = mode === 'WORK' ? 'BREAK' : 'WORK';
                        setMode(newMode);
                        setSeconds(newMode === 'WORK' ? 25 * 60 : 5 * 60);
                        setIsActive(false);
                    }}>
                        SKIP
                    </button>
                </div>
            </div>
        </DashboardWidget>
    );
};

export default PomodoroModule;

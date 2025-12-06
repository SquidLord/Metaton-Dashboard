import React, { useState, useEffect } from 'react';
import DashboardWidget from '../components/DashboardWidget';

// Calculate Swatch Internet Time (.beats)
const getSwatchTime = () => {
    try {
        const date = new Date();
        // Swatch Time is based on BMT (Biel Mean Time) which is Universal UTC+1
        // date.getTime() is always UTC. We just add 1 hour (3600000ms).
        const bmt = date.getTime() + 3600000;

        // Modulo ms of day. Use absolute to prevent weirdness, though timestamps are positive.
        // We use UTC methods to avoid local timezone interference if we were using getHours() etc.
        // But since we are using raw timestamps, we need to extract the time-of-day component manually.
        const msPerDay = 86400000;
        const millisInDay = bmt % msPerDay;

        const secondsInDay = millisInDay / 1000;

        // 86400 seconds / 1000 beats = 86.4 seconds per beat
        let beats = Math.floor(secondsInDay / 86.4);

        // Safety wrap
        if (beats >= 1000) beats = 0;
        if (beats < 0) beats = 0;
        if (isNaN(beats)) return '---';

        return `@${beats.toString().padStart(3, '0')}`;
    } catch (e) {
        console.error("Swatch Time Error", e);
        return "ERR";
    }
};

const TimeModule: React.FC<{ title: string }> = ({ title }) => {
    const [time, setTime] = useState(new Date());
    const [beats, setBeats] = useState("@000");

    useEffect(() => {
        // Initial set
        setBeats(getSwatchTime());

        const timer = setInterval(() => {
            setTime(new Date());
            setBeats(getSwatchTime());
        }, 1000); // Update every second
        return () => clearInterval(timer);
    }, []);

    return (
        <DashboardWidget title={title}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ fontSize: '2.5em', lineHeight: '1', fontWeight: 'bold' }}>
                    {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    <span style={{ fontSize: '0.6em', marginLeft: '4px', opacity: 0.7 }}>
                        {time.getSeconds().toString().padStart(2, '0')}
                    </span>
                </div>
                <div className="glow-text-green" style={{ fontSize: '1.4em', marginBottom: '4px' }}>
                    {beats} .beats
                </div>
            </div>
            <div style={{ fontSize: '1.1em', opacity: 0.8, marginTop: '4px' }}>
                {time.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase()}
            </div>
        </DashboardWidget>
    );
};

export default TimeModule;

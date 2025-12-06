import React, { useState, useEffect } from 'react';
import DashboardWidget from '../components/DashboardWidget';

const NotesModule: React.FC<{ title: string }> = ({ title }) => {
    const [note, setNote] = useState(() => {
        return localStorage.getItem('captains_log') || '';
    });

    useEffect(() => {
        localStorage.setItem('captains_log', note);
    }, [note]);

    return (
        <DashboardWidget title={title}>
            <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="ENTER LOG ENTRY..."
                style={{
                    width: '100%',
                    height: '100%',
                    minHeight: '150px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-amber)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '1.0em',
                    lineHeight: '1.5',
                    resize: 'none',
                    outline: 'none',
                    textShadow: '0 0 1px var(--color-amber)'
                }}
            />
        </DashboardWidget>
    );
};

export default NotesModule;

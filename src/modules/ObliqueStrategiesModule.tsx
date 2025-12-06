import React, { useState } from 'react';
import DashboardWidget from '../components/DashboardWidget';

const STRATEGIES = [
    "Use an old idea.",
    "State the problem in words as clearly as possible.",
    "Only one element of each kind.",
    "What would your closest friend do?",
    "What to increase? What to reduce?",
    "Are there sections? Consider transitions.",
    "Don't be afraid of things because they're easy to do.",
    "Honor thy error as a hidden intention.",
    "Is there something missing?",
    "Tidy up.",
    "The most important thing is the thing most easily forgotten.",
    "Simple subtraction.",
    "Be dirty.",
    "Ask your body.",
    "Repetition is a form of change.",
    "Look closely at the most embarrassing details and amplify them.",
    "Not building a wall but making a brick.",
    "Work at a different speed.",
    "Disciplined self-indulgence."
];

const ObliqueStrategiesModule: React.FC<{ title: string }> = ({ title }) => {
    const [strategy, setStrategy] = useState(() => {
        return STRATEGIES[Math.floor(Math.random() * STRATEGIES.length)];
    });

    const drawCard = () => {
        // Simple random selection
        const idx = Math.floor(Math.random() * STRATEGIES.length);
        setStrategy(STRATEGIES[idx]);
    };

    return (
        <DashboardWidget title={title}>
            <div style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                padding: '0 10px'
            }}>
                <div style={{
                    fontSize: '1.4em',
                    fontStyle: 'italic',
                    marginBottom: '20px',
                    minHeight: '80px', // Reserve space to prevent layout jump
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    "{strategy}"
                </div>

                <button className="retro-btn" onClick={drawCard} style={{ width: '100%' }}>
                    DRAW CARD
                </button>
            </div>
        </DashboardWidget>
    );
};

export default ObliqueStrategiesModule;

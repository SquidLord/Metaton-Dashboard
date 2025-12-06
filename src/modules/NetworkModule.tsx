import React, { useState, useEffect } from 'react';
import DashboardWidget from '../components/DashboardWidget';
import { invoke } from "@tauri-apps/api/core";

const NetworkModule: React.FC<{ title: string }> = ({ title }) => {
    const [rx, setRx] = useState(0); // Received bytes
    const [tx, setTx] = useState(0); // Transmitted bytes
    const [prevRx, setPrevRx] = useState(0);
    const [prevTx, setPrevTx] = useState(0);
    const [rxSpeed, setRxSpeed] = useState(0); // Bytes per second
    const [txSpeed, setTxSpeed] = useState(0); // Bytes per second

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Returns: [cpu, used_mem, total_mem, rx_total, tx_total]
                const [_cpu, _used, _total, currentRx, currentTx] = await invoke<[number, number, number, number, number]>("get_system_stats");

                // Calculate speed (delta over 1 second)
                if (prevRx !== 0) {
                    setRxSpeed(Math.max(0, currentRx - prevRx));
                    setTxSpeed(Math.max(0, currentTx - prevTx));
                }

                setPrevRx(currentRx);
                setPrevTx(currentTx);
                setRx(currentRx);
                setTx(currentTx);
            } catch (e) {
                console.error("Failed to fetch network stats:", e);
            }
        };

        const interval = setInterval(fetchStats, 1000);
        return () => clearInterval(interval);
    }, [prevRx, prevTx]);

    const formatSpeed = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B/s`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB/s`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB/s`;
    };

    return (
        <DashboardWidget title={title}>
            <div className="stat-row">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ color: '#33FF00' }}>DOWN</span>
                    <span className="glow-text">{formatSpeed(rxSpeed)}</span>
                </div>
                {/* Visualizer Bar for Speed (Logarithmic scaleish) */}
                <div className="progress-bar" style={{ opacity: 0.7 }}>
                    {/* Max speed assumed 10MB/s for visualization scale */}
                    <div style={{ width: `${Math.min(100, (rxSpeed / 1000000) * 10)}%`, background: '#33FF00', boxShadow: '0 0 8px #33FF00' }}></div>
                </div>
            </div>

            <div className="stat-row" style={{ marginTop: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ color: '#FFB000' }}>UP</span>
                    <span className="glow-text">{formatSpeed(txSpeed)}</span>
                </div>
                <div className="progress-bar" style={{ opacity: 0.7 }}>
                    <div style={{ width: `${Math.min(100, (txSpeed / 1000000) * 10)}%` }}></div>
                </div>
            </div>
        </DashboardWidget>
    );
};

export default NetworkModule;

import React, { useState, useEffect } from 'react';
import DashboardWidget from '../components/DashboardWidget';
import { invoke } from "@tauri-apps/api/core";

const SystemMonitor: React.FC<{ title: string }> = ({ title }) => {
    const [cpu, setCpu] = useState(0);
    const [mem, setMem] = useState(0);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [cpuUsage, usedMem, totalMem, _rx, _tx] = await invoke<[number, number, number, number, number]>("get_system_stats");
                setCpu(cpuUsage);
                setMem((usedMem / totalMem) * 100);
            } catch (e) {
                console.error("Failed to fetch stats:", e);
            }
        };

        const interval = setInterval(fetchStats, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <DashboardWidget title={title}>
            <div className="stat-row">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>CPU</span>
                    <span className="glow-text">{Math.round(cpu)}%</span>
                </div>
                <div className="progress-bar">
                    <div style={{ width: `${Math.min(100, Math.max(0, cpu))}%` }}></div>
                </div>
            </div>
            <div className="stat-row">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>MEM</span>
                    <span className="glow-text">{Math.round(mem)}%</span>
                </div>
                <div className="progress-bar">
                    <div style={{ width: `${Math.min(100, Math.max(0, mem))}%` }}></div>
                </div>
            </div>
        </DashboardWidget>
    );
};

export default SystemMonitor;

import React from 'react';

interface DashboardWidgetProps {
    title: string;
    children: React.ReactNode;
    onAction?: () => void;
}

const DashboardWidget: React.FC<DashboardWidgetProps> = ({ title, children, onAction }) => {
    return (
        <div className="dashboard-widget">
            <div className="widget-header">
                <span className="widget-title">{title}</span>
                {onAction && (
                    <button onClick={onAction} className="widget-action-btn">
                        Configure
                    </button>
                )}
            </div>
            <div className="widget-content">
                {children}
            </div>
        </div>
    );
};

export default DashboardWidget;

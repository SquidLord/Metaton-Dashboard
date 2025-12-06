import React from 'react';

export interface ModuleProps {
    title: string;
    config?: Record<string, any>;
}

export type DashboardModule = React.FC<ModuleProps>;

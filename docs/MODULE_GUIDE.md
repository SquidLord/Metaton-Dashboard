# Metaton Module Development Guide

This guide explains how to create, style, and register a new module for the Metaton dashboard.

## 1. Anatomy of a Module

A module is a standard React Functional Component that accepts a `title` prop. It **must** wrap its content in the `DashboardWidget` component to ensure consistent layout and decoration.

### Basic Template (`src/modules/MyNewModule.tsx`)

```tsx
import React, { useState } from 'react';
import DashboardWidget from '../components/DashboardWidget';

const MyNewModule: React.FC<{ title: string }> = ({ title }) => {
    // 1. State Management
    const [count, setCount] = useState(0);

    // 2. Action Handler (Optional)
    // Passed to onAction in DashboardWidget, typically triggers the "gear" icon
    const handleConfigure = () => {
        console.log("Configuration requested");
    };

    return (
        <DashboardWidget 
            title={title} 
            onAction={handleConfigure} // Omit if no configuration needed
        >
            {/* 3. Module Content */}
            <div style={{ padding: '10px', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: '10px' }}>
                    Current Count: {count}
                </div>
                
                {/* Use 'retro-btn' class for styled interactions */}
                <button className="retro-btn" onClick={() => setCount(c => c + 1)}>
                    INCREMENT
                </button>
            </div>
        </DashboardWidget>
    );
};

export default MyNewModule;
```

## 2. Design System & Styling

Metaton uses global CSS variables (defined in `App.css`) to maintain its Cassette Futurism aesthetic.

### Key Colors

| Variable | Value | Usage |
| :--- | :--- | :--- |
| `--color-amber` | `#FFB000` | Primary text, borders, active elements. |
| `--color-phosphor` | `#33FF00` | Success states, active indicators, blink effects. |
| `--color-black` | `#0a0a0a` | Deep black background. |
| `--color-dark-grey`| `#1a1a1a` | Widget background, inactive headers. |
| `--color-light-grey`| `#888888` | Muted text, borders, placeholders. |
| `--color-alert` | `#FF3333` | Errors, warnings, destructive actions. |

### Utility Classes

- `.retro-btn`: Styled button with hover effects and active states.
- `.retro-input`: Styled text input/textarea with border focus.
- `.blink-anim`: Adds a slow blinking opacity animation.
- `.scanline`: (Internal) Adds CRT scanline effect.

### Typography

- Font: **JetBrains Mono** (or fallback monospace).
- Sizes: `0.8em` for labels, `1.2em` for data, `0.7em` for metadata.

## 3. Registering the Module

To make your module appear in the dashboard, you must register it in the `App.tsx` configuration.

1. Open `src/App.tsx`.
2. Import your component:

    ```tsx
    import MyNewModule from "./modules/MyNewModule";
    ```

3. Add it to the `MODULES_CONFIG` array:

    ```tsx
    const MODULES_CONFIG = [
        // ... existing modules
        { 
            id: 'my_module',        // Unique ID for storage
            label: 'My Feature',    // Name in the Settings Dropdown
            component: MyNewModule, // The imported Component
            props: { title: '// MY FEATURE' } // The title displayed on the widget
        },
    ];
    ```

4. (Optional) If you want it enabled by default, add it to the `activeModules` initial state in `App.tsx`.

## 4. Best Practices

- **Responsiveness**: Widgets scale horizontally. Use flexbox or grid for internal layout.
- **Height**: Widgets have a default minimum height (~220px) but can grow.
- **Persistence**: Use `localStorage` to save simple preferences (like API keys or display modes). Namespace your keys (e.g., `mymodule_setting`).
- **Backend Access**: If you need system data, use Tauri's `invoke` command (requires Rust implementation in `main.rs`).

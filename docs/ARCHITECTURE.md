# Metaton Internal Architecture

**Metaton** is a hybrid desktop application combining a high-performance Rust backend with a flexible React frontend, styled with a distinctive "Cassette Futurism" aesthetic.

## 1. Technology Stack

* **Core Framework**: [Tauri v2](https://tauri.app/)
  * **Backend**: Rust (`src-tauri`)
  * **Frontend**: React + TypeScript + Vite (`src`)
* **State Management**: React Hooks + LocalStorage (Persistence)
* **Styling**: Vanilla CSS with CSS Variables (No external UI frameworks)

## 2. Core Concepts

### 2.1 The Module System

Metaton is designed as a modular dashboard. The core application (`App.tsx`) acts as a shell that loads and renders independent **Modules**.

* **Config-Driven**: Modules are defined in the `MODULES_CONFIG` array in `App.tsx`.
* **Dynamic Loading**: The application iterates through this config to render widgets.
* **Isolation**: Each module is self-contained in `src/modules/`, managing its own state and logic.

### 2.2 The Widget Wrapper (`DashboardWidget`)

To ensure visual consistency, **every** module must wrap its content in the `DashboardWidget` component.

* **Role**: Provides the "physical" frame (borders, glowing corners, header, action buttons).
* **Props**:
  * `title`: The name displayed in the widget header.
  * `onAction`: (Optional) Callback for the configuration gear icon.

### 2.3 Backend Communication

Frontend modules request system data using Tauri's IPC (Inter-Process Communication) called `invoke`.

* **Command Pattern**: Rust functions annotated with `#[tauri::command]` in `main.rs` are callable from React.
* **Example**: `invoke('fetch_rss', { url })` delegates network requests to Rust to bypass CORS and improve performance.

## 3. Design System (Cassette Futurism)

The UI is built on a strict set of global CSS variables defined in `App.css`.

| Variable | Role | Color Hex |
| :--- | :--- | :--- |
| `--color-bg` | Deep Void Background | `#0a0a0a` |
| `--color-surface` | Panel Background | `#141414` |
| `--color-amber` | Primary Data/Text | `#FFB000` |
| `--color-dim-amber` | Secondary/Inactive | `#cc8800` |
| `--color-phosphor` | Success/Active | `#33FF00` |
| `--color-alert` | Error/Critical | `#FF3333` |

### Visual Effects

* **CRT Scanlines**: Overlay `div` with `pointer-events: none` and a repeating linear gradient.
* **Screen Curvature**: CSS `box-shadow: inset` creates a vignette/curved glass effect.
* **Text Glow**: `text-shadow` is applied to all primary text to simulate phosphor persistence.

## 4. Data Persistence

Metaton is "serverless" in terms of database. User preferences are persisted locally:

1. **LocalStorage**: Stores module configurations (e.g., `rss_feed_urls`, `weather_loc`).
2. **State Initialization**: Modules use lazy state initialization (`useState(() => localStorage.getItem(...))`) to load saved configs on boot.

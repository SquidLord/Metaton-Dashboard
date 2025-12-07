# Metaton

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Metaton** is a modular dashboard application built with [Tauri](https://tauri.app/), [React](https://reactjs.org/), and [TypeScript](https://www.typescriptlang.org/). It is designed to act as a "second screen" productivity companion, featuring a modern **Material Design 3** aesthetic.

## Features

- **Modular Grid Layout**: Customizable dashboard with toggleable widgets.
- **Material Design 3**: Sleek dark theme with modern typography and elevation.
- **Integrated Modules**:
  - **Time**: Date, time, and active week monitoring.
  - **Weather**: Real-time weather updates (configurable location).
  - **System**: Live CPU and Memory usage tracking.
  - **Network**: Real-time network traffic visualization.
  - **News**: RSS News Ticker.
  - **Strategies**: Oblique Strategies card deck for creative unblocking.
  - **Pomodoro**: Timer with work/break states.
  - **Notes**: Local-storage based scratchpad.
- **Extensible**: Easily add new React-based modules (see [Module Guide](docs/MODULE_GUIDE.md)).

## Documentation

- **[Module Catalog](docs/MODULES.md)**: Detailed guide to all available widgets and their configuration.
- **[Architecture Guide](docs/ARCHITECTURE.md)**: High-level system design, tech stack, and dev concepts.
- **[Developer Guide](docs/MODULE_GUIDE.md)**: How to create new modules.

## Setup & Development

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/tools/install) (for Tauri backend)

### Installation

1. Clone the repository.
2. Install dependencies:

    ```bash
    npm install
    # or
    yarn install
    ```

### Running Locally

Start the development server (Hot Module Replacement active):

```bash
npm run tauri dev
```

### Building for Production

Create a standalone executable:

```bash
npm run tauri build
```

The output binary will be located in `src-tauri/target/release`.

## Project Structure

- `/src`: React Frontend code.
  - `/components`: Reusable UI elements (`DashboardWidget`, inputs).
  - `/modules`: Application feature modules.
  - `App.tsx`: Main layout and module registry.
  - `App.css`: Global styles, Material Design 3 tokens.
- `/src-tauri`: Rust Backend code.
  - `main.rs`: System hooks and command handlers.

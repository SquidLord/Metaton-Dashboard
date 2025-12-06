# Metaton

**Metaton** is a modular, retro-futuristic dashboard application built with [Tauri](https://tauri.app/), [React](https://reactjs.org/), and [TypeScript](https://www.typescriptlang.org/). It is designed to act as a "second screen" productivity companion, featuring a distinctive cassette futurism aesthetic.

## Features

- **Modular Grid Layout**: Customizable dashboard with toggleable widgets.
- **Cassette Futurism Design**: Dedicated design system with CRT effects, Amber monochrome palette, and retro typography.
- **Integrated Modules**:
  - **Chrono**: Date, time, and active week monitoring.
  - **Atmos**: Real-time weather updates (configurable location).
  - **System Mon**: Live CPU and Memory usage tracking.
  - **Netlink**: Real-time network traffic visualization.
  - **Data Feed**: RSS News Ticker with manual truncation and typing effects.
  - **Strategies**: Oblique Strategies card deck for creative unblocking.
  - **Work Cycle**: Pomodoro timer with work/break states.
  - **Captain's Log**: Local-storage based scratchpad.
- **Extensible**: Easily add new React-based modules (see [Module Guide](docs/MODULE_GUIDE.md)).

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
  - `App.css`: Global styles, variables, and CRT effects.
- `/src-tauri`: Rust Backend code.
  - `main.rs`: System hooks and command handlers.

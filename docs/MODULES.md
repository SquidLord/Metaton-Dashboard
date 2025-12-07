# Metaton Module Catalog

This document details the functionality and configuration of each module currently available in the system.

## 1. News Ticker (`NewsTickerModule`)

**Purpose**: Displays headlines from RSS/Atom feeds in a scrolling, type-writer style.

### Features

* **RSS/Atom Parsing**: Supports standard feeds.
* **Smart Filtering**:
  * **Logic**: Fetches articles from the last **3 days**.
  * **Fallback**: If fewer than 5 recent articles are found, displays the top 5 most recent regardless of date.
  * **Safety**: Includes protection against malformed or missing dates.
* **Read State**: Tracks clicked links (changes color) to mark them as "read".
* **Smart Truncation**: Intelligently cuts descriptions at sentence boundaries.

### Configuration

* **Feeds**: List of URLs (one per line).
* **Read Time**: Seconds to display each headline before rotating.
* **Max Length**: Character limit for article descriptions.

### Persistence Keys

* `rss_feed_urls`: Newline-separated list of feed URLs.
* `rss_read_time`: Integer (seconds).
* `rss_truncation_limit`: Integer (chars).
* `read_news_links`: JSON Array of visited URLs.

### Backend Dependencies

* `fetch_rss(url: String) -> String`: Proxies HTTP requests to avoid CORS.

---

## 2. Weather (`WeatherModule`)

**Purpose**: Shows current conditions and an 8-hour forecast for a specific location.

### Features

* **Open-Meteo Integration**: No API key required.
* **Retro Icons**: ASCII-style icons (`☼`, `☁`, `≡`, `☂`, `❄`, `⚡`).
* **Unit Support**: Displays primary Fahrenheit with Celsius sub-label.
* **Auto-Detect**: Uses browser Geolocation + OpenStreetMap Reverse Geocoding.

### Configuration

* **Location**: Search by City Name or ZIP code (uses Nominatim).
* **Auto-Detect**: Button to use system GPS/IP location.

### Persistence Keys

* `weather_loc`: JSON Object `{ lat, lon, name }`.

---

## 3. System Monitor (`SystemMonitor`)

**Purpose**: Real-time display of hardware resources.

### Features

* **CPU**: Overall usage percentage.
* **Memory**: RAM usage percentage and numeric (Used/Total).
* **Swap**: Swap file usage.
* **Visuals**: Progress bars for at-a-glance status.

### Backend Dependencies

* `get_system_stats() -> SystemStats`: Returns CPU, Memory, and Swap data.

---

## 4. Time (`TimeModule`)

**Purpose**: Displays local time and Swatch Internet Time (.beats).

### Features

* **Dual Display**: Standard `HH:MM:SS` and `@BEATS`.
* **Blinking Separators**: Classic digital clock aesthetic.

---

## 5. Network (`NetworkModule`)

**Purpose**: Monitors network traffic throughput.

### Features

* **Up/Down Speed**: Real-time KB/s or MB/s.

---

## 6. Pomodoro (`PomodoroModule`)

**Purpose**: Focus timer for productivity (25m Work / 5m Break).

### Features

* **States**: Work / Break / Idle.
* **Audio**: Simple beep on completion (if enabled).

---

## 7. Notes (`NotesModule`)

**Purpose**: Simple scratchpad for quick text entry.

* **Persistence**: Saves content to `localStorage` (`notes_content`).

---

## 8. Oblique Strategies (`ObliqueStrategiesModule`)

**Purpose**: Creative block breaker.

* **Function**: Displays a random card from Brian Eno's "Oblique Strategies" deck on click.

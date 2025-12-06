import React, { useState, useEffect } from 'react';
import DashboardWidget from '../components/DashboardWidget';

interface WeatherData {
    current: {
        temperature: number;
        weathercode: number;
    };
    hourly: {
        time: string[];
        temperature_2m: number[];
        weathercode: number[];
    };
}

// Simple Retro Weather Icons (ASCII/Text)
const getWeatherIcon = (code: number) => {
    if (code === 0) return '☼'; // Clear sky
    if (code >= 1 && code <= 3) return '☁'; // Cloudy
    if (code >= 45 && code <= 48) return '≡'; // Fog
    if (code >= 51 && code <= 67) return '☂'; // Rain
    if (code >= 71 && code <= 77) return '❄'; // Snow
    if (code >= 95) return '⚡'; // Thunderstorm
    return '?';
};

const getWeatherDesc = (code: number) => {
    if (code === 0) return 'CLEAR';
    if (code >= 1 && code <= 3) return 'CLOUDY';
    if (code >= 51) return 'PRECIP';
    if (code >= 95) return 'STORM';
    return 'UNK';
}

interface LocationData {
    lat: number;
    lon: number;
    name: string;
}

const WeatherModule: React.FC<{ title: string }> = ({ title }) => {
    // Default: Lawrenceville, GA
    const DEFAULT_LOC: LocationData = { lat: 33.9562, lon: -83.9882, name: 'Lawrenceville, GA' };

    // State
    const [location, setLocation] = useState<LocationData>(() => {
        const saved = localStorage.getItem('weather_loc');
        return saved ? JSON.parse(saved) : DEFAULT_LOC;
    });
    const [data, setData] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isConfiguring, setIsConfiguring] = useState(false);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Save location when it changes
    useEffect(() => {
        localStorage.setItem('weather_loc', JSON.stringify(location));
        fetchWeather(); // Refetch on location change
    }, [location]);

    const fetchWeather = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current_weather=true&hourly=temperature_2m,weathercode&timezone=auto`
            );
            const json = await response.json();

            if (json.error) throw new Error(json.reason);

            setData({
                current: {
                    temperature: json.current_weather.temperature,
                    weathercode: json.current_weather.weathercode,
                },
                hourly: {
                    time: json.hourly.time,
                    temperature_2m: json.hourly.temperature_2m,
                    weathercode: json.hourly.weathercode
                }
            });
            setLoading(false);
        } catch (e) {
            console.error("Weather fetch failed", e);
            setLoading(false);
        }
    };

    // Poll every 10 mins
    useEffect(() => {
        const interval = setInterval(fetchWeather, 600000);
        return () => clearInterval(interval);
    }, []);

    // Handlers
    const handleRevert = () => {
        setIsConfiguring(false);
        setSearchResults([]);
        setSearchQuery('');
    };

    const handleAutoDetect = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }
        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                let locName = "Unknown Location";

                try {
                    // Use Nominatim (OSM) for better specificity (Town/Suburb level)
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
                    const data = await res.json();

                    const addr = data.address;
                    // Priority: Village > Town > City > Suburb > County
                    // We want "Lawrenceville" (town/city) over "Gwinnett" (county) or "Atlanta" (nearby city if fuzzy)
                    locName = addr.village || addr.town || addr.city || addr.suburb || data.name || "Auto-Detected Loc";

                    // Add state/country
                    if (addr.state_code || addr.country_code) {
                        locName += `, ${addr.state_code || addr.country_code.toUpperCase()}`;
                    } else if (addr.state) {
                        locName += `, ${addr.state}`;
                    }
                } catch (e) {
                    console.error("Reverse geocoding failed", e);
                    locName = `Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)}`;
                }

                setLocation({
                    lat: lat,
                    lon: lon,
                    name: locName
                });
                setIsConfiguring(false);
            },
            () => {
                alert("Unable to retrieve your location");
                setLoading(false);
            }
        );
    };

    const handleSearch = async () => {
        if (!searchQuery) return;
        setIsSearching(true);
        try {
            // Nominatim Search
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            const data = await res.json();

            const mapped = data.map((item: any) => ({
                id: item.place_id,
                name: item.display_name.split(',')[0],
                detail: item.display_name.split(',').slice(1).join(','),
                latitude: parseFloat(item.lat),
                longitude: parseFloat(item.lon)
            }));

            setSearchResults(mapped || []);
        } catch (e) {
            console.error("Geocoding failed", e);
        }
        setIsSearching(false);
    };

    const selectLocation = (result: any) => {
        setLocation({
            lat: result.latitude,
            lon: result.longitude,
            name: result.name
        });
        handleRevert();
    };

    const renderConfig = () => (
        <div className="weather-config">
            <div className="weather-input-group">
                <input
                    type="text"
                    className="retro-input"
                    placeholder="City or ZIP Code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button className="retro-btn" onClick={handleSearch}>SEARCH</button>
            </div>

            {searchResults.length > 0 && (
                <div className="search-results">
                    {searchResults.map(res => (
                        <div key={res.id} className="search-result-item" onClick={() => selectLocation(res)}>
                            <strong>{res.name}</strong> <small style={{ opacity: 0.7, fontSize: '0.8em' }}>{res.detail.substring(0, 40)}...</small>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ textAlign: 'center', margin: '5px 0' }}>- OR -</div>

            <button className="retro-btn" onClick={handleAutoDetect}>
                AUTO-DETECT LOCATION
            </button>

            <button className="widget-action-btn" style={{ marginTop: '10px', textAlign: 'center', width: '100%' }} onClick={handleRevert}>
                CANCEL
            </button>
        </div>
    );

    const renderHourly = () => {
        if (!data) return null;
        const now = new Date();
        const currentHour = now.getHours();
        const startIndex = currentHour;
        const next8 = data.hourly.temperature_2m.slice(startIndex, startIndex + 6);
        const next8Codes = data.hourly.weathercode.slice(startIndex, startIndex + 6);

        return (
            <div style={{ display: 'flex', marginTop: 'auto', paddingTop: '10px', gap: '4px', overflow: 'hidden' }}>
                {next8.map((temp, i) => (
                    <div key={i} style={{ flex: 1, textAlign: 'center', borderRight: i < 5 ? '1px solid #33FF0033' : 'none', minWidth: '40px' }}>
                        <div style={{ fontSize: '0.7em', opacity: 0.6, marginBottom: '2px' }}>
                            {((currentHour + i) % 24).toString().padStart(2, '0')}H
                        </div>
                        <div style={{ fontSize: '1.2em', marginBottom: '4px', color: 'var(--color-phosphor)' }}>
                            {getWeatherIcon(next8Codes[i])}
                        </div>
                        {/* Fahrenheit Dominant */}
                        <div style={{ fontSize: '1.1em', fontWeight: 'bold' }}>{Math.round(temp * 9 / 5 + 32)}°F</div>
                        <div style={{ fontSize: '0.8em', opacity: 0.6 }}>{Math.round(temp)}°C</div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <DashboardWidget title={title} onAction={() => setIsConfiguring(!isConfiguring)}>
            {isConfiguring ? renderConfig() : (
                loading ? (
                    <div className="glow-text">Scanning atmosphere...</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        {/* Upper Section: Centered Main Weather */}
                        <div style={{
                            flexGrow: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            marginBottom: '10px'
                        }}>
                            <div style={{ fontSize: '4em', lineHeight: '1', color: 'var(--color-phosphor)', marginBottom: '5px' }}>
                                {data ? getWeatherIcon(data.current.weathercode) : '?'}
                            </div>

                            <div className="glow-text" style={{ fontSize: '3em', lineHeight: 1.1, fontWeight: 'bold' }}>
                                {/* Fahrenheit Dominant Main Display */}
                                {Math.round((data!.current.temperature * 9 / 5) + 32)}°F
                                <span style={{ fontSize: '0.5em', opacity: 0.7, marginLeft: '8px' }}>
                                    {data?.current.temperature}°C
                                </span>
                            </div>

                            <div style={{ fontSize: '1.1em', opacity: 0.9, marginTop: '5px', textTransform: 'uppercase' }}>
                                {data ? getWeatherDesc(data.current.weathercode) : 'N/A'}
                            </div>

                            <div style={{ fontSize: '0.9em', opacity: 0.7, marginTop: '2px' }}>
                                {location.name}
                            </div>
                        </div>

                        {/* Lower Section: Hourly Forecast */}
                        {renderHourly()}
                    </div>
                )
            )}
        </DashboardWidget>
    );
};

export default WeatherModule;

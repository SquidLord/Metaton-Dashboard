import React, { useState, useEffect } from 'react';
import DashboardWidget from '../components/DashboardWidget';
import { invoke } from "@tauri-apps/api/core";
import { open } from '@tauri-apps/plugin-shell';

interface Article {
    title: string;
    link: string;
    source: string;
    date: Date;
    description?: string;
}

// Helper for smart truncation (Moved outside component for stability)
const smartTruncate = (text: string, limit: number) => {
    if (text.length <= limit) return text;

    // Look for the last sentence terminator before the limit
    const sub = text.substring(0, limit);
    const lastPeriod = sub.lastIndexOf('.');
    const lastExclam = sub.lastIndexOf('!');
    const lastQuestion = sub.lastIndexOf('?');

    // Find the latest occurrence of any terminator
    const end = Math.max(lastPeriod, lastExclam, lastQuestion);

    if (end > limit * 0.5) { // Ensure we don't cut off too early (must be at least 50% of limit)
        return sub.substring(0, end + 1) + " (CONT)";
    }

    // Fallback if no good sentence end found: standard ellipsis
    return sub.substring(0, limit - 7) + "... (CONT)";
};

// Helper to pick next article (favoring unread)
const getNextArticleIndex = (current: number, articles: Article[], readLinks: Set<string>): number => {
    if (!articles || articles.length === 0) return 0;
    if (articles.length === 1) return 0;

    let checkIndex = (current + 1) % articles.length;
    let attempts = 0;

    // Scan forward. If we find an unread one, take it.
    // If we find a read one, skip it with 85% probability.
    while (attempts < articles.length) {
        const link = articles[checkIndex].link;
        if (!readLinks.has(link)) {
            return checkIndex; // Found unread! Priority.
        }

        // It is read. 15% chance to show it anyway (so we don't never see them)
        // 85% chance to skip
        if (Math.random() < 0.15) {
            return checkIndex;
        }

        // Skip
        checkIndex = (checkIndex + 1) % articles.length;
        attempts++;
    }

    // If we skipped everything or all logic failed, just sequential
    return (current + 1) % articles.length;
};

const NewsTickerModule: React.FC<{ title: string }> = ({ title }) => {
    // Manual Configuration Version - Forced Update
    // Config State
    const [feedUrls, setFeedUrls] = useState(() => localStorage.getItem('rss_feed_urls') || 'https://news.ycombinator.com/rss');
    const [readTime, setReadTime] = useState(() => parseInt(localStorage.getItem('rss_read_time') || '20')); // Default 20s
    const [truncationLimit, setTruncationLimit] = useState(() => parseInt(localStorage.getItem('rss_truncation_limit') || '350')); // Default 350
    const [isConfiguring, setIsConfiguring] = useState(false);
    const [isListing, setIsListing] = useState(false);

    // Temp Config State
    const [tempUrls, setTempUrls] = useState(feedUrls);
    const [tempReadTime, setTempReadTime] = useState(readTime);
    const [tempTruncationLimit, setTempTruncationLimit] = useState(truncationLimit);

    // Read State
    const [readLinks, setReadLinks] = useState<Set<string>>(() => {
        try {
            return new Set(JSON.parse(localStorage.getItem('read_news_links') || '[]'));
        } catch {
            return new Set();
        }
    });

    // Data State
    const [articles, setArticles] = useState<Article[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Display State
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(true);

    // Fetch RSS
    useEffect(() => {
        const fetchFeeds = async () => {
            setLoading(true);
            setError('');
            try {
                const urls = feedUrls.split('\n').map(u => u.trim()).filter(u => u.length > 0);
                if (urls.length === 0) {
                    setArticles([]);
                    setLoading(false);
                    return;
                }

                const promises = urls.map(async (url) => {
                    try {
                        const xmlText = await invoke<string>('fetch_rss', { url });
                        const parser = new DOMParser();
                        const xmlDoc = parser.parseFromString(xmlText, "text/xml");

                        const channelTitle = xmlDoc.querySelector("channel > title")?.textContent?.trim();
                        const feedTitle = xmlDoc.querySelector("feed > title")?.textContent?.trim();
                        let sourceName = channelTitle || feedTitle || "EXT_FEED";

                        sourceName = sourceName.toUpperCase();

                        const items = xmlDoc.querySelectorAll("item, entry");
                        const parsed: Article[] = [];
                        items.forEach(item => {
                            const t = item.querySelector("title")?.textContent;
                            let l = item.querySelector("link")?.textContent;
                            if (!l) l = item.querySelector("link")?.getAttribute("href") || undefined;

                            // Date Parsing
                            const dateStr = item.querySelector("pubDate")?.textContent
                                || item.querySelector("updated")?.textContent
                                || item.querySelector("date")?.textContent;

                            let pubDate = new Date(0); // Default to Epoch
                            if (dateStr) {
                                const parsedDate = new Date(dateStr);
                                if (!isNaN(parsedDate.getTime())) {
                                    pubDate = parsedDate;
                                }
                            }

                            let d = item.querySelector("description")?.textContent || item.querySelector("summary")?.textContent;
                            if (d) {
                                const tempDiv = document.createElement("div");
                                tempDiv.innerHTML = d;
                                d = tempDiv.textContent || tempDiv.innerText || "";

                                // Apply Manual Configurable Truncation
                                d = smartTruncate(d, truncationLimit);
                            }

                            if (t && l) {
                                parsed.push({
                                    title: t.toUpperCase(),
                                    link: l,
                                    source: sourceName,
                                    description: d || "",
                                    date: pubDate
                                });
                            }
                        });


                        // Logic: All entries from last 3 days unless < 5, then take most recent 5
                        const now = new Date();
                        const threeDaysAgo = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000));

                        // Sort by date (descending) - Safe Sort with Explicit NaN Checks
                        parsed.sort((a, b) => {
                            const timeA = a.date.getTime();
                            const timeB = b.date.getTime();
                            // Handle Invalid Dates safely
                            if (isNaN(timeA) && isNaN(timeB)) return 0;
                            if (isNaN(timeA)) return 1; // Invalid dates go last
                            if (isNaN(timeB)) return -1;
                            return timeB - timeA;
                        });

                        const recentArticles = parsed.filter(a => a.date >= threeDaysAgo);

                        if (recentArticles.length >= 5) {
                            return recentArticles;
                        } else {
                            // Fallback to top 5 regardless of date
                            return parsed.slice(0, 5);
                        }
                    } catch (e) {
                        console.warn(`Failed to fetch ${url}`, e);
                        return [];
                    }
                });

                const results = await Promise.all(promises);
                const allArticles = results.flat();

                if (allArticles.length > 0) {
                    setArticles(allArticles);
                } else {
                    setError("NO DATA DECODED");
                }
            } catch (e: any) {
                console.error("RSS Fetch Error", e);
                setError("UPLINK FAILED");
            } finally {
                setLoading(false);
            }
        };

        fetchFeeds();
        const interval = setInterval(fetchFeeds, 600000); // 10 mins
        return () => clearInterval(interval);
    }, [feedUrls, truncationLimit]); // Re-run if limit changes

    // Typing Logic
    useEffect(() => {
        if (loading || articles.length === 0) return;

        const article = articles[currentIndex];
        if (!article) {
            setCurrentIndex(0);
            return;
        }

        const fullText = article.title;
        let charIdx = 0;
        let readTimer: ReturnType<typeof setTimeout>;

        setIsTyping(true);
        setDisplayedText('');

        const typeTimer = setInterval(() => {
            if (charIdx <= fullText.length) {
                setDisplayedText(fullText.slice(0, charIdx));
                charIdx++;
            } else {
                clearInterval(typeTimer);
                setIsTyping(false);

                readTimer = setTimeout(() => {
                    setCurrentIndex(prev => getNextArticleIndex(prev, articles, readLinks));
                }, readTime * 1000);
            }
        }, 30);

        return () => {
            clearInterval(typeTimer);
            clearTimeout(readTimer);
        };
    }, [currentIndex, articles, loading, readTime, readLinks]);

    // Handlers
    const handleSaveConfig = () => {
        localStorage.setItem('rss_feed_urls', tempUrls);
        localStorage.setItem('rss_read_time', tempReadTime.toString());
        localStorage.setItem('rss_truncation_limit', tempTruncationLimit.toString());

        setFeedUrls(tempUrls);
        setReadTime(tempReadTime);
        setTruncationLimit(tempTruncationLimit);

        setIsConfiguring(false);
        setCurrentIndex(0);
    };

    const handleLinkClick = async () => {
        if (!isTyping && articles[currentIndex]) {
            const link = articles[currentIndex].link;

            const newReadLinks = new Set(readLinks);
            newReadLinks.add(link);
            setReadLinks(newReadLinks);
            localStorage.setItem('read_news_links', JSON.stringify(Array.from(newReadLinks)));

            await open(link);
        }
    };

    const isCurrentRead = articles[currentIndex] && readLinks.has(articles[currentIndex].link);

    const textStyle = {
        fontSize: '1.2em',
        lineHeight: '1.4',
        color: isCurrentRead ? 'var(--color-dim-amber)' : 'var(--color-amber)',
        textShadow: isCurrentRead
            ? '2px 0 rgba(255, 0, 0, 0.7), -2px 0 rgba(0, 0, 255, 0.7)'
            : '0 0 2px var(--color-amber)',
        cursor: isTyping ? 'default' : 'pointer',
        opacity: isCurrentRead ? 0.8 : 1,
        transition: 'all 0.3s ease'
    };

    return (
        <DashboardWidget
            title={title}
            onAction={() => {
                setIsConfiguring(!isConfiguring);
                setIsListing(false);
            }}
            onTitleClick={() => {
                setIsListing(!isListing);
                setIsConfiguring(false);
            }}
        >
            {isConfiguring ? (
                <div className="weather-config">
                    <div style={{ fontSize: '0.8em', marginBottom: '5px' }}>ENTER FEED URLS (ONE PER LINE):</div>
                    <textarea
                        className="retro-input"
                        value={tempUrls}
                        onChange={e => setTempUrls(e.target.value)}
                        rows={4}
                        style={{
                            resize: 'none',
                            height: 'auto',
                            minHeight: '60px',
                            width: '100%',
                            boxSizing: 'border-box',
                            whiteSpace: 'pre',
                            overflowX: 'auto',
                            overflowY: 'hidden',
                            marginBottom: '10px'
                        }}
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                        <div>
                            <div style={{ fontSize: '0.7em', marginBottom: '2px' }}>READ TIME (SEC):</div>
                            <input
                                type="number"
                                className="retro-input"
                                value={tempReadTime}
                                onChange={e => setTempReadTime(parseInt(e.target.value) || 20)}
                                style={{ width: '100%' }}
                                min="5"
                            />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.7em', marginBottom: '2px' }}>MAX LENGTH (CHARS):</div>
                            <input
                                type="number"
                                className="retro-input"
                                value={tempTruncationLimit}
                                onChange={e => setTempTruncationLimit(parseInt(e.target.value) || 350)}
                                style={{ width: '100%' }}
                                min="50"
                                step="50"
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                        <button className="retro-btn" onClick={handleSaveConfig} style={{ flex: 1 }}>SAVE & RELOAD</button>
                        <button className="retro-btn" onClick={() => setIsConfiguring(false)} style={{ flex: 1 }}>CANCEL</button>
                    </div>
                </div>
            ) : (
                <>
                    {/* LIST VIEW OVERLAY */}
                    {isListing && (
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            fontFamily: 'var(--font-mono)',
                            overflow: 'hidden',
                            backgroundColor: 'rgba(10, 10, 10, 0.98)',
                            zIndex: 10,
                            padding: '0 0 4px 0' // Maintain partial padding structure
                        }}>
                            <div style={{
                                fontSize: '0.8em',
                                color: 'var(--color-light-grey)',
                                marginBottom: '8px',
                                paddingBottom: '4px',
                                borderBottom: '1px solid #333',
                                flexShrink: 0
                            }}>
                                FEED CONTENTS ({articles.length})
                            </div>
                            <div className="retro-scrollbar" style={{ flexGrow: 1, overflowY: 'auto' }}>
                                {[...articles].reverse().map((art) => {
                                    const isRead = readLinks.has(art.link);
                                    const isCurrent = articles[currentIndex] && articles[currentIndex].link === art.link;

                                    return (
                                        <div
                                            key={art.link}
                                            onClick={() => {
                                                const newReadLinks = new Set(readLinks);
                                                newReadLinks.add(art.link);
                                                setReadLinks(newReadLinks);
                                                localStorage.setItem('read_news_links', JSON.stringify(Array.from(newReadLinks)));
                                                open(art.link);
                                                // setIsListing(false); // Optional: close on click? User didn't ask.
                                            }}
                                            style={{
                                                marginBottom: '8px',
                                                cursor: 'pointer',
                                                opacity: isRead ? 0.5 : 1,
                                                display: 'flex',
                                                gap: '6px',
                                                alignItems: 'baseline'
                                            }}
                                        >
                                            <span style={{ color: isCurrent ? 'var(--color-phosphor)' : '#444' }}>
                                                {isCurrent ? '>' : '•'}
                                            </span>
                                            <div>
                                                <div style={{
                                                    color: isRead ? 'var(--color-dim-amber)' : 'var(--color-amber)',
                                                    fontSize: '0.9em',
                                                    lineHeight: '1.2'
                                                }}>
                                                    {art.title}
                                                </div>
                                                <div style={{ fontSize: '0.7em', color: '#666' }}>
                                                    {art.source} - {art.date.toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* NORMAL TICKER VIEW (Always Rendered underneath) */}
                    <div style={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        fontFamily: 'var(--font-mono)',
                        position: 'relative',
                        overflow: 'hidden',
                        visibility: isListing ? 'hidden' : 'visible' // Hide visibility but keep layout
                    }}>
                        {loading ? (
                            <div className="blink-anim" style={{ margin: 'auto' }}>ESTABLISHING DATA LINK...</div>
                        ) : error ? (
                            <div style={{ color: 'var(--color-alert)', margin: 'auto' }}>ERROR: {error}</div>
                        ) : (
                            <>
                                {/* Header: Headline (Fixed Height for stability) */}
                                <div style={{ flexShrink: 0, marginBottom: '10px', minHeight: '3.4em' }}>
                                    <div
                                        onClick={handleLinkClick}
                                        style={{
                                            cursor: isTyping ? 'default' : 'pointer',
                                            position: 'relative',
                                            display: 'inline-block'
                                        }}
                                    >
                                        <span style={textStyle}>
                                            {displayedText}
                                        </span>
                                        {isTyping && (
                                            <span className="cursor-block" style={{
                                                display: 'inline-block',
                                                width: '10px',
                                                height: '1em',
                                                background: 'var(--color-phosphor)',
                                                marginLeft: '4px',
                                                verticalAlign: 'bottom',
                                                animation: 'blink 1s step-end infinite'
                                            }}></span>
                                        )}
                                    </div>
                                </div>

                                {/* Body: Description (Scrollable Area) */}
                                <div style={{
                                    flexGrow: 1,
                                    overflowY: 'auto', // Restore scrolling
                                    fontSize: '0.9em',
                                    color: 'var(--color-light-grey)',
                                    lineHeight: '1.3',
                                    opacity: isTyping ? 0 : 1,
                                    transition: 'opacity 0.5s ease-in',
                                    minHeight: '0',
                                    paddingRight: '4px',
                                    marginBottom: '10px',
                                    wordWrap: 'break-word',
                                    whiteSpace: 'pre-wrap'
                                }}>
                                    {articles[currentIndex] && articles[currentIndex].description}
                                </div>

                                {/* Footer: Source info (Fixed at bottom) */}
                                {!isConfiguring && !loading && !error && articles[currentIndex] && (
                                    <div style={{
                                        flexShrink: 0,
                                        fontSize: '0.8em',
                                        color: 'var(--color-light-grey)',
                                        borderTop: '1px solid #333',
                                        paddingTop: '5px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        marginTop: 'auto'
                                    }}>
                                        <span style={{
                                            flex: 1,
                                            marginRight: '10px',
                                            wordWrap: 'break-word',
                                            overflowWrap: 'anywhere',
                                            whiteSpace: 'normal',
                                            lineHeight: '1.2'
                                        }}>SRC: {articles[currentIndex].source}</span>
                                        <span style={{ whiteSpace: 'nowrap' }}>{currentIndex + 1}/{articles.length}</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </>
            )}
        </DashboardWidget>
    );
};

export default NewsTickerModule;

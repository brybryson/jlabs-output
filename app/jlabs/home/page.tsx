"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Import Map dynamically to avoid SSR issues
const Map = dynamic(() => import('@/components/Map'), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-[#0B0F17] flex items-center justify-center text-slate-500 font-bold uppercase tracking-widest text-xs">Initializing Satellite...</div>
});

interface GeolocationData {
    ip: string;
    hostname?: string;
    city: string;
    region: string;
    country: string;
    loc: string; // "lat,lng"
    org: string; // ISP
    postal: string;
    timezone: string;
}

interface HistoryItem {
    id: number;
    ipAddress: string;
    city: string | null;
    region: string | null;
    country: string | null;
    isp: string | null;
    asn: string | null;
    timezone: string | null;
    latitude: number | null;
    longitude: number | null;
    geoInfo: any;
    createdAt: string;
}

export default function Home() {
    const router = useRouter();
    const [ipData, setIpData] = useState<GeolocationData | null>(null);
    const [userIp, setUserIp] = useState<string | null>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [selectedHistoryIds, setSelectedHistoryIds] = useState<number[]>([]);
    const [searchInput, setSearchInput] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [networkStatus, setNetworkStatus] = useState('Operational');

    // --- LOGIC ---

    const loadHistory = useCallback(async () => {
        try {
            const res = await fetch('/api/history');
            if (res.ok) {
                const data = await res.json();
                setHistory(data);
            }
        } catch (err) {
            console.error('Failed to load history:', err);
        }
    }, []);

    const fetchIpData = useCallback(async (ip: string = '', isInitial: boolean = false) => {
        setError(null);
        if (!isInitial) setIsSearching(true);

        try {
            // Validate IP if not empty
            if (ip && !/^(\d{1,3}\.){3}\d{1,3}$/.test(ip) && !/^[0-9a-fA-F:]+$/.test(ip)) {
                throw new Error('Invalid IP address format');
            }

            const res = await fetch(`https://ipinfo.io/${ip ? ip + '/' : ''}geo`);
            if (!res.ok) {
                setNetworkStatus('Degraded');
                throw new Error('Failed to fetch geolocation data');
            }

            const data: GeolocationData = await res.json();

            // Validate that we actually have geolocation data (private/bogon IPs lack 'loc')
            if (!data.loc) {
                setNetworkStatus('Degraded');
                throw new Error('Geolocation data not available for this IP (Private/Internal Network)');
            }

            setIpData(data);
            setNetworkStatus('Operational');
            if (isInitial) setUserIp(data.ip);

            // Save to history if it's a manual search and successful
            if (!isInitial) {
                const [lat, lng] = data.loc.split(',').map(Number);
                await fetch('/api/history', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ipAddress: data.ip,
                        city: data.city || 'Unknown',
                        region: data.region || 'Unknown',
                        country: data.country || '??',
                        isp: data.org || 'Unknown Provider',
                        asn: data.org?.match(/AS\d+/)?.[0] || data.org?.split(' ')[0] || 'N/A',
                        timezone: data.timezone || 'UTC',
                        latitude: lat,
                        longitude: lng,
                        geoInfo: data
                    })
                });
                loadHistory();
            }
        } catch (err: any) {
            setError(err.message);
            setNetworkStatus('Interrupted');
        } finally {
            setIsLoading(false);
            setIsSearching(false);
        }
    }, [loadHistory]);

    useEffect(() => {
        fetchIpData('', true);
        loadHistory();
    }, [fetchIpData, loadHistory]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchInput.trim()) {
            fetchIpData(searchInput.trim());
        }
    };

    const handleLogout = async () => {
        try {
            const response = await fetch('/api/logout', { method: 'POST' });
            if (response.ok) router.push('/jlabs/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const handleClearSearch = () => {
        setSearchInput('');
        if (userIp) fetchIpData(userIp, true); // Pass true for isInitial to skip history saving
    };

    const handleHistoryClick = (item: HistoryItem) => {
        setIpData({
            ip: item.ipAddress,
            city: item.city || '',
            region: item.region || '',
            country: item.country || '',
            loc: `${item.latitude},${item.longitude}`,
            org: item.isp || '',
            postal: '',
            timezone: item.timezone || ''
        });
        setSearchInput(item.ipAddress);
    };

    const toggleHistorySelection = (id: number) => {
        setSelectedHistoryIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedHistoryIds.length === history.length && history.length > 0) {
            setSelectedHistoryIds([]);
        } else {
            setSelectedHistoryIds(history.map(h => h.id));
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedHistoryIds.length === 0) return;
        try {
            const res = await fetch('/api/history', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedHistoryIds })
            });
            if (res.ok) {
                setHistory(prev => prev.filter(h => !selectedHistoryIds.includes(h.id)));
                setSelectedHistoryIds([]);
            }
        } catch (err) {
            console.error('Delete failed:', err);
        }
    };

    const [lat, lng, stability, security, ispTier] = useMemo(() => {
        if (!ipData) return [0, 0, '0%', 'N/A', 'Unknown'];
        const [lt, lg] = (ipData.loc || '0,0').split(',').map(Number);

        // Dynamic Stability (Mock fluctuation based on IP/Date)
        const stabValue = (99.7 + (parseInt(ipData.ip.split('.').pop() || '0') % 3) / 10).toFixed(1);

        // Dynamic Security Tier
        const secTier = ipData.ip.includes(':') ? 'Tier S+' : 'Tier A++';

        // Dynamic ISP Tier
        const org = ipData.org?.toLowerCase() || '';
        let tier = 'Direct Backbone';
        if (org.includes('google') || org.includes('amazon') || org.includes('microsoft') || org.includes('cloudflare')) {
            tier = 'Global Core';
        } else if (org.includes('isp') || org.includes('telecom') || org.includes('pldt') || org.includes('globe')) {
            tier = 'Residential Edge';
        }

        return [lt, lg, `${stabValue}% Up`, secTier, tier];
    }, [ipData]);

    return (
        <>
            <style dangerouslySetInnerHTML={{
                __html: `
        @layer base {
            body { 
                @apply bg-[#080B11] text-slate-300 font-['Inter',_sans-serif] overflow-hidden;
            }
        }
        .hide-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
            overflow-y: auto;
        }
        :root {
            --sidebar-width: 280px;
            --sidebar-collapsed-width: 80px;
            --primary: #3b82f6;
            --border-subtle: rgba(255, 255, 255, 0.04);
            --glass-bg: rgba(13, 18, 28, 0.7);
            --card-bg: #111827;
            --radius-main: 1rem;
        }
        .sidebar-transition {
            transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .glass-sidebar {
            background: var(--glass-bg);
            backdrop-filter: blur(20px);
            border-right: 1px solid var(--border-subtle);
        }
        .bento-container {
            background: var(--card-bg);
            border: 1px solid var(--border-subtle);
            border-radius: var(--radius-main);
            box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.2);
            transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .bento-container:hover {
            border-color: rgba(59, 130, 246, 0.2);
            box-shadow: 0 8px 30px -4px rgba(59, 130, 246, 0.1);
        }
        .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.08);
            border-radius: 10px;
        }
        @media (min-width: 1024px) {
            #sidebar-toggle:checked ~ aside {
                width: var(--sidebar-collapsed-width);
            }
            #sidebar-toggle:checked ~ aside .expanded-content {
                opacity: 0;
                pointer-events: none;
                width: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden;
            }
            #sidebar-toggle:checked ~ aside nav,
            #sidebar-toggle:checked ~ aside .nav-footer {
                opacity: 0;
                pointer-events: none;
                display: none;
            }
            #sidebar-toggle:checked ~ aside {
                width: var(--sidebar-collapsed-width);
                overflow: hidden !important;
            }
            aside {
                transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .expanded-content, nav, .nav-footer {
                transition: opacity 0.3s ease, width 0.3s ease, margin 0.3s ease, padding 0.3s ease;
                white-space: nowrap;
            }
        }

        @media (max-width: 1023px) {
            aside {
                max-height: 72px;
                transition: max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.5s ease, box-shadow 0.5s ease;
                background-color: var(--glass-bg);
                backdrop-filter: blur(20px);
                overflow: hidden;
            }
            #sidebar-toggle:checked ~ aside {
                max-height: 600px !important;
                background-color: rgba(13, 18, 28, 0.96) !important;
                backdrop-filter: blur(30px);
                border-bottom: 1px solid rgba(255, 255, 255, 0.12);
                border-bottom-left-radius: 1.5rem;
                border-bottom-right-radius: 1.5rem;
                box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.8);
            }
            .mobile-menu {
                opacity: 0;
                visibility: hidden;
                transform: translateY(-20px);
                transition: opacity 0.3s ease, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), visibility 0s linear 0.4s;
                pointer-events: none;
            }
            #sidebar-toggle:checked ~ aside .mobile-menu {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
                pointer-events: auto;
                transition: opacity 0.4s ease 0.1s, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s, visibility 0s;
            }
        }

        .map-overlay-gradient {
            background: radial-gradient(circle at center, transparent 0%, rgba(8, 11, 17, 0.6) 100%);
            z-index: 20;
        }
        
        /* Ensure Leaflet controls are ALWAYS on top and reachable */
        .leaflet-control-container {
            z-index: 50 !important;
            position: absolute !important;
            inset: 0;
            pointer-events: none;
        }
        .leaflet-control {
            pointer-events: auto !important;
        }
        .leaflet-top.leaflet-right {
            padding-top: 1rem;
            padding-right: 1rem;
        }
        
        .custom-checkbox {
            appearance: none;
            -webkit-appearance: none;
            width: 18px;
            height: 18px;
            border: 1.5px solid rgba(255, 255, 255, 0.15);
            border-radius: 5px;
            background: rgba(255, 255, 255, 0.03);
            cursor: pointer;
            position: relative;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            outline: none;
        }
        .custom-checkbox:checked {
            background: #3b82f6;
            border-color: #3b82f6;
            box-shadow: 0 0 12px rgba(59, 130, 246, 0.4);
        }
        .custom-checkbox:checked::after {
            content: 'check';
            font-family: 'Material Symbols Outlined';
            font-size: 14px;
            font-weight: bold;
            color: white;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }
      `}} />
            <div className="flex flex-col lg:flex-row h-screen w-full relative">
                <input className="hidden" id="sidebar-toggle" type="checkbox" />
                <aside className="sidebar-transition w-full lg:w-[var(--sidebar-width)] h-auto lg:h-full glass-sidebar flex flex-col z-40 lg:relative shrink-0 border-b lg:border-r border-white/5 overflow-hidden">
                    <div className="p-4 lg:p-6 flex items-center justify-between lg:justify-start h-[72px] lg:h-20 shrink-0 border-white/5 w-full bg-transparent relative z-20">
                        <label className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-lg flex items-center justify-center cursor-pointer hover:bg-blue-500/20 transition-all shrink-0 select-none touch-manipulation" htmlFor="sidebar-toggle" style={{ WebkitTapHighlightColor: 'transparent' }}>
                            <span className="material-symbols-outlined text-2xl">menu</span>
                        </label>
                        <div className="expanded-content ml-4 flex items-center gap-3">
                            <img src="/logo/ip-logo.png" alt="GeoIntel Logo" className="w-8 h-8 object-contain drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                            <h1 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 uppercase tracking-widest">GeoIntel</h1>
                        </div>
                    </div>

                    <div className="mobile-menu flex flex-1 overflow-hidden flex-col w-full bg-transparent h-[calc(100vh-72px)] lg:h-auto">
                        <div className="px-6 py-4 expanded-content flex flex-col gap-3 border-b border-white/5 bg-slate-900/40">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Search History ({history.length})</span>
                                {selectedHistoryIds.length > 0 && (
                                    <button
                                        onClick={handleDeleteSelected}
                                        className="text-[9px] font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-widest flex items-center gap-1"
                                    >
                                        <span className="material-symbols-outlined text-xs">delete</span>
                                        Delete ({selectedHistoryIds.length})
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={toggleSelectAll}
                                className="w-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border border-blue-500/20 flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-sm">
                                    {selectedHistoryIds.length === history.length && history.length > 0 ? 'deselect' : 'select_all'}
                                </span>
                                {selectedHistoryIds.length === history.length && history.length > 0 ? 'Deselect All Records' : 'Select All Records'}
                            </button>
                        </div>
                        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto hide-scrollbar">
                            {history.length === 0 ? (
                                <div className="p-6 text-center">
                                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">No history yet</p>
                                </div>
                            ) : (
                                history.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => handleHistoryClick(item)}
                                        className={`group flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${ipData?.ip === item.ipAddress ? 'bg-blue-500/10 border border-blue-500/20' : 'hover:bg-white/5 border border-transparent'}`}
                                    >
                                        <div className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-lg ${ipData?.ip === item.ipAddress ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-800/40 text-slate-400 group-hover:text-blue-400'}`}>
                                            <span className="material-symbols-outlined text-xl">{ipData?.ip === item.ipAddress ? 'my_location' : 'history'}</span>
                                        </div>
                                        <div className="sidebar-item-label flex-1 min-w-0">
                                            <p className={`text-xs font-bold truncate ${ipData?.ip === item.ipAddress ? 'text-white' : 'text-slate-300'}`}>{item.ipAddress}</p>
                                            <p className="text-[10px] text-slate-500">{item.city || 'Unknown'}, {item.country || '??'}</p>
                                        </div>
                                        <input
                                            className="expanded-content custom-checkbox"
                                            type="checkbox"
                                            checked={selectedHistoryIds.includes(item.id)}
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                toggleHistorySelection(item.id);
                                            }}
                                        />
                                    </div>
                                ))
                            )}
                        </nav>
                        <div className="p-4 mt-auto border-t border-white/5 w-full nav-footer space-y-2">
                            <button
                                onClick={handleLogout}
                                className="sidebar-footer-btn w-full h-11 flex items-center gap-3 bg-slate-800/30 hover:bg-red-500/10 hover:text-red-400 text-slate-400 rounded-lg transition-all font-bold text-[11px] uppercase tracking-wider"
                            >
                                <span className="material-symbols-outlined text-lg">logout</span>
                                <span className="expanded-content">Sign Out</span>
                            </button>
                        </div>
                    </div>
                </aside>

                <main className="flex-1 flex flex-col p-4 md:p-8 lg:p-12 overflow-y-auto w-full h-[calc(100vh-72px)] lg:h-full hide-scrollbar">
                    <header className="mb-6 lg:mb-10 flex flex-col md:flex-row items-stretch md:items-center gap-4 lg:gap-6">
                        <form onSubmit={handleSearch} className="relative flex-1 w-full md:max-w-3xl">
                            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-500">
                                <span className="material-symbols-outlined">search</span>
                            </div>
                            <input
                                className={`w-full bg-[#111827] border rounded-2xl py-5 pl-14 pr-52 text-base font-medium text-white focus:ring-2 focus:ring-blue-500/40 outline-none transition-all placeholder:text-slate-600 ${error ? 'border-red-500/50 focus:ring-red-500/20' : 'border-white/5'}`}
                                placeholder="Search IPv4/IPv6 Address..."
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                            />
                            <div className="absolute inset-y-0 right-4 flex items-center gap-3">
                                <button
                                    type="submit"
                                    disabled={isSearching}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-5 h-10 rounded-xl font-bold text-xs transition-all uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSearching ? 'Locating...' : <>Locate <span className="material-symbols-outlined text-lg">explore</span></>}
                                </button>
                            </div>
                        </form>
                        <div className="flex items-center gap-2 md:gap-3 md:ml-auto w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                            <button
                                onClick={handleClearSearch}
                                className="flex-1 md:flex-none px-4 h-12 md:h-14 bg-[#111827] border border-white/5 rounded-xl md:rounded-2xl text-slate-400 hover:text-blue-400 transition-all flex items-center justify-center gap-2 text-[10px] md:text-xs font-bold uppercase tracking-wider whitespace-nowrap"
                            >
                                <span className="material-symbols-outlined text-lg md:text-xl">person_pin</span>
                                <span className="inline-block">Reset IP</span>
                            </button>
                            <div className="w-px h-6 md:h-8 bg-white/5 mx-1 md:mx-2 hidden md:block"></div>
                            <button className="shrink-0 w-12 h-12 md:w-14 md:h-14 bg-[#111827] border border-white/5 rounded-xl md:rounded-2xl text-slate-400 hover:text-white transition-all flex items-center justify-center relative">
                                <span className="material-symbols-outlined text-lg md:text-xl">dns</span>
                                <span className="absolute top-3 md:top-4 right-3 md:right-4 w-2 h-2 bg-emerald-500 rounded-full border-2 border-[#111827] shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                            </button>
                            <div className="flex flex-col ml-1 md:ml-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Network Status</span>
                                <span className={`text-[11px] font-bold uppercase ${networkStatus === 'Operational' ? 'text-emerald-500' : 'text-amber-500'}`}>{networkStatus}</span>
                            </div>
                        </div>
                    </header>

                    {error && (
                        <div className="mb-6 p-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-xl">warning</span>
                            </div>
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-12 gap-4 lg:gap-6 flex-1 min-h-[auto] xl:min-h-[650px]">
                        <div className="order-2 xl:order-1 col-span-12 xl:col-span-4 bento-container flex flex-col overflow-visible xl:overflow-hidden h-fit xl:h-auto">
                            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                                        <span className="material-symbols-outlined text-xl">dataset</span>
                                    </div>
                                    <h2 className="text-sm font-bold text-white uppercase tracking-widest">Network Intelligence</h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold ${networkStatus === 'Operational' ? 'text-emerald-500 bg-emerald-500/10' : 'text-amber-500 bg-amber-500/10'} px-2 py-0.5 rounded uppercase`}>
                                        {isSearching ? 'Fetching...' : 'Target Focus'}
                                    </span>
                                </div>
                            </div>

                            {isLoading ? (
                                <div className="p-12 flex flex-col items-center justify-center gap-4 text-center">
                                    <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Analyzing Target...</p>
                                </div>
                            ) : ipData ? (
                                <div className="p-8 space-y-8 flex-1 animate-in fade-in slide-in-from-left-4 duration-500">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Public IP Address</p>
                                        <div className="flex items-center gap-3 group flex-wrap">
                                            <span className="text-3xl md:text-4xl font-black text-white tracking-tighter break-all">{ipData.ip}</span>
                                            <button className="text-slate-600 hover:text-blue-400 transition-colors" title="Copy to clipboard">
                                                <span className="material-symbols-outlined text-xl">content_copy</span>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="flex items-start gap-4 pb-5 border-b border-white/5">
                                            <span className="material-symbols-outlined text-slate-500 text-xl mt-1">location_on</span>
                                            <div className="flex-1">
                                                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-0.5">Location</p>
                                                <p className="text-sm font-semibold text-slate-200 break-words leading-tight">{ipData.city && ipData.region ? `${ipData.city}, ${ipData.region}` : (ipData.city || ipData.region || 'Unknown Location')}</p>
                                                <p className="text-[11px] text-slate-500">{ipData.country} · Geographic Center</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4 pb-5 border-b border-white/5">
                                            <span className="material-symbols-outlined text-slate-500 text-xl mt-1">dns</span>
                                            <div className="flex-1">
                                                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-0.5">Provider Network</p>
                                                <p className="text-sm font-semibold text-slate-200 break-words leading-tight pr-2">{ipData.org || 'Private Network'}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">NODE_ID: {ipData.postal || 'N/A'}</span>
                                                    <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded">Operational</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <span className="material-symbols-outlined text-slate-500 text-xl mt-1">schedule</span>
                                            <div className="flex-1">
                                                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-0.5">Local Timezone</p>
                                                <p className="text-sm font-semibold text-slate-200">{ipData.timezone}</p>
                                                <p className="text-[11px] text-slate-500">UTC System Standard</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 pt-4">
                                        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 group hover:border-blue-500/30 transition-all">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-[9px] font-bold text-slate-600 uppercase">Latitude</span>
                                            </div>
                                            <p className="text-sm font-mono font-bold text-slate-300 tracking-tight">{lat}</p>
                                        </div>
                                        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 group hover:border-blue-500/30 transition-all">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-[9px] font-bold text-slate-600 uppercase">Longitude</span>
                                            </div>
                                            <p className="text-sm font-mono font-bold text-slate-300 tracking-tight">{lng}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-12 text-center">
                                    <p className="text-sm text-slate-600">No data available for this target.</p>
                                </div>
                            )}
                        </div>

                        <div className="order-1 xl:order-2 col-span-12 xl:col-span-8 bento-container relative overflow-hidden flex flex-col min-h-[400px] xl:min-h-[500px]">
                            {ipData && (
                                <div className="flex-1 w-full h-full relative">
                                    <Map lat={lat} lng={lng} ip={ipData.ip} />
                                    <div className="absolute inset-0 map-overlay-gradient pointer-events-none z-20"></div>
                                    <div className="absolute top-6 left-6 z-30 flex flex-col gap-2">
                                        <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${networkStatus === 'Operational' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500 animate-pulse'} shadow-[0_0_10px_rgba(16,185,129,0.4)]`}></div>
                                            <span className="text-[10px] font-extrabold text-white tracking-widest uppercase">Live Tracking Active</span>
                                        </div>
                                    </div>
                                    <div className="absolute bottom-6 left-6 right-6 z-30 pointer-events-none lg:pointer-events-auto">
                                        <div className="hidden md:grid grid-cols-4 gap-4">
                                            <div className="bg-slate-900/80 backdrop-blur-xl p-4 rounded-xl border border-white/10">
                                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1">Status</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold text-white">Live Node</span>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                </div>
                                            </div>
                                            <div className="bg-slate-900/80 backdrop-blur-xl p-4 rounded-xl border border-white/10">
                                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1">Stability</p>
                                                <p className={`text-sm font-semibold ${parseFloat(stability) > 99.8 ? 'text-emerald-400' : 'text-blue-400'}`}>{stability}</p>
                                            </div>
                                            <div className="bg-slate-900/80 backdrop-blur-xl p-4 rounded-xl border border-white/10">
                                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1">Security</p>
                                                <p className="text-sm font-semibold text-blue-400">{security}</p>
                                            </div>
                                            <div className="bg-slate-900/80 backdrop-blur-xl p-4 rounded-xl border border-white/10">
                                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1">ISP Tier</p>
                                                <p className="text-sm font-semibold text-white">{ispTier}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}

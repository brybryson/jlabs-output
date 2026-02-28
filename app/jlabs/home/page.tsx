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
    const [copySuccess, setCopySuccess] = useState(false);

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
        setIsLoading(true);
        setError(null);
        if (!ip) setIsSearching(true);

        try {
            let targetIp = ip;

            // If no IP provided (Initial load or Reset), pre-detect via client-side for VPN reliability
            if (!targetIp) {
                try {
                    const ipifyRes = await fetch('https://api.ipify.org?format=json', { cache: 'no-store' });
                    if (ipifyRes.ok) {
                        const { ip: detectedIp } = await ipifyRes.json();
                        targetIp = detectedIp;
                    }
                } catch (e) {
                    console.warn('Client-side IP detection failed, falling back to server detection');
                }
            }

            // Validate IP if not empty
            if (targetIp && !/^(\d{1,3}\.){3}\d{1,3}$/.test(targetIp) && !/^[0-9a-fA-F:]+$/.test(targetIp)) {
                throw new Error('Invalid IP address format');
            }

            // Just clear the input, don't unmount the map to prevent shaking
            if (targetIp !== userIp) {
                // No need to setIpData(null) or wait, Map will handle flyTo
            }

            const res = await fetch(`/api/geolocation${targetIp ? `?ip=${targetIp}` : ''}`, { cache: 'no-store' });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                setNetworkStatus('Degraded');
                throw new Error(errorData.message || 'Failed to fetch geolocation data');
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

            // Save to history automatically
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
                    postal: data.postal,
                    geoInfo: data
                })
            });
            loadHistory();
        } catch (err: any) {
            setError(err.message);
            setNetworkStatus('Interrupted');
        } finally {
            setIsLoading(false);
            setIsSearching(false);
        }
    }, [loadHistory, userIp]);

    useEffect(() => {
        fetchIpData('', true);
        loadHistory();
    }, [fetchIpData, loadHistory]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const ip = searchInput.trim();

        if (!ip) return;

        // IPv4 Regex: 4 octets, each 0-255
        const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

        if (!ipv4Regex.test(ip)) {
            setError('Invalid IPv4 Address format (e.g. 192.168.1.1, max 255 per part)');
            setNetworkStatus('Interrupted');
            return;
        }

        setError(null);
        fetchIpData(ip);
    };

    const handleLogout = async () => {
        try {
            const response = await fetch('/api/logout', { method: 'POST' });
            if (response.ok) router.push('/jlabs/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const handleCopyIp = async (ip: string) => {
        try {
            await navigator.clipboard.writeText(ip);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleClearSearch = () => {
        setSearchInput('');
        fetchIpData('', true); // Re-detect current connection IP
    };

    const handleHistoryClick = (item: HistoryItem) => {
        setIpData({
            ip: item.ipAddress,
            city: item.city || '',
            region: item.region || '',
            country: item.country || '',
            loc: `${item.latitude},${item.longitude}`,
            org: item.isp || '',
            postal: item.geoInfo?.postal || '',
            timezone: item.timezone || ''
        });
        setSearchInput(item.ipAddress);

        // Auto-close sidebar on mobile
        const sidebarToggle = document.getElementById('sidebar-toggle') as HTMLInputElement;
        if (sidebarToggle) sidebarToggle.checked = false;
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
            transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .glass-sidebar {
            background: var(--glass-bg);
            backdrop-filter: blur(16px);
            border-right: 1px solid var(--border-subtle);
            transition: background-color 0.4s ease, width 0.4s cubic-bezier(0.4, 0, 0.2, 1), max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            will-change: width, transform;
        }
        .bento-container {
            background: var(--card-bg);
            border: 1px solid var(--border-subtle);
            border-radius: var(--radius-main);
            box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.2);
            transition: border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease;
        }
        .bento-container:hover {
            border-color: rgba(59, 130, 246, 0.2);
            box-shadow: 0 8px 30px -4px rgba(59, 130, 246, 0.1);
            transform: translateY(-2px);
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
                transform: translateX(-10px);
                pointer-events: none;
                width: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden;
            }
            #sidebar-toggle:checked ~ aside nav {
                padding-left: 0;
                padding-right: 0;
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            #sidebar-toggle:checked ~ aside .nav-footer {
                padding-left: 0;
                padding-right: 0;
                display: flex;
                justify-content: center;
            }
            #sidebar-toggle:checked ~ aside .sidebar-item-label,
            #sidebar-toggle:checked ~ aside .custom-checkbox {
                display: none;
            }
            #sidebar-toggle:checked ~ aside .group {
                justify-content: center;
                width: 56px;
                padding-left: 0;
                padding-right: 0;
            }
            #sidebar-toggle:checked ~ aside .sidebar-footer-btn {
                justify-content: center;
                width: 56px;
                padding-left: 0;
                padding-right: 0;
            }
            #sidebar-toggle:checked ~ aside .p-4.lg\:p-6.flex {
                justify-content: center;
                padding-left: 0;
                padding-right: 0;
            }
            #sidebar-toggle:checked ~ aside .p-4.lg\:p-6.flex label {
                margin: 0;
            }
            #sidebar-toggle:checked ~ aside .expanded-content.ml-4 {
                display: none;
            }
            aside {
                transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .expanded-content, nav, .nav-footer {
                transition: opacity 0.3s ease, transform 0.3s ease, width 0.3s ease, margin 0.3s ease, padding 0.3s ease;
                white-space: nowrap;
            }
        }

        @media (max-width: 1023px) {
            aside {
                position: fixed;
                top: 0;
                left: 0;
                width: 100% !important;
                height: 100% !important;
                background-color: rgba(13, 18, 28, 0.98);
                backdrop-filter: blur(16px);
                transform: translateX(-100%);
                transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                z-index: 1100;
                border-right: 1px solid rgba(255, 255, 255, 0.1);
                will-change: transform;
            }
            #sidebar-toggle:checked ~ aside {
                transform: translateX(0);
                box-shadow: 20px 0 50px rgba(0, 0, 0, 0.5);
            }
            .mobile-menu {
                display: flex;
                flex-direction: column;
                height: 100%;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            #sidebar-toggle:checked ~ aside .mobile-menu {
                opacity: 1;
                transition: opacity 0.4s ease 0.2s;
            }
            .mobile-header-only {
                display: flex;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 80px;
                padding: 0 1.5rem;
                align-items: center;
                justify-content: space-between;
                background: rgba(8, 11, 17, 0.85);
                backdrop-filter: blur(12px);
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                z-index: 1000;
            }
        }
        @media (min-width: 1024px) {
            .mobile-header-only {
                display: none;
            }
        }

        .map-overlay-gradient {
            background: radial-gradient(circle at center, transparent 0%, rgba(8, 11, 17, 0.6) 100%);
            z-index: 20;
        }
        
        /* Adjust Leaflet controls to be below headers but above map */
        .leaflet-control-container {
            z-index: 500 !important;
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

                {/* Mobile Top Header */}
                <div className="mobile-header-only">
                    <div className="flex items-center gap-3">
                        <img src="/logo/ip-logo.png" alt="GeoIntel Logo" className="w-8 h-8 object-contain drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                        <h1 className="text-base font-bold text-white uppercase tracking-widest">GeoIntel</h1>
                    </div>
                    <label className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center cursor-pointer hover:bg-blue-500/20 active:scale-95 transition-all" htmlFor="sidebar-toggle">
                        <span className="material-symbols-outlined text-3xl">menu</span>
                    </label>
                </div>

                <aside className="sidebar-transition w-full lg:w-[var(--sidebar-width)] h-full glass-sidebar flex flex-col z-[110] lg:relative shrink-0 border-r border-white/5 overflow-hidden">
                    <div className="p-4 lg:p-6 flex items-center justify-between lg:justify-start h-20 shrink-0 w-full bg-transparent relative z-20">
                        <label className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-lg flex items-center justify-center cursor-pointer hover:bg-blue-500/20 transition-all shrink-0 select-none touch-manipulation" htmlFor="sidebar-toggle" style={{ WebkitTapHighlightColor: 'transparent' }}>
                            <span className="material-symbols-outlined text-2xl">menu_open</span>
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

                <main className="flex-1 flex flex-col p-4 md:p-8 lg:p-12 overflow-y-auto w-full h-full pt-[100px] md:pt-[120px] lg:pt-12 hide-scrollbar">
                    <header className="mb-6 lg:mb-10 flex flex-col md:flex-row items-stretch md:items-center gap-4 lg:gap-6">
                        <form onSubmit={handleSearch} className="relative flex-1 w-full md:max-w-3xl">
                            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-500">
                                <span className="material-symbols-outlined">search</span>
                            </div>
                            <input
                                className={`w-full bg-[#111827] border rounded-2xl py-5 pl-14 pr-20 text-base font-medium text-white focus:ring-2 focus:ring-blue-500/40 outline-none transition-all placeholder:text-slate-600 ${error ? 'border-red-500/50 focus:ring-red-500/20' : 'border-white/5'}`}
                                placeholder="Search IPv4 Address (e.g. 8.8.8.8)..."
                                type="text"
                                value={searchInput}
                                onChange={(e) => {
                                    // Restrict to numbers and dots only
                                    const val = e.target.value.replace(/[^0-9.]/g, '');
                                    setSearchInput(val);
                                }}
                                onPaste={(e) => {
                                    // Support pasting with auto-cleanup (strip leading/trailing whitespace)
                                    const pastedData = e.clipboardData.getData('text');
                                    // We can be a bit smarter here: if there's an IP followed by junk, just take the IP
                                    const ipMatch = pastedData.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/);
                                    if (ipMatch) {
                                        e.preventDefault();
                                        setSearchInput(ipMatch[0]);
                                    }
                                    // Otherwise let onChange handle the raw numeric/dot stripping
                                }}
                            />
                            <div className="absolute inset-y-0 right-4 flex items-center gap-3">
                                <button
                                    type="submit"
                                    disabled={isSearching}
                                    className="bg-blue-600 hover:bg-blue-500 text-white w-12 h-10 rounded-xl font-bold transition-all flex items-center justify-center disabled:opacity-50"
                                    title="Locate Target"
                                >
                                    {isSearching ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <span className="material-symbols-outlined text-xl">explore</span>
                                    )}
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
                            <div className="flex items-center gap-3 px-4 h-12 md:h-14 bg-[#111827] border border-white/5 rounded-xl md:rounded-2xl shrink-0">
                                <div className="relative flex items-center justify-center">
                                    <span className="material-symbols-outlined text-slate-400 text-lg md:text-xl">dns</span>
                                    <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full border-2 border-[#111827] shadow-[0_0_8px_rgba(16,185,129,0.5)] ${networkStatus === 'Operational' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Network Status</span>
                                    <span className={`text-[11px] font-bold uppercase ${networkStatus === 'Operational' ? 'text-emerald-500' : 'text-amber-500'}`}>{networkStatus}</span>
                                </div>
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
                                            <button
                                                onClick={() => handleCopyIp(ipData.ip)}
                                                className={`transition-all duration-300 ${copySuccess ? 'text-emerald-500 scale-110' : 'text-slate-600 hover:text-blue-400'}`}
                                                title={copySuccess ? 'Copied!' : 'Copy to clipboard'}
                                            >
                                                <span className="material-symbols-outlined text-xl">
                                                    {copySuccess ? 'check_circle' : 'content_copy'}
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="flex items-start gap-4 pb-5 border-b border-white/5">
                                            <span className="material-symbols-outlined text-slate-500 text-xl mt-1">location_on</span>
                                            <div className="flex-1">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Location</p>
                                                <p className="text-white font-bold">{ipData.city || 'Unknown'}, {ipData.region || 'Unknown'}</p>
                                                <p className="text-[11px] text-slate-400 mt-1">{ipData.country || '??'} · Geographic Center</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4 pb-5 border-b border-white/5">
                                            <span className="material-symbols-outlined text-slate-500 text-xl mt-1">dns</span>
                                            <div className="flex-1">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Provider Network</p>
                                                <p className="text-white font-bold leading-tight">{ipData.org || 'Unknown Provider'}</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="px-1.5 py-0.5 bg-slate-800 text-slate-400 text-[9px] font-bold rounded">NODE_ID: {ipData.org?.match(/\d+/)?.[0] || '1400'}</span>
                                                    <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 text-[9px] font-bold rounded uppercase">Operational</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <span className="material-symbols-outlined text-slate-500 text-xl mt-1">schedule</span>
                                            <div className="flex-1">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Local Timezone</p>
                                                <p className="text-white font-bold">{ipData.timezone || 'UTC'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-slate-900/40 rounded-xl border border-white/5">
                                            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1">Latitude</p>
                                            <p className="text-white font-mono text-sm">{lat.toFixed(4)}</p>
                                        </div>
                                        <div className="p-4 bg-slate-900/40 rounded-xl border border-white/5">
                                            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1">Longitude</p>
                                            <p className="text-white font-mono text-sm">{lng.toFixed(4)}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-12 text-center">
                                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Awaiting Analysis...</p>
                                </div>
                            )}
                        </div>

                        <div className="order-1 xl:order-2 col-span-12 xl:col-span-8 flex flex-col gap-4 lg:gap-6">
                            <div className="flex-1 bento-container overflow-hidden relative min-h-[400px] xl:min-h-0">
                                <div className="absolute top-6 left-6 z-30 pointer-events-none">
                                    <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded-full flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">Live Tracking Active</span>
                                    </div>
                                </div>
                                <div className="absolute bottom-6 right-6 z-30 pointer-events-none hidden md:flex flex-col items-end gap-2">
                                    <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg">
                                        <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Coverage</p>
                                        <p className="text-[10px] font-bold text-white uppercase">Global Satellite</p>
                                    </div>
                                </div>
                                <div className="w-full h-full relative">
                                    <div className="absolute inset-0 map-overlay-gradient pointer-events-none"></div>
                                    <Map lat={lat} lng={lng} ip={ipData?.ip || userIp || '0.0.0.0'} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 shrink-0">
                                <div className="bento-container p-5 lg:p-6 text-center lg:text-left">
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Status</p>
                                    <div className="flex items-center justify-center lg:justify-start gap-2">
                                        <p className="text-sm font-black text-white">Live Node</p>
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                    </div>
                                </div>
                                <div className="bento-container p-5 lg:p-6 text-center lg:text-left">
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Stability</p>
                                    <p className="text-sm font-black text-blue-400">{stability}</p>
                                </div>
                                <div className="bento-container p-5 lg:p-6 text-center lg:text-left">
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Security</p>
                                    <p className="text-sm font-black text-blue-400">{security}</p>
                                </div>
                                <div className="bento-container p-5 lg:p-6 text-center lg:text-left">
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">ISP Tier</p>
                                    <p className="text-sm font-black text-white truncate">{ispTier}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}

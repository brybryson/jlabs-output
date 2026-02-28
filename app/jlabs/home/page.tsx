"use client";

export default function Home() {
    return (
        <>
            <style dangerouslySetInnerHTML={{
                __html: `
        @layer base {
            body { 
                @apply bg-[#080B11] text-slate-300 font-['Inter',_sans-serif] overflow-hidden;
            }
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
                transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.4s ease;
                background-color: #080B11;
                overflow: hidden !important;
            }
            #sidebar-toggle:checked ~ aside {
                max-height: 900px !important;
                background-color: rgba(8, 11, 17, 0.85) !important;
                backdrop-filter: blur(16px);
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                border-bottom-left-radius: 1rem;
                border-bottom-right-radius: 1rem;
                box-shadow: 0 20px 40px -10px rgba(0,0,0,0.5);
            }
            .mobile-menu {
                opacity: 0;
                transform: translateY(-10px);
                transition: opacity 0.3s ease, transform 0.3s ease;
                pointer-events: none;
            }
            #sidebar-toggle:checked ~ aside .mobile-menu {
                display: flex !important;
                opacity: 1;
                transform: translateY(0);
                pointer-events: auto;
                transition-delay: 0.1s;
            }
        }

        .map-overlay-gradient {
            background: radial-gradient(circle at center, transparent 0%, #080B11 120%);
        }
      `}} />
            <div className="flex flex-col lg:flex-row h-screen w-full relative">
                <input className="hidden" id="sidebar-toggle" type="checkbox" />
                <aside className="sidebar-transition w-full lg:w-[var(--sidebar-width)] h-[72px] lg:h-full glass-sidebar flex flex-col z-40 lg:relative shrink-0 border-b lg:border-r border-white/5 overflow-hidden">
                    <div className="p-4 lg:p-6 flex items-center justify-between lg:justify-start h-[72px] lg:h-20 shrink-0 border-white/5 w-full bg-[#080B11]/95 lg:bg-transparent relative z-20">
                        <label className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-lg flex items-center justify-center cursor-pointer hover:bg-blue-500/20 transition-all shrink-0" htmlFor="sidebar-toggle">
                            <span className="material-symbols-outlined text-2xl">menu</span>
                        </label>
                        <div className="expanded-content ml-4 flex items-center gap-3">
                            <img src="/logo/ip-logo.png" alt="GeoIntel Logo" className="w-8 h-8 object-contain drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                            <h1 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 uppercase tracking-widest">GeoIntel</h1>
                        </div>
                    </div>

                    <div className="mobile-menu hidden lg:flex flex-1 py-6 lg:overflow-y-auto custom-scrollbar flex-col w-full bg-[#080B11] lg:bg-transparent h-[calc(100vh-72px)] lg:h-auto overflow-hidden">
                        <div className="px-6 mb-4 expanded-content">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Recent Activity</span>
                            </div>
                        </div>
                        <nav className="px-3 space-y-1">
                            <div className="group flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all cursor-pointer">
                                <div className="w-10 h-10 shrink-0 flex items-center justify-center rounded-lg bg-slate-800/40 text-slate-400 group-hover:text-blue-400">
                                    <span className="material-symbols-outlined text-xl">history</span>
                                </div>
                                <div className="sidebar-item-label flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-slate-300 truncate">142.250.190.46</p>
                                    <p className="text-[10px] text-slate-500">Mountain View, US</p>
                                </div>
                                <input className="expanded-content rounded border-slate-700 bg-transparent text-blue-500 focus:ring-0 focus:ring-offset-0" type="checkbox" />
                            </div>
                            <div className="group flex items-center gap-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 cursor-pointer">
                                <div className="w-10 h-10 shrink-0 flex items-center justify-center rounded-lg bg-blue-500 text-white">
                                    <span className="material-symbols-outlined text-xl">my_location</span>
                                </div>
                                <div className="sidebar-item-label flex-1 min-w-0">
                                    <p className="text-xs font-bold text-white truncate">8.8.8.8</p>
                                    <p className="text-[10px] text-blue-400 font-medium">Currently Tracking</p>
                                </div>
                                <input defaultChecked className="expanded-content rounded border-blue-500/50 bg-transparent text-blue-500 focus:ring-0 focus:ring-offset-0" type="checkbox" />
                            </div>
                            <div className="group flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all cursor-pointer">
                                <div className="w-10 h-10 shrink-0 flex items-center justify-center rounded-lg bg-slate-800/40 text-slate-400">
                                    <span className="material-symbols-outlined text-xl">history</span>
                                </div>
                                <div className="sidebar-item-label flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-slate-300 truncate">104.16.248.249</p>
                                    <p className="text-[10px] text-slate-500">Cloudflare Node</p>
                                </div>
                                <input className="expanded-content rounded border-slate-700 bg-transparent text-blue-500 focus:ring-0 focus:ring-offset-0" type="checkbox" />
                            </div>
                        </nav>
                        <div className="p-4 mt-auto border-t border-white/5 w-full">
                            <button className="sidebar-footer-btn w-full h-11 flex items-center gap-3 bg-slate-800/30 hover:bg-red-500/10 hover:text-red-400 text-slate-400 rounded-lg transition-all font-bold text-[11px] uppercase tracking-wider">
                                <span className="material-symbols-outlined text-lg">delete_forever</span>
                                <span className="expanded-content">Clear Records</span>
                            </button>
                        </div>
                    </div>
                </aside>
                <main className="flex-1 flex flex-col p-4 md:p-8 lg:p-12 overflow-y-auto w-full h-[calc(100vh-72px)] lg:h-full">
                    <header className="mb-6 lg:mb-10 flex flex-col md:flex-row items-stretch md:items-center gap-4 lg:gap-6">
                        <div className="relative flex-1 w-full md:max-w-3xl">
                            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-500">
                                <span className="material-symbols-outlined">search</span>
                            </div>
                            <input className="w-full bg-[#111827] border border-white/5 rounded-2xl py-5 pl-14 pr-52 text-base font-medium text-white focus:ring-2 focus:ring-blue-500/40 outline-none transition-all placeholder:text-slate-600" placeholder="Search IPv4/IPv6 Address..." type="text" defaultValue="8.8.8.8" />
                            <div className="absolute inset-y-0 right-4 flex items-center gap-3">
                                <button className="bg-blue-600 hover:bg-blue-500 text-white px-5 h-10 rounded-xl font-bold text-xs transition-all uppercase tracking-widest flex items-center gap-2">
                                    Locate <span className="material-symbols-outlined text-lg">explore</span>
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 md:gap-3 md:ml-auto w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                            <button className="flex-1 md:flex-none px-4 h-12 md:h-14 bg-[#111827] border border-white/5 rounded-xl md:rounded-2xl text-slate-400 hover:text-blue-400 transition-all flex items-center justify-center gap-2 text-[10px] md:text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                                <span className="material-symbols-outlined text-lg md:text-xl">person_pin</span>
                                <span className="inline-block">Reset IP</span>
                            </button>
                            <div className="w-px h-6 md:h-8 bg-white/5 mx-1 md:mx-2 hidden md:block"></div>
                            <button className="shrink-0 w-12 h-12 md:w-14 md:h-14 bg-[#111827] border border-white/5 rounded-xl md:rounded-2xl text-slate-400 hover:text-white transition-all flex items-center justify-center relative">
                                <span className="material-symbols-outlined group-hover:animate-swing text-lg md:text-xl">notifications</span>
                                <span className="absolute top-3 md:top-4 right-3 md:right-4 w-2 h-2 bg-blue-500 rounded-full border-2 border-[#111827] shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse"></span>
                            </button>
                            <button className="shrink-0 w-12 h-12 md:w-14 md:h-14 bg-[#111827] border border-white/5 rounded-xl md:rounded-2xl text-slate-400 hover:text-white transition-all flex items-center justify-center">
                                <span className="material-symbols-outlined text-lg md:text-xl">settings</span>
                            </button>
                        </div>
                    </header>
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
                                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded uppercase">Searched IP</span>
                                </div>
                            </div>
                            <div className="p-8 space-y-8 flex-1">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Public IP Address</p>
                                    <div className="flex items-center gap-3 group flex-wrap">
                                        <span className="text-3xl md:text-4xl font-bold text-white tracking-tighter break-all">8.8.8.8</span>
                                        <button className="text-slate-600 hover:text-blue-400 transition-colors">
                                            <span className="material-symbols-outlined text-xl">content_copy</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className="flex items-start gap-4 pb-5 border-b border-white/5">
                                        <span className="material-symbols-outlined text-slate-500 text-xl mt-1">location_on</span>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-0.5">Location</p>
                                            <p className="text-sm font-semibold text-slate-200">Mountain View, California</p>
                                            <p className="text-[11px] text-slate-500">United States · North America</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 pb-5 border-b border-white/5">
                                        <span className="material-symbols-outlined text-slate-500 text-xl mt-1">dns</span>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-0.5">ISP Provider</p>
                                            <p className="text-sm font-semibold text-slate-200">Google LLC</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">ASN 15169</span>
                                                <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded">Tier 1</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <span className="material-symbols-outlined text-slate-500 text-xl mt-1">schedule</span>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-0.5">Timezone</p>
                                            <p className="text-sm font-semibold text-slate-200">America/Los_Angeles</p>
                                            <p className="text-[11px] text-slate-500">UTC-07:00 (PDT)</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 pt-4">
                                    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 group hover:border-blue-500/30 transition-all">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[9px] font-bold text-slate-600 uppercase">Latitude</span>
                                            <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="material-symbols-outlined text-xs text-blue-400">content_copy</span>
                                            </button>
                                        </div>
                                        <p className="text-sm font-mono font-bold text-slate-300 tracking-tight">37.4223</p>
                                    </div>
                                    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 group hover:border-blue-500/30 transition-all">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[9px] font-bold text-slate-600 uppercase">Longitude</span>
                                            <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="material-symbols-outlined text-xs text-blue-400">content_copy</span>
                                            </button>
                                        </div>
                                        <p className="text-sm font-mono font-bold text-slate-300 tracking-tight">-122.0841</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="order-1 xl:order-2 col-span-12 xl:col-span-8 bento-container relative overflow-hidden flex flex-col min-h-[350px] xl:min-h-[500px]">
                            <div className="absolute top-6 left-6 z-20 space-y-2">
                                <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.6)]"></div>
                                    <span className="text-[10px] font-extrabold text-white tracking-widest uppercase">Target Focus</span>
                                </div>
                            </div>
                            <div className="absolute top-6 right-6 z-20 flex flex-col gap-2">
                                <button className="w-10 h-10 bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-lg text-slate-300 hover:text-white hover:bg-blue-600 transition-all flex items-center justify-center">
                                    <span className="material-symbols-outlined">add</span>
                                </button>
                                <button className="w-10 h-10 bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-lg text-slate-300 hover:text-white hover:bg-blue-600 transition-all flex items-center justify-center">
                                    <span className="material-symbols-outlined">remove</span>
                                </button>
                                <button className="w-10 h-10 bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-lg text-slate-300 hover:text-white hover:bg-blue-600 transition-all flex items-center justify-center">
                                    <span className="material-symbols-outlined">layers</span>
                                </button>
                            </div>
                            <div className="flex-1 w-full h-full relative bg-[#0B0F17]">
                                <img alt="Interactive Satellite Map" className="w-full h-full object-cover opacity-70 grayscale contrast-[1.1] brightness-75 mix-blend-screen" src="https://lh3.googleusercontent.com/aida-public/AB6AXuArhoVMO6t9qEjLB94ySSieSxb5QuPSaHTsWf27iTrVemwLlpuKMJWGr-Z16AHfVkhggDxZGDDARKlUGckLfpR_Em2Ctt6eeZJFL7Rll8yUxNUM0ZAOfUgeI5ZG0SBIaWGOx4muA2w0QW4uw5AubIEOURxu15-aeBwQcNMRpmW4QM0zBWCYfwGFZM516QvLyOL9yFqJUO-o3GT1L1YPdkPdk6TEzx2iDOvaqnSTsUJVonxOdSmXLDzmpbdGqWkfvCJFlL0vRbcEjjE" />
                                <div className="absolute inset-0 map-overlay-gradient"></div>
                                <div className="absolute top-[45%] left-[55%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                                    <div className="relative">
                                        <div className="w-12 h-12 bg-blue-500/20 rounded-full animate-ping absolute -inset-2"></div>
                                        <div className="w-8 h-8 bg-blue-600 rounded-full border-4 border-white/20 relative z-10 shadow-2xl flex items-center justify-center">
                                            <div className="w-2 h-2 bg-white rounded-full"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute bottom-6 left-6 right-6 z-20">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                                    <div className="bg-slate-900/80 backdrop-blur-xl p-3 md:p-4 rounded-xl border border-white/10">
                                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1">Status</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs md:text-sm font-semibold text-white">Live Node</span>
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                        </div>
                                    </div>
                                    <div className="bg-slate-900/80 backdrop-blur-xl p-3 md:p-4 rounded-xl border border-white/10">
                                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1">Stability</p>
                                        <p className="text-xs md:text-sm font-semibold text-emerald-400">99.9% Up</p>
                                    </div>
                                    <div className="bg-slate-900/80 backdrop-blur-xl p-3 md:p-4 rounded-xl border border-white/10">
                                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1">Security</p>
                                        <p className="text-xs md:text-sm font-semibold text-blue-400">Tier A++</p>
                                    </div>
                                    <div className="bg-slate-900/80 backdrop-blur-xl p-3 md:p-4 rounded-xl border border-white/10">
                                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1">ISP Tier</p>
                                        <p className="text-xs md:text-sm font-semibold text-white">Corporate</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}

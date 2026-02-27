"use client";

import { useState } from 'react';

export default function Login() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setTimeout(() => setIsAuthenticating(false), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030712] text-slate-200 font-sans overflow-hidden relative">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 via-black to-blue-900/20"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[140px] animate-pulse mix-blend-screen"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/20 rounded-full blur-[140px] animate-pulse mix-blend-screen" style={{ animationDelay: '1s' }}></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-12 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-24">
        {/* Left Side: Branding & Info */}
        <div className="flex-1 text-center lg:text-left flex flex-col items-center lg:items-start w-full px-4 sm:px-0">
          <div className="inline-flex items-center justify-center lg:justify-start gap-3 md:gap-4 mb-6 md:mb-8">
            <img src="/logo/ip-logo.png" alt="GeoIntel Logo" className="w-12 h-12 md:w-16 md:h-16 object-contain" />
            <span className="text-3xl md:text-4xl font-bold tracking-tight text-white">GeoIntel</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 mb-4 md:mb-6 leading-tight max-w-lg mx-auto lg:mx-0">
            Next-Gen<br className="hidden md:block lg:hidden" /> Network Intelligence.
          </h1>
          <p className="text-base md:text-lg text-slate-400 max-w-md md:max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
            Access enterprise-grade IP geolocation, routing analytics, and node health monitoring from a single, unified command center.
          </p>
        </div>

        {/* Right Side: Login Form */}
        <div className="flex-1 w-full max-w-md sm:max-w-lg md:max-w-md mx-auto">
          <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-2xl md:rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden group">

            <div className="text-center mb-6 md:mb-8 relative z-10">
              <h2 className="text-xl md:text-2xl font-semibold text-white tracking-tight mb-2">Sign In</h2>
              <p className="text-slate-400 text-sm">Enter your credentials to continue</p>
            </div>

            <form className="space-y-6 relative z-10" onSubmit={handleLogin}>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1" htmlFor="email">Email Address</label>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500 group-focus-within/input:text-blue-400 transition-colors">
                    <span className="material-symbols-outlined text-xl">mail</span>
                  </div>
                  <input
                    className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all focus:bg-white/[0.03]"
                    id="email" placeholder="admin@geopro.io" type="email" defaultValue="admin@geopro.io" required />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest" htmlFor="password">Password</label>
                  <a className="text-[11px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-widest transition-colors" href="#">Recovery</a>
                </div>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500 group-focus-within/input:text-blue-400 transition-colors">
                    <span className="material-symbols-outlined text-xl">key</span>
                  </div>
                  <input
                    className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all focus:bg-white/[0.03]"
                    id="password" placeholder="••••••••" type="password" required />
                  <button className="absolute inset-y-0 right-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors" type="button">
                    <span className="material-symbols-outlined text-xl">visibility</span>
                  </button>
                </div>
              </div>

              <button disabled={isAuthenticating} className="w-full bg-blue-600 hover:bg-blue-500 text-white h-12 md:h-14 rounded-xl md:rounded-2xl font-semibold text-sm md:text-base transition-all shadow-lg flex items-center justify-center gap-2 relative overflow-hidden group/btn disabled:opacity-70 disabled:cursor-not-allowed">
                {isAuthenticating ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Logging in...</span>
                  </>
                ) : (
                  <>
                    <span>Login</span>
                  </>
                )}
              </button>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
}

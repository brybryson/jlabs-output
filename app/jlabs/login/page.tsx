"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Seeder Modal State
  const [isSeeding, setIsSeeding] = useState(false);
  const [showSeedModal, setShowSeedModal] = useState(false);
  const [seedResult, setSeedResult] = useState<{
    message: string;
    status: string;
    credentials: { email: string; password: string };
  } | null>(null);

  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setError(null);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Successful login
        router.push('/jlabs/home');
      } else {
        setError(data.message || 'Authentication failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const runSeeder = async () => {
    setIsSeeding(true);
    try {
      const res = await fetch('/api/seed');
      const data = await res.json();
      if (res.ok) {
        setSeedResult(data);
        setShowSeedModal(true);
      } else {
        setError(data.message || 'Seeding failed');
      }
    } catch (e) {
      setError('Seeding failed. Please try again.');
    } finally {
      setIsSeeding(false);
    }
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
          <div className="inline-flex items-center justify-center lg:justify-start gap-4 md:gap-5 mb-8 md:mb-10">
            <img src="/logo/ip-logo.png" alt="GeoIntel Logo" className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
            <span className="text-4xl md:text-5xl font-extrabold tracking-tight text-white uppercase tracking-widest leading-none">GeoIntel</span>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 mb-6 md:mb-8 leading-tight max-w-2xl mx-auto lg:mx-0">
            Advanced Network Intelligence.
          </h1>
          <p className="text-lg md:text-xl md:leading-relaxed text-slate-400 max-w-xl md:max-w-2xl mx-auto lg:mx-0 font-medium">
            Access enterprise-grade IP geolocation, routing analytics, and node health monitoring from a single, unified command center.
          </p>
        </div>

        {/* Right Side: Login Form */}
        <div className="flex-1 w-full max-w-lg md:max-w-xl lg:max-w-md mx-auto">
          <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-3xl md:rounded-[2.5rem] p-8 sm:p-10 md:p-12 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">

            <div className="text-center mb-8 md:mb-10 relative z-10">
              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-2">Secure Gateway</h2>
              <p className="text-slate-400 text-sm md:text-base font-medium">Authenticate to access the hub.</p>
            </div>

            <form className="space-y-6 relative z-10" onSubmit={handleLogin}>
              <div className="space-y-3">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest" htmlFor="email">Email Address</label>
                </div>
                <div className="relative group/input mb-2">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-500 group-focus-within/input:text-blue-400 transition-colors">
                    <span className="material-symbols-outlined text-2xl">mail</span>
                  </div>
                  <input
                    className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 md:py-5 pl-14 pr-5 text-lg text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all focus:bg-white/[0.03]"
                    id="email" placeholder="name@example.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest" htmlFor="password">Password</label>
                </div>
                <div className="relative group/input mb-2">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-500 group-focus-within/input:text-blue-400 transition-colors">
                    <span className="material-symbols-outlined text-2xl">key</span>
                  </div>
                  <input
                    className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 md:py-5 pl-14 pr-14 text-lg text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all focus:bg-white/[0.03]"
                    id="password" placeholder="••••••••" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <button className="absolute inset-y-0 right-5 flex items-center text-slate-500 hover:text-slate-300 transition-colors" type="button" onClick={() => setShowPassword(!showPassword)}>
                    <span className="material-symbols-outlined text-2xl">{showPassword ? "visibility_off" : "visibility"}</span>
                  </button>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                  <span className="material-symbols-outlined text-xl">error</span>
                  {error}
                </div>
              )}

              <button disabled={isAuthenticating} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white h-16 md:h-18 rounded-2xl font-bold text-lg transition-all shadow-lg shadow-blue-900/40 flex items-center justify-center gap-3 relative overflow-hidden group/btn disabled:opacity-70 disabled:cursor-not-allowed">
                {isAuthenticating ? (
                  <>
                    <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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

            <div className="mt-8 pt-8 border-t border-white/5 text-center relative z-10">
              <p className="text-slate-500 text-xs mb-4 uppercase tracking-[0.2em] font-bold">Examiner Tools</p>
              <button
                type="button"
                disabled={isSeeding}
                onClick={runSeeder}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all text-xs font-bold uppercase tracking-widest disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-base ${isSeeding ? 'animate-spin' : ''}`}>
                  {isSeeding ? 'sync' : 'database'}
                </span>
                {isSeeding ? 'Seeding...' : 'Seed Test Database'}
              </button>
              <p className="mt-4 text-[10px] text-slate-600 font-medium">Click to generate `test@example.com` / `password123`</p>
            </div>
          </div>
        </div>
      </div>

      {/* Seeder Modal */}
      {showSeedModal && seedResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowSeedModal(false)}></div>
          <div className="bg-[#0f172a] border border-white/10 rounded-[2rem] p-8 md:p-10 w-full max-w-md relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${seedResult.status === 'created' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                <span className="material-symbols-outlined text-3xl">
                  {seedResult.status === 'created' ? 'check_circle' : 'info'}
                </span>
              </div>

              <h3 className="text-xl font-bold text-white mb-2">{seedResult.message}</h3>
              <p className="text-slate-400 text-sm mb-8">
                {seedResult.status === 'created'
                  ? 'The test account has been successfully created in the database.'
                  : 'The test account already exists. Credentials have been verified/updated.'}
              </p>

              <div className="w-full bg-black/40 rounded-2xl p-6 border border-white/5 space-y-4 mb-8">
                <div className="flex flex-col items-start gap-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email</span>
                  <span className="text-white font-mono break-all">{seedResult.credentials.email}</span>
                </div>
                <div className="flex flex-col items-start gap-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Password</span>
                  <span className="text-white font-mono">{seedResult.credentials.password}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setEmail(seedResult.credentials.email);
                  setPassword(seedResult.credentials.password);
                  setShowSeedModal(false);
                }}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all"
              >
                Use These Credentials
              </button>

              <button
                onClick={() => setShowSeedModal(false)}
                className="mt-4 text-slate-500 hover:text-slate-300 text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

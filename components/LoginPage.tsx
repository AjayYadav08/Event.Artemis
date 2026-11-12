import React, { useState } from 'react';
import { authService, AuthUser } from '../services/authService';
import { ApiClientError } from '../services/apiClient';
import { Eye, EyeOff, Loader2, ArrowRight, Sparkles } from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: AuthUser) => void;
  loadingText?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('ajay@artemis.events');
  const [password, setPassword] = useState('Artemis@123');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const user =
        mode === 'login'
          ? await authService.login(email.trim(), password)
          : await authService.register(name.trim(), email.trim(), password);
      onLogin(user);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError('Unable to connect to Event Artemis server. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#fcfdfe] flex items-center justify-center relative overflow-hidden font-sans selection:bg-blue-100 px-4 py-8">
      {/* Light Theme Background Elements - Matching Main App */}
      <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-blue-100/50 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-[100px]" />

      <div className="relative z-10 flex flex-col items-center w-full max-w-md">
        {/* Branding Header */}
        <div className="flex items-center mb-6">
          <div className="relative flex-shrink-0 drop-shadow-lg">
            <svg width="64" height="64" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="logo-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1D4ED8" />
                  <stop offset="50%" stopColor="#0070F3" />
                  <stop offset="100%" stopColor="#38BDF8" />
                </linearGradient>
                <linearGradient id="sparkle-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#2563EB" />
                  <stop offset="100%" stopColor="#38BDF8" />
                </linearGradient>
              </defs>
              <path d="M 45 5 Q 45 25 65 25 Q 45 25 45 45 Q 45 25 25 25 Q 45 25 45 5 Z" fill="url(#sparkle-gradient)" />
              <path d="M 75 30 Q 75 40 85 40 Q 75 40 75 50 Q 75 40 65 40 Q 75 40 75 30 Z" fill="url(#sparkle-gradient)" />
              <path d="M 20 100 L 50 30 L 80 100" stroke="url(#logo-gradient)" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <path d="M 10 75 Q 50 95 105 45" stroke="url(#logo-gradient)" strokeWidth="14" strokeLinecap="round" fill="none" />
            </svg>
          </div>
          <div className="w-[2px] h-[44px] bg-slate-200 mx-4 rounded-full" />
          <div className="flex flex-col justify-center text-left">
            <span className="text-[28px] leading-[0.9] font-black text-[#0B132B] tracking-tight">event</span>
            <span className="text-[28px] leading-[1.05] font-black text-transparent bg-clip-text bg-gradient-to-r from-[#1D4ED8] via-[#0070F3] to-[#38BDF8] tracking-tight">artemis</span>
          </div>
        </div>

        {/* Auth Card */}
        <div className="w-full rounded-3xl p-7 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] border border-slate-200/80 bg-white/90 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-black text-slate-900">
                {mode === 'login' ? 'Welcome back' : 'Create account'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {mode === 'login'
                  ? 'Sign in to access campus events, squads & team chat'
                  : 'Join Event Artemis to discover events and form teams'}
              </p>
            </div>
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-[#0070F3] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl mb-5">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-[#0070F3] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); }}
              className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-white text-[#0070F3] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ajay Yadav"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0070F3] transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@artemis.events"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0070F3] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0070F3] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-[#0070F3] hover:bg-blue-600 active:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {mode === 'login' && (
            <p className="mt-4 text-[11px] text-center text-slate-400">
              Seeded demo account: <span className="font-semibold text-slate-600">ajay@artemis.events</span> / <span className="font-semibold text-slate-600">Artemis@123</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

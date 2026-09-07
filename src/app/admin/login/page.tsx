'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail, AlertCircle, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { AdminThemeProvider, ThemeToggleButton } from '@/components/admin/AdminThemeProvider';

function AdminLoginInner() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.accessToken) {
        localStorage.setItem('adminToken', data.accessToken);
        localStorage.setItem('adminUser', JSON.stringify(data.user));
        router.push('/admin');
      } else {
        setError(data.error || 'Invalid administrator credentials');
      }
    } catch (err: any) {
      setError('Network connection error. Please check server status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#f8fafc] dark:bg-[#080c15] text-slate-900 dark:text-white transition-colors duration-200 relative overflow-hidden selection:bg-blue-600 selection:text-white">
      {/* Ambient glowing backdrop mesh */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[450px] h-[450px] bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Floating Theme Switcher */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggleButton />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 p-0.5 shadow-xl shadow-blue-500/25 mb-4 group hover:scale-105 transition-transform duration-200 overflow-hidden">
            <Image 
              src="/app_icon.png" 
              alt="Novix Logo" 
              width={64} 
              height={64} 
              className="w-full h-full object-cover rounded-[14px]" 
            />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-2">
            <span>Novix</span>
            <span className="text-blue-600 dark:text-blue-400">Admin</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm font-medium">
            Enterprise Management & Telemetry Console
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800/80 p-7 sm:p-9 rounded-3xl shadow-2xl dark:shadow-blue-950/20">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-semibold p-3.5 rounded-xl border border-red-200 dark:border-red-900/50 flex items-center gap-2.5 animate-in fade-in duration-200">
                <AlertCircle size={18} className="shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Administrator Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@novix.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 font-medium transition"
                  required
                />
                <Mail className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500" size={18} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Secure Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-3 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 font-medium transition"
                  required
                />
                <Lock className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500" size={18} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/25 disabled:opacity-60 text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Authenticating Session...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Console</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 text-center">
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5 font-medium">
              <Shield size={14} className="text-blue-500" />
              <span>Protected by Novix Multi-Factor Security Protocol</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLogin() {
  return (
    <AdminThemeProvider>
      <AdminLoginInner />
    </AdminThemeProvider>
  );
}

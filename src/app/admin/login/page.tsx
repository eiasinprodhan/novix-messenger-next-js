'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail, AlertCircle } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        setError(data.error || 'Failed to authenticate admin');
      }
    } catch (err: any) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900/95 p-4 sm:p-6 selection:bg-blue-500 selection:text-white relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-xl shadow-blue-500/20 mb-4 overflow-hidden">
            <Image src="/app_icon.png" alt="Novix Logo" width={56} height={56} className="w-full h-full object-cover rounded-[14px]" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Novix Admin</h1>
          <p className="text-slate-400 mt-1 text-sm font-medium">Management Console Sign In</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 bg-slate-900/90 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="bg-red-50 text-red-600 text-xs font-medium p-3.5 rounded-xl border border-red-200 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Admin Email</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@novix.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 font-medium"
                required
              />
              <Mail className="absolute left-3.5 top-3 text-slate-400" size={18} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Password</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 font-medium"
                required
              />
              <Lock className="absolute left-3.5 top-3 text-slate-400" size={18} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition shadow-md shadow-blue-600/20 disabled:opacity-60 text-sm"
          >
            {loading ? 'Authenticating...' : 'Sign in to Console'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/" className="text-xs font-semibold text-slate-500 hover:text-slate-700 transition">
            ← Back to Homepage
          </a>
        </div>
      </div>
    </div>
  );
}

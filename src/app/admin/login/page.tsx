'use client';

import React, { useState } from 'react';
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 selection:bg-blue-500 selection:text-white">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 text-white shadow-lg shadow-blue-500/20">
            <Shield size={24} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Novix Admin</h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">Management Console Sign In</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 bg-white border border-slate-200/90 p-8 rounded-3xl shadow-sm">
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
                onChange={(e) => setEmail ? setPassword(e.target.value) : null}
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

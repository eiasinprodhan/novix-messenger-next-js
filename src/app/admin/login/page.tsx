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
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 text-white shadow-lg shadow-blue-500/20">
            <Shield size={24} />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Novix Admin</h1>
          <p className="text-zinc-400 mt-1 text-sm">Secure Portal Sign In</p>
        </div>

        <form onSubmit={handleLogin} className="card space-y-4 border border-zinc-800/80 bg-zinc-900/60 p-6 rounded-2xl shadow-xl">
          {error && (
            <div className="bg-red-500/10 text-red-400 text-sm px-4 py-3 rounded-xl border border-red-500/20 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-zinc-400 mb-1.5">Admin Email</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@novix.com"
                className="input pl-10 bg-zinc-950 border-zinc-800 text-white placeholder-zinc-600 focus:border-blue-500"
                required
              />
              <Mail className="absolute left-3.5 top-3.5 text-zinc-500" size={18} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-zinc-400 mb-1.5">Password</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input pl-10 bg-zinc-950 border-zinc-800 text-white placeholder-zinc-600 focus:border-blue-500"
                required
              />
              <Lock className="absolute left-3.5 top-3.5 text-zinc-500" size={18} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full mt-2 disabled:opacity-60 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl font-medium transition"
          >
            {loading ? 'Authenticating...' : 'Sign in to Console'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/" className="text-xs text-zinc-500 hover:text-zinc-300 transition">
            ← Back to Homepage
          </a>
        </div>
      </div>
    </div>
  );
}

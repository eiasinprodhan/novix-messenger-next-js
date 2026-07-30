'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function AuthDemo() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';

    const body = mode === 'login' 
      ? { email: form.email, password: form.password }
      : { name: form.name, username: form.username, email: form.email, password: form.password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
      } else {
        setResult(data);
        if (data.accessToken) {
          localStorage.setItem('novix_token', data.accessToken);
          localStorage.setItem('novix_user', JSON.stringify(data.user));
        }
      }
    } catch (err) {
      setError('Network error. Make sure Next.js server is running.');
    } finally {
      setLoading(false);
    }
  };

  const testGetMe = async () => {
    const token = localStorage.getItem('novix_token');
    if (!token) {
      setError('No token. Please login first.');
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError('Failed to fetch profile');
    }
  };

  const testSearchUsers = async () => {
    const token = localStorage.getItem('novix_token');
    if (!token) return setError('Login first');

    const res = await fetch('/api/users?q=sarah', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setResult(data);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-8">
      <div className="max-w-md mx-auto">
        <div className="mb-8 flex items-center gap-4">
          <Link href="/" className="shrink-0">
            <Image src="/app_icon.png" alt="Novix Logo" width={48} height={48} className="rounded-2xl shadow-md" />
          </Link>
          <div>
            <Link href="/" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition">← Back to home</Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">Novix Auth</h1>
            <p className="text-xs sm:text-sm text-slate-500">Authentication & User API Console</p>
          </div>
        </div>

        <div className="flex mb-6 rounded-2xl bg-slate-200/80 p-1 text-sm font-semibold">
          <button 
            onClick={() => { setMode('login'); setResult(null); setError(''); }}
            className={`flex-1 py-2.5 rounded-xl transition ${mode === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Login
          </button>
          <button 
            onClick={() => { setMode('register'); setResult(null); setError(''); }}
            className={`flex-1 py-2.5 rounded-xl transition ${mode === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 p-6 rounded-3xl space-y-4 shadow-sm">
          {error && (
            <div className="bg-red-50 text-red-600 text-xs font-semibold p-3.5 rounded-xl border border-red-200">
              {error}
            </div>
          )}

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Full Name</label>
                <input 
                  type="text" 
                  name="name" 
                  value={form.name} 
                  onChange={handleChange} 
                  className="input" 
                  placeholder="Sarah Chen"
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Username</label>
                <input 
                  type="text" 
                  name="username" 
                  value={form.username} 
                  onChange={handleChange} 
                  className="input" 
                  placeholder="sarahc"
                  required 
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Email</label>
            <input 
              type="email" 
              name="email" 
              value={form.email} 
              onChange={handleChange} 
              className="input" 
              placeholder="sarah@example.com"
              required 
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Password</label>
            <input 
              type="password" 
              name="password" 
              value={form.password} 
              onChange={handleChange} 
              className="input" 
              placeholder="••••••••"
              required 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition shadow-md shadow-blue-600/20 disabled:opacity-60 text-sm"
          >
            {loading ? 'Processing...' : mode === 'login' ? 'Login' : 'Register Account'}
          </button>
        </form>

        {/* Extra helper buttons */}
        <div className="mt-6 space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Test Protected Routes</div>
          <div className="flex gap-2">
            <button onClick={testGetMe} className="flex-1 btn btn-secondary text-xs py-2">
              GET /api/auth/me
            </button>
            <button onClick={testSearchUsers} className="flex-1 btn btn-secondary text-xs py-2">
              GET /api/users?q=sarah
            </button>
          </div>
        </div>

        {/* Result JSON preview */}
        {result && (
          <div className="mt-6 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
            <div className="text-xs font-bold text-slate-500 mb-2">Response:</div>
            <pre className="text-xs bg-slate-50 p-3 rounded-xl overflow-x-auto text-slate-800 font-mono">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

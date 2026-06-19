'use client';

import React, { useState } from 'react';
import Link from 'next/link';

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
        // Store token for later use (testing chat)
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
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-md mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-sm text-zinc-400 hover:text-white">← Back to home</Link>
          <h1 className="text-3xl font-semibold mt-2 tracking-tight">Novix Auth Demo</h1>
          <p className="text-sm text-zinc-400 mt-1">Test the full authentication + user APIs</p>
        </div>

        <div className="flex mb-6 rounded-2xl bg-zinc-900 p-1 text-sm">
          <button 
            onClick={() => { setMode('login'); setResult(null); setError(''); }}
            className={`flex-1 py-2 rounded-xl transition ${mode === 'login' ? 'bg-white text-black font-medium' : 'hover:bg-zinc-800'}`}
          >
            Login
          </button>
          <button 
            onClick={() => { setMode('register'); setResult(null); setError(''); }}
            className={`flex-1 py-2 rounded-xl transition ${mode === 'register' ? 'bg-white text-black font-medium' : 'hover:bg-zinc-800'}`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {mode === 'register' && (
            <>
              <div>
                <label className="text-xs text-zinc-400 block mb-1.5">Full Name</label>
                <input name="name" value={form.name} onChange={handleChange} className="input" placeholder="Sarah Chen" required />
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1.5">Username</label>
                <input name="username" value={form.username} onChange={handleChange} className="input" placeholder="sarahc" required />
              </div>
            </>
          )}

          <div>
            <label className="text-xs text-zinc-400 block mb-1.5">Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} className="input" placeholder="you@novix.dev" required />
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-1.5">Password</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} className="input" placeholder="••••••••" required />
          </div>

          {error && <div className="text-red-400 text-sm">{error}</div>}

          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary w-full mt-2"
          >
            {loading ? 'Processing...' : mode === 'login' ? 'Login' : 'Create Account'}
          </button>
        </form>

        {result && (
          <div className="mt-6 card bg-zinc-900">
            <div className="text-xs uppercase text-emerald-400 mb-2 font-medium">SUCCESS RESPONSE</div>
            <pre className="text-[13px] bg-zinc-950 p-4 rounded-xl overflow-auto text-emerald-300">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-8 space-y-3">
          <div className="text-xs font-semibold text-zinc-400">TEST AUTHENTICATED APIs</div>
          <div className="flex gap-3">
            <button onClick={testGetMe} className="btn btn-secondary text-xs flex-1">GET /api/auth/me</button>
            <button onClick={testSearchUsers} className="btn btn-secondary text-xs flex-1">Search Users</button>
          </div>
          <p className="text-[10px] text-zinc-500">Tokens are stored in localStorage. Use these to test in Flutter later.</p>
        </div>

        <div className="mt-9 border-t border-zinc-800 pt-6 text-center">
          <Link href="/admin" className="text-xs text-blue-400">Go to Admin Dashboard →</Link>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [email, setEmail] = useState('admin@novix.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simple MVP admin login - hardcoded for now
    // In real MVP, this would check against admin role + JWT
    setTimeout(() => {
      if (email === 'admin@novix.com' && password === 'admin123') {
        // Store simple admin session
        localStorage.setItem('adminToken', 'demo-admin-session');
        router.push('/admin');
      } else {
        setError('Invalid admin credentials. Try admin@novix.com / admin123');
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <span className="text-3xl font-bold">N</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tighter">Novix Admin</h1>
          <p className="text-zinc-400 mt-1">Dashboard Access</p>
        </div>

        <form onSubmit={handleLogin} className="card space-y-4">
          {error && (
            <div className="bg-red-900/20 text-red-400 text-sm px-4 py-3 rounded-xl border border-red-800">{error}</div>
          )}

          <div>
            <label className="block text-sm mb-1.5 text-zinc-300">Admin Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="input" 
              required 
            />
          </div>

          <div>
            <label className="block text-sm mb-1.5 text-zinc-300">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="input" 
              required 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary w-full mt-2 disabled:opacity-70"
          >
            {loading ? 'Signing in...' : 'Sign in to Admin'}
          </button>

          <div className="text-center text-[11px] text-zinc-500 pt-1">
            Demo credentials prefilled. <br /> 
            (Real auth will be added with admin role check)
          </div>
        </form>

        <div className="mt-6 text-center">
          <a href="/" className="text-xs text-zinc-400 hover:text-zinc-300">← Back to homepage</a>
        </div>
      </div>
    </div>
  );
}

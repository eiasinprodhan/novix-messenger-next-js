'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Users, BarChart3, Shield, LogOut, Flag, FileText, ChevronRight, Users2 } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pathname === '/admin/login') {
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('adminToken');
    const userStr = localStorage.getItem('adminUser');

    if (!token) {
      router.push('/admin/login');
      return;
    }

    if (userStr) {
      try {
        setAdminUser(JSON.parse(userStr));
      } catch (e) {
        setAdminUser({ name: 'Admin', email: 'admin@novix.com' });
      }
    }
    setLoading(false);
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    router.push('/admin/login');
  };

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-500 text-sm font-medium">
        Authenticating admin session...
      </div>
    );
  }

  const navItems = [
    { label: 'Dashboard', href: '/admin', icon: BarChart3 },
    { label: 'Users', href: '/admin/users', icon: Users },
    { label: 'Groups', href: '/admin/groups', icon: Users2 },
    { label: 'Reports', href: '/admin/reports', icon: Flag },
    { label: 'Audit Logs', href: '/admin/logs', icon: FileText },
  ];

  return (
    <div className="flex h-screen bg-slate-100/70 text-slate-800 font-sans selection:bg-blue-500 selection:text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200/90 flex flex-col shadow-xs">
        {/* Logo Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20 text-lg group-hover:scale-105 transition">
              N
            </div>
            <div>
              <div className="font-bold text-slate-900 text-base tracking-tight leading-tight">Novix</div>
              <div className="text-[10px] text-blue-600 font-semibold tracking-wider uppercase">Admin Portal</div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-3 flex-1 space-y-1">
          <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Management</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight size={14} className="text-blue-600" />}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-2xl border border-slate-200/60">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
              {adminUser?.name?.[0] || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-900 truncate">{adminUser?.name || 'Administrator'}</div>
              <div className="text-[11px] text-slate-500 truncate">{adminUser?.email || 'admin@novix.com'}</div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-slate-200/80 bg-white/80 backdrop-blur-md flex items-center px-8 justify-between">
          <div className="flex items-center gap-3 text-xs">
            <span className="font-semibold text-slate-900">Control Console</span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-mono text-[10px]">v2.4 Active</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Connected to MongoDB
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-8">{children}</main>
      </div>
    </div>
  );
}

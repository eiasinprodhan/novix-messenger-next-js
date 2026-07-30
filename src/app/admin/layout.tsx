'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Users, BarChart3, Shield, LogOut, Flag, FileText, ChevronRight, Users2, Menu, X } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

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
        <div className="flex items-center gap-3">
          <Image src="/app_icon.png" alt="Novix" width={32} height={32} className="animate-spin" />
          <span>Authenticating admin session...</span>
        </div>
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

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white">
      {/* Logo Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-md shadow-blue-500/20 group-hover:scale-105 transition shrink-0 overflow-hidden">
            <Image src="/app_icon.png" alt="Novix Logo" width={40} height={40} className="w-full h-full object-cover rounded-[10px]" />
          </div>
          <div>
            <div className="font-bold text-slate-900 text-base tracking-tight leading-tight">Novix</div>
            <div className="text-[10px] text-blue-600 font-semibold tracking-wider uppercase">Admin Portal</div>
          </div>
        </Link>
        <button 
          onClick={() => setIsMobileMenuOpen(false)}
          className="md:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-3 flex-1 space-y-1 overflow-y-auto">
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
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-100/70 text-slate-800 font-sans selection:bg-blue-500 selection:text-white overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-slate-200/90 flex-col shadow-xs bg-white shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl z-10">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b border-slate-200/80 bg-white/80 backdrop-blur-md flex items-center px-4 sm:px-8 justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
              aria-label="Open sidebar menu"
            >
              <Menu size={22} />
            </button>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-slate-900 text-sm sm:text-base">Control Console</span>
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-mono text-[10px]">v2.4 Active</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-2.5 sm:px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="hidden sm:inline">Connected to</span> MongoDB
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}


import React from 'react';
import Link from 'next/link';
import { Users, MessageCircle, BarChart3, Shield, LogOut } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-zinc-950">
      {/* Sidebar */}
      <div className="admin-sidebar">
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="font-bold text-xl">N</span>
            </div>
            <div>
              <div className="font-semibold tracking-tight">Novix</div>
              <div className="text-[10px] text-zinc-500 -mt-0.5">ADMIN DASHBOARD</div>
            </div>
          </div>
        </div>

        <nav className="p-3 flex-1">
          <Link href="/admin" className="nav-link active mb-1">
            <BarChart3 size={18} />
            <span>Dashboard</span>
          </Link>
          
          <Link href="/admin/users" className="nav-link mb-1">
            <Users size={18} />
            <span>Users</span>
          </Link>
          
          <Link href="/admin/friends" className="nav-link mb-1">
            <MessageCircle size={18} />
            <span>Friendships</span>
          </Link>

          <div className="my-6 border-t border-zinc-800" />

          <div className="px-4 py-2 text-[11px] font-medium text-zinc-500 tracking-wider">SETTINGS</div>
          
          <Link href="/admin" className="nav-link mb-1 text-zinc-400">
            <Shield size={18} />
            <span>Security</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="flex-1">
              <div className="text-sm font-medium">Admin</div>
              <div className="text-xs text-zinc-500">admin@novix.com</div>
            </div>
            <Link href="/admin/login" className="text-zinc-400 hover:text-red-400 transition-colors">
              <LogOut size={18} />
            </Link>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 border-b border-zinc-800 bg-zinc-950 flex items-center px-6 justify-between">
          <div className="flex items-center gap-3 text-sm">
            <span className="font-medium">Novix Messenger</span>
            <span className="px-2 py-0.5 text-[10px] rounded bg-zinc-800 text-zinc-400">MVP</span>
          </div>
          
          <div className="flex items-center gap-3 text-sm">
            <div className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-green-400 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              Live
            </div>
            <a href="/" className="text-xs px-3 py-1 rounded-lg hover:bg-zinc-900 border border-zinc-800">View API Docs</a>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

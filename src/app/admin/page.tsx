'use client';

import React, { useState, useEffect } from 'react';
import { Users, UserCheck, MessageCircle, TrendingUp, Flag, AlertTriangle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Stats {
  totalUsers: number;
  onlineUsers: number;
  verifiedUsers: number;
  totalMessages: number;
  totalFriendships: number;
  pendingFriendRequests: number;
  totalReports: number;
  pendingReports: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    onlineUsers: 0,
    verifiedUsers: 0,
    totalMessages: 0,
    totalFriendships: 0,
    pendingFriendRequests: 0,
    totalReports: 0,
    pendingReports: 0,
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.stats) setStats(data.stats);
        if (data.recentUsers) setRecentUsers(data.recentUsers);
        if (data.recentReports) setRecentReports(data.recentReports);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Dashboard Overview</h1>
        <p className="text-zinc-400 mt-1 text-sm">Real-time statistics & administration control for Novix Messenger</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="card bg-zinc-900/60 border-zinc-800/80 p-5 rounded-2xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">TOTAL USERS</p>
              <p className="text-3xl font-semibold mt-2 tabular-nums text-white">{stats.totalUsers}</p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 text-blue-400">
              <Users size={22} />
            </div>
          </div>
          <div className="mt-3 text-xs text-zinc-400">{stats.verifiedUsers} verified accounts</div>
        </div>

        <div className="card bg-zinc-900/60 border-zinc-800/80 p-5 rounded-2xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">ONLINE NOW</p>
              <p className="text-3xl font-semibold mt-2 tabular-nums text-white">{stats.onlineUsers}</p>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400">
              <UserCheck size={22} />
            </div>
          </div>
          <div className="mt-3 text-xs text-emerald-400">
            {stats.totalUsers > 0 ? Math.round((stats.onlineUsers / stats.totalUsers) * 100) : 0}% active
          </div>
        </div>

        <div className="card bg-zinc-900/60 border-zinc-800/80 p-5 rounded-2xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">MESSAGES SENT</p>
              <p className="text-3xl font-semibold mt-2 tabular-nums text-white">{stats.totalMessages}</p>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20 text-purple-400">
              <TrendingUp size={22} />
            </div>
          </div>
          <div className="mt-3 text-xs text-zinc-400">{stats.totalFriendships} connected friendships</div>
        </div>

        <div className="card bg-zinc-900/60 border-zinc-800/80 p-5 rounded-2xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">USER REPORTS</p>
              <p className="text-3xl font-semibold mt-2 tabular-nums text-white">{stats.totalReports}</p>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-400">
              <Flag size={22} />
            </div>
          </div>
          <div className="mt-3 text-xs text-amber-400 font-medium">
            {stats.pendingReports} pending moderation
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Users */}
        <div className="lg:col-span-3 card bg-zinc-900/60 border-zinc-800/80 p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-white">Recent Users</h3>
              <Link href="/admin/users" className="text-xs text-blue-400 hover:underline flex items-center gap-1">
                View All <ArrowRight size={14} />
              </Link>
            </div>

            {loading ? (
              <div className="text-center py-10 text-zinc-500 text-sm">Loading latest users...</div>
            ) : recentUsers.length === 0 ? (
              <div className="text-center py-10 text-zinc-500 text-sm">No registered users found in database.</div>
            ) : (
              <div className="space-y-2">
                {recentUsers.map((user) => (
                  <div key={user._id} className="flex items-center justify-between p-3 bg-zinc-950/50 hover:bg-zinc-800/40 rounded-xl border border-zinc-800/40 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-zinc-800 rounded-full flex items-center justify-center text-sm font-semibold text-white overflow-hidden shrink-0">
                        {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="" /> : user.name?.[0]}
                      </div>
                      <div>
                        <div className="font-medium text-sm text-white flex items-center gap-2">
                          {user.name}
                          {user.role === 'admin' && (
                            <span className="px-1.5 py-0.2 text-[10px] bg-blue-500/20 text-blue-400 rounded">Admin</span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-400">@{user.username} • {user.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] ${user.isOnline ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-zinc-500'}`}>
                        {user.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Panel & Pending Reports Summary */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card bg-zinc-900/60 border-zinc-800/80 p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-400" /> Pending Reports
              </h3>
              <Link href="/admin/reports" className="text-xs text-amber-400 hover:underline">
                Manage ({stats.pendingReports})
              </Link>
            </div>

            {recentReports.length === 0 ? (
              <div className="p-4 bg-zinc-950/40 rounded-xl text-center text-xs text-zinc-500 border border-zinc-800/50">
                No active pending reports
              </div>
            ) : (
              <div className="space-y-2">
                {recentReports.slice(0, 3).map((report) => (
                  <div key={report._id} className="p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/40 text-xs">
                    <div className="flex justify-between text-zinc-300 font-medium mb-1">
                      <span>Reason: <strong className="text-amber-400 uppercase">{report.reason}</strong></span>
                      <span className="text-[10px] text-zinc-500">{new Date(report.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="text-zinc-400">
                      Reported: <span className="text-zinc-200">@{report.reported?.username || 'user'}</span> by @{report.reporter?.username || 'user'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card bg-zinc-900/60 border-zinc-800/80 p-6 rounded-2xl">
            <h3 className="font-semibold text-white mb-4">Quick Navigation</h3>
            <div className="space-y-2.5">
              <Link href="/admin/users" className="flex items-center justify-between p-3 bg-zinc-950/50 hover:bg-zinc-800/50 rounded-xl border border-zinc-800/40 text-sm text-zinc-200 transition">
                <span className="flex items-center gap-2"><Users size={16} className="text-blue-400" /> Manage Users</span>
                <ArrowRight size={14} className="text-zinc-500" />
              </Link>
              <Link href="/admin/reports" className="flex items-center justify-between p-3 bg-zinc-950/50 hover:bg-zinc-800/50 rounded-xl border border-zinc-800/40 text-sm text-zinc-200 transition">
                <span className="flex items-center gap-2"><Flag size={16} className="text-amber-400" /> Review Reports</span>
                <ArrowRight size={14} className="text-zinc-500" />
              </Link>
              <Link href="/admin/logs" className="flex items-center justify-between p-3 bg-zinc-950/50 hover:bg-zinc-800/50 rounded-xl border border-zinc-800/40 text-sm text-zinc-200 transition">
                <span className="flex items-center gap-2"><MessageCircle size={16} className="text-purple-400" /> View Audit Logs</span>
                <ArrowRight size={14} className="text-zinc-500" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

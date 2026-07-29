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
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard Overview</h1>
        <p className="text-slate-500 text-sm mt-1">Real-time statistics & administration control for Novix Messenger</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">TOTAL USERS</p>
              <p className="text-3xl font-extrabold mt-2 tabular-nums text-slate-900">{stats.totalUsers}</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Users size={22} />
            </div>
          </div>
          <div className="mt-4 text-xs font-medium text-slate-500">{stats.verifiedUsers} verified accounts</div>
        </div>

        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">ONLINE NOW</p>
              <p className="text-3xl font-extrabold mt-2 tabular-nums text-slate-900">{stats.onlineUsers}</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <UserCheck size={22} />
            </div>
          </div>
          <div className="mt-4 text-xs font-semibold text-emerald-600">
            {stats.totalUsers > 0 ? Math.round((stats.onlineUsers / stats.totalUsers) * 100) : 0}% active online
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">MESSAGES SENT</p>
              <p className="text-3xl font-extrabold mt-2 tabular-nums text-slate-900">{stats.totalMessages}</p>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <TrendingUp size={22} />
            </div>
          </div>
          <div className="mt-4 text-xs font-medium text-slate-500">{stats.totalFriendships} connected friendships</div>
        </div>

        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">USER REPORTS</p>
              <p className="text-3xl font-extrabold mt-2 tabular-nums text-slate-900">{stats.totalReports}</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Flag size={22} />
            </div>
          </div>
          <div className="mt-4 text-xs font-bold text-amber-600">
            {stats.pendingReports} pending moderation
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Users */}
        <div className="lg:col-span-3 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900 text-base">Recent Users</h3>
            <Link href="/admin/users" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View All <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400 text-sm font-medium">Loading latest users...</div>
          ) : recentUsers.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm font-medium">No registered users found in database.</div>
          ) : (
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div key={user._id} className="flex items-center justify-between p-3.5 bg-slate-50/70 hover:bg-slate-100/70 rounded-xl border border-slate-200/60 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center text-sm font-bold shrink-0 shadow-xs">
                      {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover rounded-xl" alt="" /> : user.name?.[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                        {user.name}
                        {user.role === 'admin' && (
                          <span className="px-2 py-0.5 text-[10px] bg-blue-100 text-blue-700 rounded-md font-bold uppercase tracking-wider">Admin</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">@{user.username} • {user.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${user.isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200/70 text-slate-600'}`}>
                      {user.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Reports & Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-500" /> Pending Reports
              </h3>
              <Link href="/admin/reports" className="text-xs font-bold text-amber-600 hover:underline">
                Manage ({stats.pendingReports})
              </Link>
            </div>

            {recentReports.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-xl text-center text-xs font-medium text-slate-500 border border-slate-200/60">
                No active pending reports
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentReports.slice(0, 3).map((report) => (
                  <div key={report._id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 text-xs space-y-1">
                    <div className="flex justify-between text-slate-700 font-semibold">
                      <span>Reason: <strong className="text-amber-600 uppercase">{report.reason}</strong></span>
                      <span className="text-[10px] text-slate-400 font-mono">{new Date(report.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="text-slate-500">
                      Reported: <span className="text-slate-800 font-medium">@{report.reported?.username || 'user'}</span> by @{report.reporter?.username || 'user'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs">
            <h3 className="font-bold text-slate-900 text-base mb-4">Quick Shortcuts</h3>
            <div className="space-y-2.5">
              <Link href="/admin/users" className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-blue-50/60 rounded-xl border border-slate-200/60 text-sm font-semibold text-slate-700 hover:text-blue-700 transition">
                <span className="flex items-center gap-2.5"><Users size={18} className="text-blue-600" /> User Directory</span>
                <ArrowRight size={14} className="text-slate-400" />
              </Link>
              <Link href="/admin/reports" className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-amber-50/60 rounded-xl border border-slate-200/60 text-sm font-semibold text-slate-700 hover:text-amber-700 transition">
                <span className="flex items-center gap-2.5"><Flag size={18} className="text-amber-600" /> Review Reports</span>
                <ArrowRight size={14} className="text-slate-400" />
              </Link>
              <Link href="/admin/logs" className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-indigo-50/60 rounded-xl border border-slate-200/60 text-sm font-semibold text-slate-700 hover:text-indigo-700 transition">
                <span className="flex items-center gap-2.5"><MessageCircle size={18} className="text-indigo-600" /> System Audit Logs</span>
                <ArrowRight size={14} className="text-slate-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

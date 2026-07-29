'use client';

import React, { useState, useEffect } from 'react';
import { Users, UserCheck, MessageCircle, TrendingUp, Flag, AlertTriangle, ArrowRight, ShieldCheck, Activity, Layers, Clock, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface Stats {
  totalUsers: number;
  onlineUsers: number;
  verifiedUsers: number;
  adminCount: number;
  totalMessages: number;
  totalFriendships: number;
  pendingFriendRequests: number;
  totalGroups: number;
  totalStories: number;
  totalReports: number;
  pendingReports: number;
  resolvedReports: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    onlineUsers: 0,
    verifiedUsers: 0,
    adminCount: 0,
    totalMessages: 0,
    totalFriendships: 0,
    pendingFriendRequests: 0,
    totalGroups: 0,
    totalStories: 0,
    totalReports: 0,
    pendingReports: 0,
    resolvedReports: 0,
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
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
        if (data.recentLogs) setRecentLogs(data.recentLogs);
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
        <p className="text-slate-500 text-sm mt-1">Real-time telemetry, user audit logs & administration control for Novix Messenger</p>
      </div>

      {/* Top Telemetry Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">TOTAL REGISTERED USERS</p>
              <p className="text-3xl font-extrabold mt-2 tabular-nums text-slate-900">{stats.totalUsers}</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Users size={22} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-medium text-slate-500">
            <span>{stats.verifiedUsers} verified accounts</span>
            <span className="text-blue-600 font-bold">{stats.adminCount} admins</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">ACTIVE ONLINE USERS</p>
              <p className="text-3xl font-extrabold mt-2 tabular-nums text-slate-900">{stats.onlineUsers}</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <UserCheck size={22} />
            </div>
          </div>
          <div className="mt-4 text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {stats.totalUsers > 0 ? Math.round((stats.onlineUsers / stats.totalUsers) * 100) : 0}% active right now
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">TOTAL MESSAGES SENT</p>
              <p className="text-3xl font-extrabold mt-2 tabular-nums text-slate-900">{stats.totalMessages}</p>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <TrendingUp size={22} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-medium text-slate-500">
            <span>{stats.totalFriendships} friendships</span>
            <span>{stats.totalGroups} groups</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">REPORTS & MODERATION</p>
              <p className="text-3xl font-extrabold mt-2 tabular-nums text-slate-900">{stats.totalReports}</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Flag size={22} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-bold">
            <span className="text-amber-600">{stats.pendingReports} pending</span>
            <span className="text-emerald-600">{stats.resolvedReports} resolved</span>
          </div>
        </div>
      </div>

      {/* Main Grid: User Activity Logs & Recent Users */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* User Activity Logs (Added, Deleted, Modified) */}
        <div className="lg:col-span-3 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Activity size={18} className="text-blue-600" /> Recent Administrative Audit Logs
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Real-time log of added, updated, and deleted accounts</p>
            </div>
            <Link href="/admin/logs" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              All Logs <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400 text-sm font-medium">Fetching activity logs...</div>
          ) : recentLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm font-medium border border-dashed border-slate-200 rounded-xl">
              No recent administrative logs recorded.
            </div>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log) => {
                const isCreated = log.action === 'USER_CREATED';
                const isDeleted = log.action === 'USER_DELETED';
                const isUpdated = log.action === 'USER_UPDATED';

                return (
                  <div key={log._id} className="flex items-center justify-between p-3.5 bg-slate-50/80 hover:bg-slate-100/70 rounded-xl border border-slate-200/60 transition">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isCreated ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                        isDeleted ? 'bg-red-100 text-red-700 border border-red-200' :
                        'bg-blue-100 text-blue-700 border border-blue-200'
                      }`}>
                        {isCreated ? '+' : isDeleted ? '✕' : '✎'}
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-slate-900 flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] uppercase font-bold ${
                            isCreated ? 'bg-emerald-100 text-emerald-800' :
                            isDeleted ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {log.action.replace('_', ' ')}
                          </span>
                          <span className="text-slate-500 font-normal">• {log.admin?.name || 'System Admin'}</span>
                        </div>
                        <div className="text-xs text-slate-600 mt-1 font-mono">
                          Target: {log.targetType || 'User'} ({log.targetId ? log.targetId.substring(0, 10) + '...' : ''})
                          {log.details && (
                            <span className="ml-2 text-slate-400 text-[11px]">
                              {JSON.stringify(log.details)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono text-right shrink-0">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Sidebar: Recent Users & Pending Reports */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Users List */}
          <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base">Recently Registered Users</h3>
              <Link href="/admin/users" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                View All
              </Link>
            </div>

            {recentUsers.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-xl text-center text-xs font-medium text-slate-500 border border-slate-200/60">
                No users found
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentUsers.slice(0, 4).map((user) => (
                  <div key={user._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold shrink-0">
                        {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover rounded-lg" alt="" /> : user.name?.[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{user.name}</div>
                        <div className="text-slate-500 text-[11px]">@{user.username}</div>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${user.isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                      {user.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Reports Summary */}
          <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-500" /> Pending Moderation
              </h3>
              <Link href="/admin/reports" className="text-xs font-bold text-amber-600 hover:underline">
                Manage ({stats.pendingReports})
              </Link>
            </div>

            {recentReports.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-xl text-center text-xs font-medium text-slate-500 border border-slate-200/60">
                No active pending reports
              </div>
            ) : (
              <div className="space-y-2">
                {recentReports.slice(0, 3).map((report) => (
                  <div key={report._id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs space-y-1">
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
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  UserCheck, 
  MessageCircle, 
  TrendingUp, 
  Flag, 
  AlertTriangle, 
  ArrowRight, 
  ShieldCheck, 
  Activity, 
  Layers, 
  Clock, 
  CheckCircle2, 
  RefreshCw, 
  Sparkles, 
  Users2, 
  Send, 
  ExternalLink 
} from 'lucide-react';
import DashboardCharts, { TrendPoint } from '@/components/admin/DashboardCharts';

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
  totalAds: number;
  activeAds: number;
}

const DASHBOARD_CACHE_KEY = 'novix_admin_dashboard_cache';

const DEFAULT_STATS: Stats = {
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
  totalAds: 0,
  activeAds: 0,
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS);
  const [messageTrends, setMessageTrends] = useState<TrendPoint[]>([]);
  const [userTrends, setUserTrends] = useState<TrendPoint[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [hasData, setHasData] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Restore cached dashboard post-hydration
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DASHBOARD_CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        if (cached?.stats) {
          setStats(cached.stats);
          if (cached.messageTrends) setMessageTrends(cached.messageTrends);
          if (cached.userTrends) setUserTrends(cached.userTrends);
          if (cached.recentUsers) setRecentUsers(cached.recentUsers);
          if (cached.recentLogs) setRecentLogs(cached.recentLogs);
          if (cached.recentReports) setRecentReports(cached.recentReports);
          setHasData(true);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.stats) setStats(data.stats);
        if (data.messageTrends) setMessageTrends(data.messageTrends);
        if (data.userTrends) setUserTrends(data.userTrends);
        if (data.recentUsers) setRecentUsers(data.recentUsers);
        if (data.recentLogs) setRecentLogs(data.recentLogs);
        if (data.recentReports) setRecentReports(data.recentReports);
        setHasData(true);

        try {
          localStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify({
            stats: data.stats,
            messageTrends: data.messageTrends,
            userTrends: data.userTrends,
            recentUsers: data.recentUsers,
            recentLogs: data.recentLogs,
            recentReports: data.recentReports,
          }));
        } catch {}
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setRefreshing(false);
    }
  };

  const verificationPct = stats.totalUsers > 0 
    ? Math.round((stats.verifiedUsers / stats.totalUsers) * 100) 
    : 0;
  
  const onlinePct = stats.totalUsers > 0 
    ? Math.round((stats.onlineUsers / stats.totalUsers) * 100) 
    : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">
            Live telemetry, real-time activity, and moderation management for Novix Messenger
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-[#111a2e] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 shadow-xs transition cursor-pointer"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-blue-500' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Metrics'}</span>
          </button>
        </div>
      </div>

      {/* Top Telemetry Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        {/* Card 1: Registered Users */}
        <div className="bg-white dark:bg-[#111a2e] border border-slate-200/90 dark:border-slate-800/90 p-6 rounded-2xl shadow-xs hover:shadow-md transition duration-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                Total Users
              </p>
              {!hasData ? (
                <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse mt-2" />
              ) : (
                <p className="text-3xl font-black mt-2 tabular-nums text-slate-900 dark:text-white">
                  {stats.totalUsers.toLocaleString()}
                </p>
              )}
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 rounded-xl shrink-0">
              <Users size={22} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 relative z-10 pt-3 border-t border-slate-100 dark:border-slate-800/60">
            {!hasData ? (
              <div className="h-3.5 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            ) : (
              <>
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={13} />
                  {stats.verifiedUsers} Verified
                </span>
                <span className="text-blue-600 dark:text-blue-400 font-bold">{stats.adminCount} Admins</span>
              </>
            )}
          </div>
        </div>

        {/* Card 2: Active Online Users */}
        <div className="bg-white dark:bg-[#111a2e] border border-slate-200/90 dark:border-slate-800/90 p-6 rounded-2xl shadow-xs hover:shadow-md transition duration-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                Active Online
              </p>
              {!hasData ? (
                <div className="h-8 w-20 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse mt-2" />
              ) : (
                <p className="text-3xl font-black mt-2 tabular-nums text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{stats.onlineUsers.toLocaleString()}</span>
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                </p>
              )}
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 rounded-xl shrink-0">
              <UserCheck size={22} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 relative z-10 pt-3 border-t border-slate-100 dark:border-slate-800/60">
            {!hasData ? (
              <div className="h-3.5 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            ) : (
              <>
                <span>{onlinePct}% of total network</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Real-time Sockets</span>
              </>
            )}
          </div>
        </div>

        {/* Card 3: Total Messages */}
        <div className="bg-white dark:bg-[#111a2e] border border-slate-200/90 dark:border-slate-800/90 p-6 rounded-2xl shadow-xs hover:shadow-md transition duration-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                Total Messages
              </p>
              {!hasData ? (
                <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse mt-2" />
              ) : (
                <p className="text-3xl font-black mt-2 tabular-nums text-slate-900 dark:text-white">
                  {stats.totalMessages.toLocaleString()}
                </p>
              )}
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 rounded-xl shrink-0">
              <MessageCircle size={22} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 relative z-10 pt-3 border-t border-slate-100 dark:border-slate-800/60">
            {!hasData ? (
              <div className="h-3.5 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            ) : (
              <>
                <span>{stats.totalGroups} Groups</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">{stats.totalStories} Stories</span>
              </>
            )}
          </div>
        </div>

        {/* Card 4: Reports & Moderation */}
        <div className="bg-white dark:bg-[#111a2e] border border-slate-200/90 dark:border-slate-800/90 p-6 rounded-2xl shadow-xs hover:shadow-md transition duration-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 dark:bg-amber-500/15 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                Pending Reports
              </p>
              {!hasData ? (
                <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse mt-2" />
              ) : (
                <p className="text-3xl font-black mt-2 tabular-nums text-slate-900 dark:text-white">
                  {stats.pendingReports}
                </p>
              )}
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40 rounded-xl shrink-0">
              <Flag size={22} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 relative z-10 pt-3 border-t border-slate-100 dark:border-slate-800/60">
            {!hasData ? (
              <div className="h-3.5 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            ) : (
              <>
                <span className="text-emerald-600 dark:text-emerald-400">{stats.resolvedReports} Resolved</span>
                <Link href="/admin/reports" className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-bold">
                  Review Queue <ArrowRight size={12} />
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Card 5: Ad Campaigns */}
        <div className="bg-white dark:bg-[#111a2e] border border-slate-200/90 dark:border-slate-800/90 p-6 rounded-2xl shadow-xs hover:shadow-md transition duration-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 dark:bg-purple-500/15 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                Ad Campaigns
              </p>
              {!hasData ? (
                <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse mt-2" />
              ) : (
                <p className="text-3xl font-black mt-2 tabular-nums text-slate-900 dark:text-white">
                  {stats.totalAds}
                </p>
              )}
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/40 rounded-xl shrink-0">
              <Layers size={22} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 relative z-10 pt-3 border-t border-slate-100 dark:border-slate-800/60">
            {!hasData ? (
              <div className="h-3.5 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            ) : (
              <>
                <span className="text-emerald-600 dark:text-emerald-400">{stats.activeAds} Active</span>
                <Link href="/admin/ads" className="text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 font-bold">
                  Manage Ads <ArrowRight size={12} />
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Analytics Graphs & Visualizations */}
      <DashboardCharts stats={stats} messageTrends={messageTrends} userTrends={userTrends} />

      {/* Visual Analytics & Ratios */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Verification Ratio */}
        <div className="bg-white dark:bg-[#111a2e] border border-slate-200/90 dark:border-slate-800/90 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Account Verification Ratio
            </span>
            {!hasData ? (
              <div className="h-4 w-10 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            ) : (
              <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400">{verificationPct}%</span>
            )}
          </div>
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500" 
              style={{ width: !hasData ? '0%' : `${verificationPct}%` }}
            />
          </div>
          <div className="mt-3 flex justify-between text-[11px] text-slate-400 font-medium">
            {!hasData ? (
              <div className="h-3 w-40 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mt-1" />
            ) : (
              <>
                <span>{stats.verifiedUsers} Verified</span>
                <span>{stats.totalUsers - stats.verifiedUsers} Unverified</span>
              </>
            )}
          </div>
        </div>

        {/* Live Engagement Ratio */}
        <div className="bg-white dark:bg-[#111a2e] border border-slate-200/90 dark:border-slate-800/90 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Network Concurrency
            </span>
            {!hasData ? (
              <div className="h-4 w-10 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            ) : (
              <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{onlinePct}%</span>
            )}
          </div>
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500" 
              style={{ width: !hasData ? '0%' : `${onlinePct}%` }}
            />
          </div>
          <div className="mt-3 flex justify-between text-[11px] text-slate-400 font-medium">
            {!hasData ? (
              <div className="h-3 w-40 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mt-1" />
            ) : (
              <>
                <span>{stats.onlineUsers} Online Now</span>
                <span>{stats.totalUsers - stats.onlineUsers} Offline</span>
              </>
            )}
          </div>
        </div>

        {/* Social Graph Volume */}
        <div className="bg-white dark:bg-[#111a2e] border border-slate-200/90 dark:border-slate-800/90 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Friendships & Connections
            </span>
            {!hasData ? (
              <div className="h-4 w-10 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            ) : (
              <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">{stats.totalFriendships}</span>
            )}
          </div>
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500" 
              style={{ width: !hasData ? '0%' : '75%' }}
            />
          </div>
          <div className="mt-3 flex justify-between text-[11px] text-slate-400 font-medium">
            {!hasData ? (
              <div className="h-3 w-40 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mt-1" />
            ) : (
              <>
                <span>{stats.totalFriendships} Active Bonds</span>
                <span>{stats.pendingFriendRequests} Pending Requests</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 border border-blue-200/50 dark:border-blue-900/40 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
          <Sparkles size={18} className="text-blue-600 dark:text-blue-400" />
          <span>Admin Quick Actions</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/users"
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-[#111a2e] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition"
          >
            + Create User
          </Link>
          <Link
            href="/admin/users"
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition flex items-center gap-1.5"
          >
            <Send size={12} />
            Broadcast Message
          </Link>
          <Link
            href="/admin/reports"
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-100 transition"
          >
            Review Reports {!hasData ? '' : `(${stats.pendingReports})`}
          </Link>
        </div>
      </div>

      {/* Recent Activity Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Registrations Table */}
        <div className="bg-white dark:bg-[#111a2e] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users size={18} className="text-blue-600" />
                <span>Recent Registrations</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Latest users joined to the platform</p>
            </div>
            <Link
              href="/admin/users"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              View All <ArrowRight size={13} />
            </Link>
          </div>

          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
            <table className="w-full text-left text-xs min-w-[420px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="pb-3 font-semibold">User</th>
                  <th className="pb-3 font-semibold">Role</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {!hasData ? (
                  [1, 2, 3, 4].map((i) => (
                    <tr key={i}>
                      <td className="py-3 pr-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse shrink-0" />
                          <div className="space-y-1">
                            <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                            <div className="h-2.5 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-2">
                        <div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
                      </td>
                      <td className="py-3 pr-2">
                        <div className="h-3 w-14 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                      </td>
                      <td className="py-3 text-right">
                        <div className="h-3 w-12 bg-slate-200 dark:bg-slate-800 rounded animate-pulse ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : recentUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      No user accounts found.
                    </td>
                  </tr>
                ) : (
                  recentUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 pr-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-xs shrink-0">
                            {user.name?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 dark:text-white truncate max-w-[140px]">
                              {user.name}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate max-w-[140px]">
                              @{user.username || user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          user.role === 'admin'
                            ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {user.role || 'user'}
                        </span>
                      </td>
                      <td className="py-3 pr-2">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                          user.isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {user.isOnline ? 'Online' : 'Offline'}
                        </span>
                      </td>
                      <td className="py-3 text-right text-slate-400 font-medium whitespace-nowrap">
                        {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Security & Audit Activity Feed */}
        <div className="bg-white dark:bg-[#111a2e] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-indigo-600" />
                <span>Security & Audit Activity</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Recent system transactions & telemetry logs</p>
            </div>
            <Link
              href="/admin/logs"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              All Logs <ArrowRight size={13} />
            </Link>
          </div>

          <div className="space-y-3">
            {!hasData ? (
              [1, 2, 3, 4].map((i) => (
                <div 
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60 animate-pulse"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-3.5 w-44 bg-slate-200 dark:bg-slate-800 rounded" />
                  </div>
                  <div className="h-3 w-12 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
              ))
            ) : recentLogs.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No recent security activity logged.
              </div>
            ) : (
              recentLogs.slice(0, 6).map((log, idx) => (
                <div 
                  key={log._id || idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider shrink-0 ${
                      log.action?.includes('BAN') || log.action?.includes('DELETE')
                        ? 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40'
                        : log.action?.includes('LOGIN')
                        ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40'
                        : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40'
                    }`}>
                      {log.action || 'EVENT'}
                    </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                      {typeof log.details === 'object' && log.details !== null
                        ? (log.details.name || log.details.username || log.details.groupName || JSON.stringify(log.details).replace(/[{}\"]/g, ''))
                        : (log.details || log.description || 'Action performed')}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0 ml-3 font-medium whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

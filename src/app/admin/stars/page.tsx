'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Star,
  Crown,
  Search,
  RefreshCw,
  Plus,
  Minus,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Clock,
  User as UserIcon,
  ShieldCheck,
  TrendingUp,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Award,
  Layers,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';

interface MonetizationUser {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  starsBalance: number;
  isPremium: boolean;
  premiumPlan?: string;
  premiumExpiresAt?: string;
  createdAt: string;
}

export default function AdminStarsPage() {
  const [users, setUsers] = useState<MonetizationUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'premium' | 'stars'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPremiumUsers: 0,
    totalStarsInCirculation: 0,
  });

  // Modals
  const [isStarModalOpen, setIsStarModalOpen] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<MonetizationUser | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Star Adjustment form
  const [starForm, setStarForm] = useState({
    mode: 'add' as 'add' | 'deduct' | 'set',
    amount: '100',
    reason: 'Promotional Reward',
  });

  // Premium Management form
  const [premiumForm, setPremiumForm] = useState({
    isPremium: true,
    plan: 'monthly',
    durationMonths: '1',
  });

  // Notifications
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchUsers(searchQuery, page);
  }, [page]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const getHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : '';
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchUsers = async (query = '', pageNum = 1, isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch(`/api/admin/monetization?q=${encodeURIComponent(query)}&page=${pageNum}&limit=15`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(data.users || []);
        if (data.stats) setStats(data.stats);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
          setTotalCount(data.pagination.total || 0);
        }
      } else {
        showNotification('error', data.error || 'Failed to load ledger');
      }
    } catch (err: any) {
      console.error('Failed to load stars economy:', err);
      showNotification('error', 'Network error connecting to ledger');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers(searchQuery, 1);
  };

  // Open Star Adjustment Modal
  const openAdjustStarsModal = (user: MonetizationUser) => {
    setSelectedUser(user);
    setStarForm({
      mode: 'add',
      amount: '100',
      reason: 'Promotional Reward',
    });
    setIsStarModalOpen(true);
  };

  // Open Premium Modal
  const openManagePremiumModal = (user: MonetizationUser) => {
    setSelectedUser(user);
    setPremiumForm({
      isPremium: user.isPremium ?? true,
      plan: user.premiumPlan || 'monthly',
      durationMonths: '1',
    });
    setIsPremiumModalOpen(true);
  };

  // Submit Star Adjustment
  const handleSaveStars = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/monetization', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          action: 'adjust_stars',
          userId: selectedUser.id,
          amount: starForm.amount,
          mode: starForm.mode,
          reason: starForm.reason,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification('success', data.message || 'Star balance updated');
        setIsStarModalOpen(false);
        fetchUsers(searchQuery, page);
      } else {
        showNotification('error', data.error || 'Failed to adjust stars');
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Error updating star balance');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Premium Status Update
  const handleSavePremium = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/monetization', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          action: 'set_premium',
          userId: selectedUser.id,
          isPremium: premiumForm.isPremium,
          plan: premiumForm.plan,
          durationMonths: premiumForm.durationMonths,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification('success', data.message || 'Novix Premium status updated');
        setIsPremiumModalOpen(false);
        fetchUsers(searchQuery, page);
      } else {
        showNotification('error', data.error || 'Failed to update premium status');
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Error updating premium');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Client-side quick filter
  const filteredUsers = useMemo(() => {
    if (tierFilter === 'premium') {
      return users.filter((u) => u.isPremium);
    }
    if (tierFilter === 'stars') {
      return users.filter((u) => (u.starsBalance || 0) > 0);
    }
    return users;
  }, [users, tierFilter]);

  // Projected new balance in star modal
  const projectedBalance = useMemo(() => {
    if (!selectedUser) return 0;
    const current = selectedUser.starsBalance || 0;
    const val = parseInt(starForm.amount, 10) || 0;
    if (starForm.mode === 'add') return current + val;
    if (starForm.mode === 'deduct') return Math.max(0, current - val);
    return Math.max(0, val);
  }, [selectedUser, starForm]);

  const premiumPercent = stats.totalUsers > 0
    ? ((stats.totalPremiumUsers / stats.totalUsers) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold border backdrop-blur-md animate-in slide-in-from-top duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/10 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border-rose-500/30'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center shadow-xs">
              <Star size={20} className="fill-amber-500" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Novix Star Hub & Premium Economy
            </h1>
            <span className="px-2.5 py-0.5 text-[11px] font-extrabold rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              Economy Core
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Oversee user star coin balances, credit promotional bounties, and govern Novix Premium VIP subscriber privileges.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchUsers(searchQuery, page, true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2.5 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:shadow-xs transition text-xs font-bold cursor-pointer"
            title="Refresh ledger"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-amber-500' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Ledger'}</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Stars in Circulation */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Stars In Circulation</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center">
              <Star size={16} className="fill-amber-500" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-500">
              {stats.totalStarsInCirculation.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Sparkles size={12} className="text-amber-500" />
            <span>Virtual utility currency</span>
          </div>
        </div>

        {/* Card 2: Premium VIP Subscribers */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Premium VIP Members</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Crown size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
              {stats.totalPremiumUsers.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-purple-500">({premiumPercent}%)</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            Active paid / granted tiers
          </div>
        </div>

        {/* Card 3: Total Accounts in Ledger */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registered Wallets</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <UserIcon size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {stats.totalUsers.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            Total member directory accounts
          </div>
        </div>

        {/* Card 4: Average Star Balance */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Star Wealth</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {stats.totalUsers > 0
                ? Math.round(stats.totalStarsInCirculation / stats.totalUsers).toLocaleString()
                : '0'}
            </span>
            <span className="text-xs text-slate-400 font-semibold">stars / user</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            Mean circulating balance
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input Form */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-88">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, @username, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-20 py-2 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold transition cursor-pointer"
          >
            Find
          </button>
        </form>

        {/* Quick Filter Buttons */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-bold w-full md:w-auto">
          <button
            onClick={() => setTierFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition ${
              tierFilter === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            All Accounts
          </button>
          <button
            onClick={() => setTierFilter('premium')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              tierFilter === 'premium'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            <Crown size={12} />
            <span>VIP Premium</span>
          </button>
          <button
            onClick={() => setTierFilter('stars')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              tierFilter === 'stars'
                ? 'bg-white dark:bg-slate-900 text-amber-500 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            <Star size={12} className="fill-amber-500" />
            <span>Star Holders</span>
          </button>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-850/50 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4 sm:px-6">User Identity</th>
                <th className="py-3.5 px-4">Stars Balance</th>
                <th className="py-3.5 px-4">VIP Subscription</th>
                <th className="py-3.5 px-4">Member Since</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Economy Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400">
                    <RefreshCw size={24} className="animate-spin text-amber-500 mx-auto mb-2" />
                    <span>Loading star ledger...</span>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400">
                    <Star size={36} className="mx-auto text-slate-300 dark:text-slate-700 mb-2 fill-slate-200 dark:fill-slate-800" />
                    <p className="font-bold text-slate-700 dark:text-slate-300">No users found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Try searching with a different term</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition duration-150 group"
                  >
                    {/* User Identity */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-9 h-9 rounded-xl object-cover ring-2 ring-slate-100 dark:ring-slate-800"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white font-black flex items-center justify-center text-xs shadow-xs">
                            {user.name?.[0]?.toUpperCase() || 'U'}
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 dark:text-white truncate">
                              {user.name}
                            </span>
                            {user.isPremium && (
                              <Crown size={13} className="text-amber-500 shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 truncate mt-0.5">
                            <span className="font-medium text-slate-500 dark:text-slate-400">
                              @{user.username}
                            </span>
                            <span>•</span>
                            <span className="truncate">{user.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Stars Balance */}
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/60 text-amber-700 dark:text-amber-400 font-black tabular-nums">
                        <Star size={13} className="fill-amber-500 text-amber-500 shrink-0" />
                        <span>{(user.starsBalance || 0).toLocaleString()}</span>
                      </div>
                    </td>

                    {/* VIP Subscription */}
                    <td className="py-3.5 px-4">
                      {user.isPremium ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            <Crown size={10} />
                            <span>{user.premiumPlan || 'VIP Plan'}</span>
                          </span>
                          {user.premiumExpiresAt && (
                            <div className="text-[10px] text-slate-400 font-medium">
                              Expires: {new Date(user.premiumExpiresAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                          Free Tier
                        </span>
                      )}
                    </td>

                    {/* Member Since */}
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-xs">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                    </td>

                    {/* Economy Actions */}
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openAdjustStarsModal(user)}
                          className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60 font-bold text-[11px] transition flex items-center gap-1.5 cursor-pointer"
                          title="Add or deduct stars"
                        >
                          <Star size={12} className="fill-amber-500" />
                          <span>Adjust Stars</span>
                        </button>

                        <button
                          onClick={() => openManagePremiumModal(user)}
                          className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/60 font-bold text-[11px] transition flex items-center gap-1.5 cursor-pointer"
                          title="Configure VIP membership"
                        >
                          <Crown size={12} />
                          <span>VIP Status</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
          <div>
            Showing <span className="text-slate-800 dark:text-slate-200 font-bold">{filteredUsers.length}</span> of{' '}
            <span className="text-slate-800 dark:text-slate-200 font-bold">{totalCount}</span> accounts
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Adjust Stars Modal */}
      {isStarModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-500 flex items-center justify-center">
                  <Star size={16} className="fill-amber-500" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Adjust Novix Stars
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    For {selectedUser.name} (@{selectedUser.username})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsStarModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveStars} className="p-6 space-y-5">
              {/* Current vs Projected Balance Card */}
              <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    Current Balance
                  </div>
                  <div className="text-xl font-black text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mt-0.5">
                    <Star size={16} className="fill-amber-500" />
                    <span>{(selectedUser.starsBalance || 0).toLocaleString()}</span>
                  </div>
                </div>

                <div className="text-slate-400 text-lg">→</div>

                <div className="text-right">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    New Balance
                  </div>
                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 justify-end mt-0.5">
                    <Star size={16} className="fill-emerald-500" />
                    <span>{projectedBalance.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Mode Switcher */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Adjustment Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setStarForm({ ...starForm, mode: 'add' })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                      starForm.mode === 'add'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Plus size={13} />
                    <span>Credit (+)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStarForm({ ...starForm, mode: 'deduct' })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                      starForm.mode === 'deduct'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Minus size={13} />
                    <span>Deduct (-)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStarForm({ ...starForm, mode: 'set' })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                      starForm.mode === 'set'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Sliders size={13} />
                    <span>Set Exact (=)</span>
                  </button>
                </div>
              </div>

              {/* Amount input & presets */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Stars Amount
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={starForm.amount}
                  onChange={(e) => setStarForm({ ...starForm, amount: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {['50', '100', '250', '500', '1000', '5000'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setStarForm({ ...starForm, amount: preset })}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950/60 text-slate-600 dark:text-slate-300 hover:text-amber-600 text-[11px] font-bold transition cursor-pointer"
                    >
                      +{preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason / Memo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Audit Reason / Note *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Promotional Reward, Bug Bounty, Contest Bonus"
                  value={starForm.reason}
                  onChange={(e) => setStarForm({ ...starForm, reason: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsStarModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/25 transition flex items-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Applying...</span>
                    </>
                  ) : (
                    <span>Confirm Adjustment</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Premium Modal */}
      {isPremiumModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Crown size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Manage VIP Premium Access
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    For {selectedUser.name} (@{selectedUser.username})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPremiumModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSavePremium} className="p-6 space-y-5">
              {/* Premium Status Toggle */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Novix Premium VIP Tier Active
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Grants golden profile badge, increased upload limits, and priority features
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={premiumForm.isPremium}
                    onChange={(e) => setPremiumForm({ ...premiumForm, isPremium: e.target.checked })}
                    className="w-5 h-5 text-purple-600 rounded-sm focus:ring-purple-500 cursor-pointer"
                  />
                </label>
              </div>

              {premiumForm.isPremium && (
                <>
                  {/* Plan Tier Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      VIP Subscription Plan
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'monthly', label: 'Monthly VIP' },
                        { id: 'annual', label: 'Annual VIP' },
                        { id: 'lifetime', label: 'Lifetime VIP' },
                      ].map((plan) => (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => setPremiumForm({ ...premiumForm, plan: plan.id })}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer border ${
                            premiumForm.plan === plan.id
                              ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span>{plan.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Duration Months (if not lifetime) */}
                  {premiumForm.plan !== 'lifetime' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                        Duration (Months from today)
                      </label>
                      <select
                        value={premiumForm.durationMonths}
                        onChange={(e) => setPremiumForm({ ...premiumForm, durationMonths: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="1">1 Month (30 Days)</option>
                        <option value="3">3 Months (Quarterly)</option>
                        <option value="6">6 Months (Semi-Annual)</option>
                        <option value="12">12 Months (1 Full Year)</option>
                        <option value="24">24 Months (2 Years)</option>
                      </select>
                    </div>
                  )}
                </>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPremiumModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/25 transition flex items-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Save VIP Status</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

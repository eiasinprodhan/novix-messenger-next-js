'use client';

import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
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

const STARS_CACHE_KEY = 'novix_admin_stars_cache';

function StarBadgeIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id="novixStarGoldGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="45%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>
      <path
        d="M12 2.5L14.92 8.62L21.5 9.57L16.75 14.28L17.87 21L12 17.85L6.13 21L7.25 14.28L2.5 9.57L9.08 8.62L12 2.5Z"
        fill="url(#novixStarGoldGrad)"
        stroke="#D97706"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AdminStarsPage() {
  const [users, setUsers] = useState<MonetizationUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'premium' | 'stars'>('all');

  // Restore cached stars post-hydration
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STARS_CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        if (Array.isArray(cached) && cached.length > 0) {
          setUsers(cached);
          setLoading(false);
        }
      }
    } catch {}
  }, []);
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
    else if (users.length === 0) setLoading(true);

    try {
      const res = await fetch(`/api/admin/monetization?q=${encodeURIComponent(query)}&page=${pageNum}&limit=15`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(data.users || []);
        if (data.stats) setStats(data.stats);
        if (!query && pageNum === 1) {
          try {
            localStorage.setItem(STARS_CACHE_KEY, JSON.stringify(data.users || []));
          } catch {}
        }
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

  // Submit Star Adjustment (Fast Optimistic Update)
  const handleSaveStars = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    const delta = parseInt(starForm.amount) || 0;
    const currentStars = selectedUser.starsBalance || 0;
    const newStars = starForm.mode === 'add' ? currentStars + delta : Math.max(0, currentStars - delta);
    const previousUsers = [...users];

    // Instant optimistic update
    setUsers((prev) =>
      prev.map((u) => (u.id === selectedUser.id ? { ...u, starsBalance: newStars } : u))
    );
    setIsStarModalOpen(false);
    toast.success(`Star balance adjusted to ${newStars} Stars`);

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
      if (!res.ok || !data.success) {
        setUsers(previousUsers);
        toast.error(data.error || 'Failed to adjust stars');
      }
    } catch (err: any) {
      setUsers(previousUsers);
      toast.error(err.message || 'Error updating star balance');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Premium Status Update (Fast Optimistic Update)
  const handleSavePremium = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const previousUsers = [...users];
    // Instant optimistic update
    setUsers((prev) =>
      prev.map((u) =>
        u.id === selectedUser.id
          ? { ...u, isPremium: premiumForm.isPremium, premiumPlan: premiumForm.plan }
          : u
      )
    );
    setIsPremiumModalOpen(false);
    toast.success('Novix VIP & Premium status updated');

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
      if (!res.ok || !data.success) {
        setUsers(previousUsers);
        toast.error(data.error || 'Failed to update premium status');
      }
    } catch (err: any) {
      setUsers(previousUsers);
      toast.error(err.message || 'Error updating premium');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Client-side quick filter & real-time search
  const filteredUsers = useMemo(() => {
    let result = users;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      );
    }
    if (tierFilter === 'premium') {
      return result.filter((u) => u.isPremium);
    }
    if (tierFilter === 'stars') {
      return result.filter((u) => (u.starsBalance || 0) > 0);
    }
    return result;
  }, [users, tierFilter, searchQuery]);

  // Projected new balance in star modal
  const projectedBalance = useMemo(() => {
    if (!selectedUser) return 0;
    const current = selectedUser.starsBalance || 0;
    const val = parseInt(starForm.amount, 10) || 0;
    if (starForm.mode === 'add') return current + val;
    if (starForm.mode === 'deduct') return Math.max(0, current - val);
    return Math.max(0, val);
  }, [selectedUser, starForm]);

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
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Stars
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Oversee user star coin balances, credit promotional bounties, and govern Novix Premium VIP subscriber privileges
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

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#111a2e] border border-slate-200/90 dark:border-slate-800/90 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input Form */}
        {/* Search Input */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, @username, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition font-medium"
          />
        </div>

        {/* Quick Filter Buttons */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-bold w-full sm:w-auto">
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
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            <StarBadgeIcon size={13} />
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
              {loading && users.length === 0 ? (
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
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 text-slate-900 dark:text-white font-bold tabular-nums">
                        <StarBadgeIcon size={14} />
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
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200/70 dark:hover:bg-slate-700 font-semibold text-[11px] transition flex items-center gap-1.5 cursor-pointer"
                          title="Add or deduct stars"
                        >
                          <StarBadgeIcon size={13} />
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
        <div className="p-4 bg-slate-50/70 dark:bg-slate-850/50 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            Showing <strong className="text-slate-700 dark:text-slate-200">{filteredUsers.length}</strong> accounts • Page <strong className="text-slate-700 dark:text-slate-200">{page}</strong> of <strong className="text-slate-700 dark:text-slate-200">{totalPages}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-xs cursor-pointer flex items-center gap-1 font-semibold"
            >
              <ChevronLeft size={14} />
              <span className="hidden sm:inline">Previous</span>
            </button>
            <span className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200">
              {page}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-xs cursor-pointer flex items-center gap-1 font-semibold"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight size={14} />
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
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <StarBadgeIcon size={18} />
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
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Current Balance
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                    <StarBadgeIcon size={18} />
                    <span>{(selectedUser.starsBalance || 0).toLocaleString()}</span>
                  </div>
                </div>

                <div className="text-slate-400 text-lg">→</div>

                <div className="text-right">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    New Balance
                  </div>
                  <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 justify-end mt-0.5">
                    <StarBadgeIcon size={18} />
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

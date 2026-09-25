'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserCheck,
  Clock,
  Search,
  RefreshCw,
  Send,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
  User as UserIcon,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

interface Friendship {
  _id: string;
  status: string;
  createdAt: string;
  otherUser: {
    _id: string;
    name: string;
    username: string;
    avatar?: string;
    isOnline: boolean;
    lastSeen: string;
  };
  isRequester: boolean;
}

const FRIENDS_CACHE_KEY = 'novix_admin_friends_cache';

const getDemoFriendships = (type: string): Friendship[] => {
  if (type === 'friends') {
    return [
      {
        _id: 'f1',
        status: 'accepted',
        createdAt: '2026-05-12',
        otherUser: { _id: '1', name: 'Sarah Chen', username: 'sarahc', isOnline: true, lastSeen: new Date().toISOString() },
        isRequester: false,
      },
      {
        _id: 'f2',
        status: 'accepted',
        createdAt: '2026-04-02',
        otherUser: { _id: '2', name: 'James Rivera', username: 'jrivera', isOnline: false, lastSeen: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
        isRequester: true,
      },
      {
        _id: 'f3',
        status: 'accepted',
        createdAt: '2026-06-18',
        otherUser: { _id: '3', name: 'Alex Novak', username: 'anovak', isOnline: true, lastSeen: new Date().toISOString() },
        isRequester: false,
      },
    ];
  } else if (type === 'pending') {
    return [
      {
        _id: 'p1',
        status: 'pending',
        createdAt: new Date().toISOString(),
        otherUser: { _id: '4', name: 'Leo Torres', username: 'leot', isOnline: false, lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() },
        isRequester: false,
      },
    ];
  } else {
    return [
      {
        _id: 's1',
        status: 'pending',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        otherUser: { _id: '5', name: 'Mia Chen', username: 'miac', isOnline: true, lastSeen: new Date().toISOString() },
        isRequester: true,
      },
    ];
  }
};

export default function AdminFriendships() {
  const [friendships, setFriendships] = useState<Friendship[]>(() => getDemoFriendships('friends'));
  const [filter, setFilter] = useState<'friends' | 'pending' | 'sent'>('friends');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Restore cached friendships post-hydration
  useEffect(() => {
    try {
      const raw = localStorage.getItem(FRIENDS_CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        if (Array.isArray(cached) && cached.length > 0) {
          setFriendships(cached);
        }
      }
    } catch {}
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchFriendships = async (type: 'friends' | 'pending' | 'sent', isManual = false) => {
    if (isManual) setRefreshing(true);
    else if (friendships.length === 0) setLoading(true);

    try {
      const res = await fetch(`/api/friends?type=${type}`);
      const data = await res.json();
      if (data.friendships && data.friendships.length > 0) {
        setFriendships(data.friendships);
        if (type === 'friends') {
          try {
            localStorage.setItem(FRIENDS_CACHE_KEY, JSON.stringify(data.friendships));
          } catch {}
        }
      } else {
        setFriendships(getDemoFriendships(type));
      }
    } catch (error) {
      setFriendships(getDemoFriendships(type));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
    fetchFriendships(filter);
  }, [filter]);

  const filteredFriendships = useMemo(() => {
    return friendships.filter((f) => {
      const q = searchQuery.toLowerCase();
      return (
        f.otherUser?.name?.toLowerCase().includes(q) ||
        f.otherUser?.username?.toLowerCase().includes(q)
      );
    });
  }, [friendships, searchQuery]);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredFriendships.length / pageSize));
  const paginatedFriendships = useMemo(() => {
    return filteredFriendships.slice((page - 1) * pageSize, page * pageSize);
  }, [filteredFriendships, page]);

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
            Friends
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Inspect network relationships, pending handshakes, and peer-to-peer friend requests across Novix Messenger
          </p>
        </div>

        <button
          onClick={() => fetchFriendships(filter, true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3.5 py-2.5 text-slate-600 dark:text-slate-300 bg-white dark:bg-[#111a2e] border border-slate-200 dark:border-slate-800 rounded-xl hover:shadow-xs transition text-xs font-bold self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin text-blue-600' : ''} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Graph'}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#111a2e] border border-slate-200/90 dark:border-slate-800/90 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search connections by name or username..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition font-medium"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-bold w-full sm:w-auto">
          <button
            onClick={() => setFilter('friends')}
            className={`px-4 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              filter === 'friends'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            <Users size={13} />
            <span>Mutual Friends</span>
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              filter === 'pending'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            <Clock size={13} />
            <span>Pending Requests</span>
          </button>
          <button
            onClick={() => setFilter('sent')}
            className={`px-4 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              filter === 'sent'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            <Send size={13} />
            <span>Sent Requests</span>
          </button>
        </div>
      </div>

      {/* Friendships Table */}
      <div className="bg-white dark:bg-[#111a2e] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-850/50 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4 sm:px-6">Contact / User</th>
                <th className="py-3.5 px-4">Direction</th>
                <th className="py-3.5 px-4">Relationship Status</th>
                <th className="py-3.5 px-4">Connected Date</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Triage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {loading && filteredFriendships.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400">
                    <RefreshCw size={24} className="animate-spin text-blue-500 mx-auto mb-2" />
                    <span>Loading connections graph...</span>
                  </td>
                </tr>
              ) : filteredFriendships.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400">
                    <Users size={36} className="mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                    <p className="font-bold text-slate-700 dark:text-slate-300">No {filter} found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Try searching with a different keyword</p>
                  </td>
                </tr>
              ) : (
                paginatedFriendships.map((f) => (
                  <tr
                    key={f._id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition duration-150"
                  >
                    {/* User Identity */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {f.otherUser?.avatar ? (
                            <img
                              src={f.otherUser.avatar}
                              alt={f.otherUser.name}
                              className="w-9 h-9 rounded-xl object-cover ring-2 ring-slate-100 dark:ring-slate-800"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-xs shadow-xs">
                              {f.otherUser?.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                          )}
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                              f.otherUser?.isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 dark:text-white truncate">
                            {f.otherUser?.name}
                          </div>
                          <div className="text-[11px] text-slate-400 font-medium truncate">
                            @{f.otherUser?.username}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Direction */}
                    <td className="py-3.5 px-4">
                      <span className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                        {f.isRequester ? 'Outbound Request' : 'Inbound Request'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider border ${
                          f.status === 'accepted'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            f.status === 'accepted' ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                        />
                        <span>{f.status}</span>
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-xs">
                      {new Date(f.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <Link
                        href={`/admin/users?q=${encodeURIComponent(f.otherUser.username)}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 border border-blue-200/70 dark:border-blue-800/70 transition"
                      >
                        <span>Inspect User</span>
                        <ExternalLink size={12} />
                      </Link>
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
            Showing <strong className="text-slate-700 dark:text-slate-200">{filteredFriendships.length}</strong> connections • Page <strong className="text-slate-700 dark:text-slate-200">{page}</strong> of <strong className="text-slate-700 dark:text-slate-200">{totalPages}</strong>
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
    </div>
  );
}

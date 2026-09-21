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
  MessageCircle
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

export default function AdminFriendships() {
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [filter, setFilter] = useState<'friends' | 'pending' | 'sent'>('friends');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchFriendships = async (type: 'friends' | 'pending' | 'sent', isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch(`/api/friends?type=${type}`);
      const data = await res.json();
      if (data.friendships) {
        setFriendships(data.friendships);
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

  useEffect(() => {
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
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <UserCheck size={20} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Friends & Social Graph
            </h1>
            <span className="px-2.5 py-0.5 text-[11px] font-extrabold rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Directory
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Inspect network relationships, pending handshakes, and peer-to-peer friend requests across Novix Messenger.
          </p>
        </div>

        <button
          onClick={() => fetchFriendships(filter, true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3.5 py-2.5 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:shadow-xs transition text-xs font-bold self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin text-blue-600' : ''} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Graph'}</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Connections</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <UserCheck size={16} />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {filter === 'friends' ? friendships.length : '—'}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            Mutual accepted friendships
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Incoming</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {filter === 'pending' ? friendships.length : '—'}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            Awaiting user acceptance
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sent Inquiries</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Send size={16} />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {filter === 'sent' ? friendships.length : '—'}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            Outbound requests in progress
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search connections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-bold w-full md:w-auto">
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl shadow-xs overflow-hidden">
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
              {loading ? (
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
                filteredFriendships.map((f) => (
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
      </div>
    </div>
  );
}

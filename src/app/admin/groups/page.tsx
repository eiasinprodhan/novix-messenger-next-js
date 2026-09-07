'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Users2, Search, Trash2, RefreshCw, ShieldAlert, ChevronLeft, ChevronRight, Calendar, User, Hash } from 'lucide-react';

export default function AdminGroupsPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>({ total: 0, pages: 1 });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        q: search,
      });

      const res = await fetch(`/api/admin/groups?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups || []);
        setPagination(data.pagination || { total: 0, pages: 1 });
      }
    } catch (err) {
      console.error('Failed to fetch groups:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleDeleteGroup = async (id: string, groupName: string) => {
    if (!confirm(`Are you sure you want to delete group "${groupName}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(id);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/groups/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        fetchGroups();
      } else {
        alert(data.error || 'Failed to delete group');
      }
    } catch (err: any) {
      console.error('Delete group error:', err);
      alert(err.message || 'An error occurred while deleting the group');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Groups & Community Channels
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Monitor, inspect, and moderate group channels across Novix Messenger
          </p>
        </div>
        <button
          onClick={() => fetchGroups()}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#111a2e] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-xs cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-blue-500' : ''} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-4 bg-white dark:bg-[#111a2e] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search groups by name or topic..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition font-medium"
          />
        </div>
      </div>

      {/* Groups Table */}
      <div className="bg-white dark:bg-[#111a2e] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
          <table className="w-full text-left text-xs sm:text-sm min-w-[650px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-6">Group Name & Info</th>
                <th className="py-3.5 px-6">Created By</th>
                <th className="py-3.5 px-6">Members</th>
                <th className="py-3.5 px-6">Created Date</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading groups directory...</span>
                    </div>
                  </td>
                </tr>
              ) : groups.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No groups found matching your search.
                  </td>
                </tr>
              ) : (
                groups.map((group) => {
                  const creator = group.createdBy;
                  return (
                    <tr key={group._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                            {group.name?.[0]?.toUpperCase() || 'G'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 dark:text-white truncate text-sm">
                              {group.name}
                            </div>
                            <div className="text-xs text-slate-400 dark:text-slate-400 truncate max-w-xs">
                              {group.description || 'No description provided'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-slate-400 shrink-0" />
                          <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                            {creator ? creator.name : 'Unknown User'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50">
                          <Users2 size={13} />
                          {group.members?.length || 0} Members
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                          <Calendar size={13} className="text-slate-400" />
                          <span>{new Date(group.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteGroup(group._id, group.name)}
                          disabled={deletingId === group._id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/40 transition disabled:opacity-50 cursor-pointer"
                        >
                          <Trash2 size={14} />
                          <span>{deletingId === group._id ? 'Deleting...' : 'Delete'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            Total: <strong>{pagination.total}</strong> groups • Page {page} of {pagination.pages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page >= pagination.pages}
              className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

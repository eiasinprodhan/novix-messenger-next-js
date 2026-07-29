'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Users, Search, Trash2, RefreshCw, ShieldAlert, ChevronLeft, ChevronRight } from 'lucide-react';

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

      if (res.ok) {
        fetchGroups();
      } else {
        alert('Failed to delete group');
      }
    } catch (err) {
      console.error('Delete group error:', err);
      alert('An error occurred while deleting the group');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Group Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            View and manage user created groups across the Novix Messenger platform
          </p>
        </div>
        <button
          onClick={() => fetchGroups()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search group name or description..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>
      </div>

      {/* Groups Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-6">Group Info</th>
                <th className="py-3.5 px-6">Created By</th>
                <th className="py-3.5 px-6">Members</th>
                <th className="py-3.5 px-6">Created Date</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Loading groups...
                  </td>
                </tr>
              ) : groups.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No groups found.
                  </td>
                </tr>
              ) : (
                groups.map((group) => {
                  const creator = group.createdBy;
                  return (
                    <tr key={group._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                            {group.avatar ? (
                              <img src={group.avatar} alt="" className="w-full h-full rounded-xl object-cover" />
                            ) : (
                              <Users size={20} />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{group.name}</div>
                            {group.description && (
                              <div className="text-xs text-slate-500 max-w-xs truncate">{group.description}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        {creator ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700">
                              {creator.name?.[0] || 'U'}
                            </div>
                            <span className="text-xs font-semibold text-slate-800">{creator.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Unknown</span>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                          {group.members?.length || 0} members
                        </span>
                      </td>

                      <td className="py-4 px-6 text-xs text-slate-500">
                        {new Date(group.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleDeleteGroup(group._id, group.name)}
                          disabled={deletingId === group._id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition border border-red-100 disabled:opacity-50"
                        >
                          <Trash2 size={14} />
                          Delete
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
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing total <span className="font-bold text-slate-800">{pagination.total}</span> groups
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <span>
              Page <strong className="text-slate-800">{page}</strong> of {pagination.pages || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, pagination.pages))}
              disabled={page >= pagination.pages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

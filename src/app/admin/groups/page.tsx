'use client';

import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';
import { Users2, Search, Trash2, RefreshCw, ShieldAlert, ChevronLeft, ChevronRight, Calendar, User, Hash } from 'lucide-react';

const GROUPS_CACHE_KEY = 'novix_admin_groups_cache';

export default function AdminGroupsPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>({ total: 0, pages: 1 });
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Restore cached groups post-hydration
  useEffect(() => {
    try {
      const raw = localStorage.getItem(GROUPS_CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        if (Array.isArray(cached) && cached.length > 0) {
          setGroups(cached);
          setLoading(false);
        }
      }
    } catch {}
  }, []);

  const fetchGroups = useCallback(async () => {
    if (groups.length === 0) setLoading(true);
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
        if (!search && page === 1) {
          try {
            localStorage.setItem(GROUPS_CACHE_KEY, JSON.stringify(data.groups || []));
          } catch {}
        }
      }
    } catch (err) {
      console.error('Failed to fetch groups:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, groups.length]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const confirmDeleteGroup = async () => {
    if (!deleteTarget) return;
    const { id, name } = deleteTarget;
    setIsDeleting(true);

    const previousGroups = [...groups];

    // Fast optimistic removal from table
    setGroups((prev) => prev.filter((g) => g._id !== id));
    setDeleteTarget(null);
    setIsDeleting(false);
    toast.success(`Group "${name}" deleted successfully`);

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/groups/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        setGroups(previousGroups);
        toast.error(data.error || 'Failed to delete group');
      } else {
        try {
          localStorage.setItem(GROUPS_CACHE_KEY, JSON.stringify(groups.filter((g) => g._id !== id)));
        } catch {}
      }
    } catch (err: any) {
      setGroups(previousGroups);
      toast.error(err.message || 'An error occurred while deleting the group');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Groups
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
      <div className="p-4 bg-white dark:bg-[#111a2e] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
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

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-3 py-2 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl whitespace-nowrap">
            Total: <strong className="text-slate-800 dark:text-slate-200">{pagination.total || groups.length}</strong> Groups
          </span>
        </div>
      </div>

      {/* Groups Table */}
      <div className="bg-white dark:bg-[#111a2e] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
          <table className="w-full text-left text-xs sm:text-sm min-w-[650px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-850/50 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-6">Group Name & Info</th>
                <th className="py-3.5 px-6">Created By</th>
                <th className="py-3.5 px-6">Members</th>
                <th className="py-3.5 px-6">Created Date</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300 text-xs">
              {loading && groups.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400">
                    <RefreshCw size={24} className="animate-spin text-blue-500 mx-auto mb-2" />
                    <span>Loading groups directory...</span>
                  </td>
                </tr>
              ) : groups.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400">
                    <Users2 size={36} className="mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                    <p className="font-bold text-slate-700 dark:text-slate-300">No groups found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Try searching with a different keyword</p>
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
                          onClick={() => setDeleteTarget({ id: group._id, name: group.name })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/40 transition cursor-pointer"
                        >
                          <Trash2 size={14} />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-850/50 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            Showing <strong className="text-slate-700 dark:text-slate-200">{groups.length}</strong> groups • Page <strong className="text-slate-700 dark:text-slate-200">{page}</strong> of <strong className="text-slate-700 dark:text-slate-200">{pagination.pages || 1}</strong>
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
              onClick={() => setPage((p) => Math.min(pagination.pages || 1, p + 1))}
              disabled={page >= (pagination.pages || 1)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-xs cursor-pointer flex items-center gap-1 font-semibold"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Group Confirmation Modal Popup */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Group Channel"
        itemName={deleteTarget?.name}
        description={`Are you sure you want to delete group "${deleteTarget?.name}"? All message history, members, and attachments associated with this group will be permanently erased.`}
        confirmLabel="Delete Group"
        isLoading={isDeleting}
        onConfirm={confirmDeleteGroup}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

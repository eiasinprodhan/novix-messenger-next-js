'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Clock, ChevronLeft, ChevronRight, Download, Search, RefreshCw, Filter } from 'lucide-react';

interface Log {
  _id: string;
  admin?: { name: string; username: string; email: string };
  action: string;
  targetType?: string;
  targetId?: string;
  details?: any;
  createdAt: string;
}

const LOGS_CACHE_KEY = 'novix_admin_logs_cache';

export default function AdminLogs() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [eventFilter, setEventFilter] = useState('all');

  // Restore cached logs post-hydration
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOGS_CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        if (Array.isArray(cached) && cached.length > 0) {
          setLogs(cached);
        }
      }
    } catch {}
  }, []);

  const fetchLogs = async (currentPage = 1, isManual = false) => {
    if (isManual) setRefreshing(true);
    else if (logs.length === 0) setLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/logs?page=${currentPage}&limit=15`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok && data.logs) {
        setLogs(data.logs);
        setTotalPages(data.pagination?.pages || 1);
        if (currentPage === 1) {
          try {
            localStorage.setItem(LOGS_CACHE_KEY, JSON.stringify(data.logs));
          } catch {}
        }
      }
    } catch (err) {
      console.error('Failed to fetch logs', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const exportLogsCSV = () => {
    if (!logs || logs.length === 0) {
      alert('No logs found to export');
      return;
    }
    const headers = ['Log ID', 'Timestamp', 'Admin Name', 'Admin Email', 'Action', 'Target Type', 'Target ID', 'Details'];
    const rows = logs.map((l) => [
      l._id,
      l.createdAt ? new Date(l.createdAt).toISOString() : '',
      `"${(l.admin?.name || 'System').replace(/"/g, '""')}"`,
      `"${(l.admin?.email || '').replace(/"/g, '""')}"`,
      `"${(l.action || '').replace(/"/g, '""')}"`,
      `"${(l.targetType || '').replace(/"/g, '""')}"`,
      `"${(l.targetId || '').replace(/"/g, '""')}"`,
      `"${JSON.stringify(l.details || {}).replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `novix_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    fetchLogs(page);
  }, [page]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        log.admin?.name?.toLowerCase().includes(q) ||
        log.admin?.username?.toLowerCase().includes(q) ||
        log.action?.toLowerCase().includes(q) ||
        log.targetType?.toLowerCase().includes(q) ||
        (typeof log.details === 'object' && JSON.stringify(log.details).toLowerCase().includes(q));

      const matchesFilter =
        eventFilter === 'all' ||
        (eventFilter === 'auth' && (log.action.includes('AUTH') || log.action.includes('LOGIN'))) ||
        (eventFilter === 'mod' && (log.action.includes('BAN') || log.action.includes('RESOLVE') || log.action.includes('UPDATE'))) ||
        (eventFilter === 'deletion' && (log.action.includes('DELETE') || log.action.includes('REMOVE')));

      return matchesSearch && matchesFilter;
    });
  }, [logs, searchQuery, eventFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Logs
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">
            Immutable audit trail of administrative activities, user modifications & security events
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => fetchLogs(page, true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2.5 text-slate-600 dark:text-slate-300 bg-white dark:bg-[#111a2e] border border-slate-200 dark:border-slate-800 rounded-xl hover:shadow-xs transition text-xs font-bold cursor-pointer"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-blue-600' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Logs'}</span>
          </button>
          <button
            onClick={exportLogsCSV}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs sm:text-sm font-semibold flex items-center gap-2 px-3.5 py-2.5 rounded-xl transition shadow-xs cursor-pointer"
            title="Export current audit logs as CSV"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Unified Search & Filter Bar */}
      <div className="p-4 bg-white dark:bg-[#111a2e] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input on Left */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search audit logs by admin, event, target..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition font-medium"
          />
        </div>

        {/* Filter Dropdown on Right */}
        <div className="flex items-center gap-2">
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:border-blue-500 shadow-xs transition cursor-pointer"
          >
            <option value="all">All Event Types</option>
            <option value="auth">Auth & Security</option>
            <option value="mod">Mod Actions</option>
            <option value="deletion">Deletions & Bans</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table Container */}
      <div className="bg-white dark:bg-[#111a2e] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
          <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[720px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-850/50 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-5">Timestamp</th>
                <th className="py-3.5 px-5">Administrator</th>
                <th className="py-3.5 px-5">Action Event</th>
                <th className="py-3.5 px-5">Target Entity</th>
                <th className="py-3.5 px-5">Details & Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300 text-xs">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400 font-medium">
                    <RefreshCw size={24} className="animate-spin text-blue-500 mx-auto mb-2" />
                    <span>Fetching audit logs...</span>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400 font-medium">
                    <FileText size={36} className="mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                    <p className="font-bold text-slate-700 dark:text-slate-300">No audit logs found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Try adjusting your search query or event filter</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const actionLabel = log.action.replace(/_/g, ' ');
                  const isDanger = log.action.includes('DELETED') || log.action.includes('BANNED') || log.action.includes('REMOVED');
                  const isSuccess = log.action.includes('CREATED') || log.action.includes('RESOLVED');
                  const isAuth = log.action.includes('LOGIN') || log.action.includes('AUTH');

                  const targetName = log.details?.recipientUsername
                    ? `@${log.details.recipientUsername}`
                    : log.details?.username
                    ? `@${log.details.username}`
                    : log.targetType || 'System';

                  return (
                    <tr key={log._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap font-medium">
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} className="text-slate-400" />
                          <span>{new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-lg flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                            {log.admin?.name?.[0]?.toUpperCase() || 'A'}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs text-slate-900 dark:text-white font-bold truncate">
                              {log.admin?.name || 'System Admin'}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              @{log.admin?.username || 'admin'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          isDanger
                            ? 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50'
                            : isSuccess
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50'
                            : isAuth
                            ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900/50'
                            : 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50'
                        }`}>
                          {actionLabel}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {targetName}
                      </td>
                      <td className="py-3.5 px-5 text-xs text-slate-600 dark:text-slate-400 max-w-xs font-mono">
                        {log.details ? (
                          <span className="truncate block bg-slate-50 dark:bg-slate-900/80 px-2 py-1 rounded border border-slate-200/50 dark:border-slate-800/80 text-[11px]">
                            {typeof log.details === 'object'
                              ? JSON.stringify(log.details).replace(/[{}"]/g, '')
                              : String(log.details)}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">No details</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Unified Pagination Bar */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-850/50 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            Showing <strong className="text-slate-700 dark:text-slate-200">{filteredLogs.length}</strong> logs • Page <strong className="text-slate-700 dark:text-slate-200">{page}</strong> of <strong className="text-slate-700 dark:text-slate-200">{totalPages}</strong>
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

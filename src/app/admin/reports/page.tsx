'use client';

import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  Flag,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  ExternalLink,
  AlertTriangle,
  User as UserIcon,
} from 'lucide-react';
import Link from 'next/link';

interface Report {
  _id: string;
  reporter?: { _id: string; name: string; username: string; email: string; avatar?: string };
  reported?: { _id: string; name: string; username: string; email: string; avatar?: string; role: string };
  reason: string;
  message?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: string;
}

const REPORTS_CACHE_KEY = 'novix_admin_reports_cache';

export default function AdminReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Restore cached reports post-hydration
  useEffect(() => {
    try {
      const raw = localStorage.getItem(REPORTS_CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        if (Array.isArray(cached) && cached.length > 0) {
          setReports(cached);
        }
      }
    } catch {}
  }, []);

  const fetchReports = async (status = 'pending', currentPage = 1, isManual = false) => {
    if (isManual) setRefreshing(true);
    else if (reports.length === 0) setLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      let url = `/api/admin/reports?page=${currentPage}&limit=10`;
      if (status && status !== 'all') url += `&status=${status}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok && data.reports) {
        setReports(data.reports);
        setTotalPages(data.pagination?.pages || 1);
        setTotalCount(data.pagination?.total || data.reports.length);
        if (status === 'pending' && currentPage === 1) {
          try {
            localStorage.setItem(REPORTS_CACHE_KEY, JSON.stringify(data.reports));
          } catch {}
        }
      }
    } catch (err) {
      console.error('Failed to fetch reports', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports(statusFilter, page);
  }, [statusFilter, page]);

  const updateReportStatus = async (reportId: string, newStatus: string) => {
    const previousReports = [...reports];

    // Fast optimistic update in UI
    setReports((prev) =>
      prev.map((r) => (r._id === reportId ? { ...r, status: newStatus as any } : r))
    );
    toast.success(`Report status updated to ${newStatus}`);

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/reports', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reportId, status: newStatus }),
      });

      if (!res.ok) {
        setReports(previousReports);
        toast.error('Failed to update report status');
      }
    } catch (err) {
      setReports(previousReports);
      toast.error('Network error updating report');
    }
  };

  const filteredReports = useMemo(() => {
    if (!searchQuery.trim()) return reports;
    const q = searchQuery.toLowerCase();
    return reports.filter((r) => {
      return (
        r.reported?.name?.toLowerCase().includes(q) ||
        r.reported?.username?.toLowerCase().includes(q) ||
        r.reporter?.name?.toLowerCase().includes(q) ||
        r.reporter?.username?.toLowerCase().includes(q) ||
        r.reason?.toLowerCase().includes(q) ||
        r.message?.toLowerCase().includes(q)
      );
    });
  }, [reports, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Reports
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">
            Review user complaints, behavior violations, and take disciplinary actions
          </p>
        </div>
        <button
          onClick={() => fetchReports(statusFilter, page, true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#111a2e] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-xs cursor-pointer"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin text-blue-500' : ''} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Reports'}</span>
        </button>
      </div>

      {/* Unified Search & Filter Bar */}
      <div className="p-4 bg-white dark:bg-[#111a2e] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input on Left */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search reports by user or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition font-medium"
          />
        </div>

        {/* Filter Tabs on Right */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-bold w-full sm:w-auto">
          {['pending', 'reviewed', 'resolved', 'dismissed'].map((status) => {
            const isActive = statusFilter === status;
            return (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg capitalize transition cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                {status}
              </button>
            );
          })}
        </div>
      </div>

      {/* Reports Table Container */}
      <div className="bg-white dark:bg-[#111a2e] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
          <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[720px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-850/50 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-5">Reported Account</th>
                <th className="py-3.5 px-5">Complainant</th>
                <th className="py-3.5 px-5">Violation Reason</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5">Filed Date</th>
                <th className="py-3.5 px-5 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300 text-xs">
              {loading && reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <RefreshCw size={24} className="animate-spin text-amber-500 mx-auto mb-2" />
                    <span>Loading moderation reports...</span>
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <CheckCircle size={36} className="mx-auto text-emerald-500 mb-2" />
                    <p className="font-bold text-slate-700 dark:text-slate-300">Moderation Queue is Clear</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      No reports found under <span className="font-semibold text-amber-600 dark:text-amber-400">{statusFilter}</span>
                    </p>
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr
                    key={report._id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition duration-150"
                  >
                    {/* Reported User */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-950/70 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {report.reported?.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 dark:text-white truncate max-w-[140px]">
                            {report.reported?.name || 'Unknown User'}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            @{report.reported?.username || 'user'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Reporter */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2">
                        <UserIcon size={14} className="text-slate-400 shrink-0" />
                        <div className="min-w-0">
                          <span className="font-medium text-slate-800 dark:text-slate-200 truncate block max-w-[130px]">
                            {report.reporter?.name || 'Anonymous User'}
                          </span>
                          <span className="text-[11px] text-slate-400 block truncate">
                            @{report.reporter?.username || 'user'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Reason */}
                    <td className="py-3.5 px-5 max-w-xs">
                      <div>
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 mb-1">
                          {report.reason}
                        </span>
                        {report.message && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate italic">
                            "{report.message}"
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        report.status === 'pending'
                          ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/80'
                          : report.status === 'resolved'
                          ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/80'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {report.status}
                      </span>
                    </td>

                    {/* Filed Date */}
                    <td className="py-3.5 px-5 text-slate-500 dark:text-slate-400 whitespace-nowrap font-medium text-xs">
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-slate-400" />
                        <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {report.status !== 'resolved' && (
                          <button
                            onClick={() => updateReportStatus(report._id, 'resolved')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-xs font-bold transition cursor-pointer"
                            title="Mark as Resolved"
                          >
                            <CheckCircle size={13} />
                            <span>Resolve</span>
                          </button>
                        )}
                        {report.status !== 'dismissed' && (
                          <button
                            onClick={() => updateReportStatus(report._id, 'dismissed')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-750 text-xs font-bold transition cursor-pointer"
                            title="Dismiss Report"
                          >
                            <XCircle size={13} />
                            <span>Dismiss</span>
                          </button>
                        )}
                        {report.reported?.username && (
                          <Link
                            href={`/admin/users?q=${encodeURIComponent(report.reported.username)}`}
                            className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition"
                            title="Inspect User Account"
                          >
                            <ExternalLink size={14} />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Unified Pagination Bar */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-850/50 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            Showing <strong className="text-slate-700 dark:text-slate-200">{filteredReports.length}</strong> reports • Page <strong className="text-slate-700 dark:text-slate-200">{page}</strong> of <strong className="text-slate-700 dark:text-slate-200">{totalPages}</strong>
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

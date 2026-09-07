'use client';

import React, { useState, useEffect } from 'react';
import { Flag, CheckCircle, XCircle, ShieldAlert, Clock, User, ChevronLeft, ChevronRight, AlertTriangle, ArrowRight } from 'lucide-react';

interface Report {
  _id: string;
  reporter?: { _id: string; name: string; username: string; email: string; avatar?: string };
  reported?: { _id: string; name: string; username: string; email: string; avatar?: string; role: string };
  reason: string;
  message?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: string;
}

export default function AdminReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchReports = async (status = 'pending', currentPage = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      let url = `/api/admin/reports?page=${currentPage}&limit=10`;
      if (status) url += `&status=${status}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok && data.reports) {
        setReports(data.reports);
        setTotalPages(data.pagination?.pages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(statusFilter, page);
  }, [statusFilter, page]);

  const updateReportStatus = async (reportId: string, newStatus: string) => {
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

      if (res.ok) {
        fetchReports(statusFilter, page);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Reports & Moderation Queue
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">
          Review user complaints, behavior violations, and take disciplinary actions
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {['pending', 'reviewed', 'resolved', 'dismissed'].map((status) => {
          const isActive = statusFilter === status;
          return (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
                isActive
                  ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/80 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              {status}
            </button>
          );
        })}
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-16 text-slate-400 text-sm font-medium">
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <span>Fetching reports database...</span>
            </div>
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white dark:bg-[#111a2e] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-12 text-center shadow-xs">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-3">
              <CheckCircle size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Moderation Queue is Clear</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              There are currently no reports marked as <span className="font-semibold text-amber-600 dark:text-amber-400">{statusFilter}</span>.
            </p>
          </div>
        ) : (
          reports.map((report) => (
            <div
              key={report._id}
              className="bg-white dark:bg-[#111a2e] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-md transition duration-150"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/60">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 flex items-center justify-center shrink-0">
                    <Flag size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Reason: {report.reason}</span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 font-medium">
                      <Clock size={12} />
                      <span>{new Date(report.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                    report.status === 'pending'
                      ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                      : report.status === 'resolved'
                      ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    {report.status}
                  </span>
                </div>
              </div>

              {/* Reported Content & Actors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4 p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60 text-xs">
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Reported User</span>
                  <div className="mt-1 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-950/70 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-[10px]">
                      {report.reported?.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <span className="truncate">{report.reported?.name || 'Unknown User'}</span>
                    <span className="text-slate-400 font-normal">(@{report.reported?.username || 'user'})</span>
                  </div>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Filed By (Reporter)</span>
                  <div className="mt-1 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[10px]">
                      {report.reporter?.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <span className="truncate">{report.reporter?.name || 'Anonymous User'}</span>
                    <span className="text-slate-400 font-normal">(@{report.reporter?.username || 'user'})</span>
                  </div>
                </div>
              </div>

              {report.message && (
                <div className="p-3 bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 rounded-xl text-xs text-slate-700 dark:text-slate-300 mb-4">
                  <span className="font-bold text-amber-700 dark:text-amber-400 block mb-0.5">Reported Message Content:</span>
                  <span className="italic">"{report.message}"</span>
                </div>
              )}

              {/* Actions Toolbar */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                {report.status !== 'resolved' && (
                  <button
                    onClick={() => updateReportStatus(report._id, 'resolved')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <CheckCircle size={14} />
                    <span>Mark as Resolved</span>
                  </button>
                )}
                {report.status !== 'dismissed' && (
                  <button
                    onClick={() => updateReportStatus(report._id, 'dismissed')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
                  >
                    <XCircle size={14} />
                    <span>Dismiss Report</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 bg-white dark:bg-[#111a2e] border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shadow-xs">
            <span>Page {page} of {totalPages}</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40 transition cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40 transition cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

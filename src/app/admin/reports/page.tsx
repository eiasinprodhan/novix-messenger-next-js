'use client';

import React, { useState, useEffect } from 'react';
import { Flag, CheckCircle, AlertOctagon, XCircle, ShieldAlert } from 'lucide-react';

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Reports & Moderation</h1>
          <p className="text-zinc-400 text-sm mt-0.5">Review user complaints, content violations & abuse reports</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 border-b border-zinc-800 pb-3">
        {['pending', 'reviewed', 'resolved', 'dismissed'].map((status) => (
          <button
            key={status}
            onClick={() => {
              setStatusFilter(status);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition ${
              statusFilter === status
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'text-zinc-400 hover:bg-zinc-900'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-zinc-500 text-sm">Fetching reports database...</div>
        ) : reports.length === 0 ? (
          <div className="card bg-zinc-900/40 border-zinc-800 p-8 text-center text-zinc-500 text-sm rounded-2xl">
            No {statusFilter} reports found.
          </div>
        ) : (
          reports.map((report) => (
            <div key={report._id} className="card bg-zinc-900/60 border-zinc-800/80 p-5 rounded-2xl space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono uppercase tracking-wider px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded border border-amber-500/20 font-semibold">
                        {report.reason.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-zinc-500">• {new Date(report.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider bg-zinc-800 text-zinc-300">
                  {report.status}
                </span>
              </div>

              {/* Reported vs Reporter */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-950/50 p-3.5 rounded-xl border border-zinc-800/40 text-xs">
                <div>
                  <span className="text-zinc-500 font-medium uppercase text-[10px] block mb-1">REPORTED USER</span>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-zinc-800 rounded-full flex items-center justify-center font-semibold text-white">
                      {report.reported?.name?.[0] || 'U'}
                    </div>
                    <div>
                      <div className="text-white font-medium">{report.reported?.name || 'Unknown'}</div>
                      <div className="text-zinc-500">@{report.reported?.username || 'unknown'}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-zinc-500 font-medium uppercase text-[10px] block mb-1">REPORTER</span>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-zinc-800 rounded-full flex items-center justify-center font-semibold text-white">
                      {report.reporter?.name?.[0] || 'R'}
                    </div>
                    <div>
                      <div className="text-white font-medium">{report.reporter?.name || 'Unknown'}</div>
                      <div className="text-zinc-500">@{report.reporter?.username || 'unknown'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {report.message && (
                <div className="text-sm text-zinc-300 bg-zinc-950/30 p-3 rounded-xl border border-zinc-800/30">
                  <span className="text-xs text-zinc-500 block mb-1">Details / Note:</span>
                  "{report.message}"
                </div>
              )}

              {/* Moderation Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800/60">
                {report.status !== 'resolved' && (
                  <button
                    onClick={() => updateReportStatus(report._id, 'resolved')}
                    className="px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <CheckCircle size={14} /> Resolve Report
                  </button>
                )}

                {report.status !== 'dismissed' && (
                  <button
                    onClick={() => updateReportStatus(report._id, 'dismissed')}
                    className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <XCircle size={14} /> Dismiss
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-zinc-400">
          <div>Page {page} of {totalPages}</div>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white rounded-xl transition text-xs font-medium"
            >
              Previous
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white rounded-xl transition text-xs font-medium"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

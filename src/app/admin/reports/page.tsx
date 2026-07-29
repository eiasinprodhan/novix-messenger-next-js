'use client';

import React, { useState, useEffect } from 'react';
import { Flag, CheckCircle, XCircle, ShieldAlert } from 'lucide-react';

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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Reports & Moderation</h1>
        <p className="text-slate-500 text-sm mt-0.5">Review user complaints, content violations & abuse reports</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-3">
        {['pending', 'reviewed', 'resolved', 'dismissed'].map((status) => (
          <button
            key={status}
            onClick={() => {
              setStatusFilter(status);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition ${
              statusFilter === status
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm font-medium">Fetching reports database...</div>
        ) : reports.length === 0 ? (
          <div className="bg-white border border-slate-200 p-12 text-center text-slate-400 text-sm font-medium rounded-2xl">
            No {statusFilter} reports found.
          </div>
        ) : (
          reports.map((report) => (
            <div key={report._id} className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-xs">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-600">
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono uppercase px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold">
                        {report.reason.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-400">• {new Date(report.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                  {report.status}
                </span>
              </div>

              {/* Reported vs Reporter */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block mb-1">REPORTED USER</span>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white">
                      {report.reported?.name?.[0] || 'U'}
                    </div>
                    <div>
                      <div className="text-slate-900 font-semibold">{report.reported?.name || 'Unknown'}</div>
                      <div className="text-slate-500">@{report.reported?.username || 'unknown'}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block mb-1">REPORTER</span>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center font-bold text-slate-700">
                      {report.reporter?.name?.[0] || 'R'}
                    </div>
                    <div>
                      <div className="text-slate-900 font-semibold">{report.reporter?.name || 'Unknown'}</div>
                      <div className="text-slate-500">@{report.reporter?.username || 'unknown'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {report.message && (
                <div className="text-sm text-slate-700 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/60">
                  <span className="text-xs font-semibold text-slate-400 block mb-1">Details / Note:</span>
                  "{report.message}"
                </div>
              )}

              {/* Moderation Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                {report.status !== 'resolved' && (
                  <button
                    onClick={() => updateReportStatus(report._id, 'resolved')}
                    className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <CheckCircle size={14} /> Resolve Report
                  </button>
                )}

                {report.status !== 'dismissed' && (
                  <button
                    onClick={() => updateReportStatus(report._id, 'dismissed')}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
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
        <div className="flex items-center justify-between text-sm text-slate-500 font-medium">
          <div>Page {page} of {totalPages}</div>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 text-slate-700 rounded-xl transition text-xs font-semibold"
            >
              Previous
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 text-slate-700 rounded-xl transition text-xs font-semibold"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

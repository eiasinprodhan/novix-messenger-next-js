'use client';

import React, { useState, useEffect } from 'react';

interface Log {
  _id: string;
  admin?: { name: string; username: string; email: string };
  action: string;
  targetType?: string;
  targetId?: string;
  details?: any;
  createdAt: string;
}

export default function AdminLogs() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async (currentPage = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/logs?page=${currentPage}&limit=15`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok && data.logs) {
        setLogs(data.logs);
        setTotalPages(data.pagination?.pages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page);
  }, [page]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">System Audit Logs</h1>
        <p className="text-slate-500 text-sm mt-0.5">Immutable record of administrative actions, user changes & system moderation</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-bold tracking-wider">
            <tr>
              <th className="p-4">Timestamp</th>
              <th className="p-4">Admin</th>
              <th className="p-4">Action</th>
              <th className="p-4">Target</th>
              <th className="p-4">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-slate-400 font-medium">
                  Fetching audit logs...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-slate-400 font-medium">
                  No system logs recorded yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const actionLabel = log.action.replace(/_/g, ' ');
                const isCreated = log.action.includes('CREATED');
                const isDeleted = log.action.includes('DELETED');

                const targetName = log.details?.recipientUsername
                  ? `@${log.details.recipientUsername}`
                  : log.details?.username
                  ? `@${log.details.username}`
                  : log.targetType || 'System';

                return (
                  <tr key={log._id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4 text-xs text-slate-500 font-medium">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-xs shadow-xs">
                          {log.admin?.name?.[0] || 'A'}
                        </div>
                        <div>
                          <div className="text-xs text-slate-900 font-bold">{log.admin?.name || 'System Admin'}</div>
                          <div className="text-[11px] text-slate-400">@{log.admin?.username || 'admin'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide ${
                        isCreated ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        isDeleted ? 'bg-red-50 text-red-700 border border-red-200' :
                        'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}>
                        {actionLabel}
                      </span>
                    </td>
                    <td className="p-4 text-xs">
                      <div className="font-semibold text-slate-900">{targetName}</div>
                      {log.targetType && <div className="text-[11px] text-slate-400">{log.targetType}</div>}
                    </td>
                    <td className="p-4 text-xs">
                      {log.details && typeof log.details === 'object' ? (
                        <div className="flex flex-wrap gap-1.5 max-w-sm">
                          {Object.entries(log.details).map(([key, val]) => (
                            <span key={key} className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md text-[11px] text-slate-700 font-medium">
                              <span className="text-slate-400 font-normal">{key}:</span> {String(val)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-500">{log.details || '-'}</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
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

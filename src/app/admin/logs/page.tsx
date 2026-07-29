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
              logs.map((log) => (
                <tr key={log._id} className="hover:bg-slate-50/80 transition">
                  <td className="p-4 text-xs text-slate-500 font-mono">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-600 text-white rounded-md flex items-center justify-center font-bold text-xs">
                        {log.admin?.name?.[0] || 'A'}
                      </div>
                      <span className="text-xs text-slate-900 font-semibold">{log.admin?.name || 'System Admin'}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-mono font-bold">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-slate-500 font-mono">
                    {log.targetType || 'System'} {log.targetId ? `(${log.targetId.substring(0, 8)}...)` : ''}
                  </td>
                  <td className="p-4 text-xs text-slate-500">
                    <pre className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-[11px] font-mono max-w-xs truncate overflow-hidden text-slate-800">
                      {JSON.stringify(log.details || {})}
                    </pre>
                  </td>
                </tr>
              ))
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

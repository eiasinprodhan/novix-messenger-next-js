'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Shield, User, Clock } from 'lucide-react';

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
        <h1 className="text-3xl font-semibold tracking-tight text-white">System Audit Logs</h1>
        <p className="text-zinc-400 text-sm mt-0.5">Immutable record of administrative actions, user changes & system moderation</p>
      </div>

      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-zinc-950/60 border-b border-zinc-800/80 text-zinc-400 text-xs uppercase font-medium">
            <tr>
              <th className="p-4">Timestamp</th>
              <th className="p-4">Admin</th>
              <th className="p-4">Action</th>
              <th className="p-4">Target</th>
              <th className="p-4">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50 text-zinc-300">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-zinc-500">
                  Fetching audit logs...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-zinc-500">
                  No system logs recorded yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log._id} className="hover:bg-zinc-800/30 transition">
                  <td className="p-4 text-xs text-zinc-400 font-mono">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-600/20 text-blue-400 rounded-md flex items-center justify-center font-semibold text-xs">
                        {log.admin?.name?.[0] || 'A'}
                      </div>
                      <span className="text-xs text-white font-medium">{log.admin?.name || 'System Admin'}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 bg-zinc-800 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-mono font-semibold">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-zinc-400 font-mono">
                    {log.targetType || 'System'} {log.targetId ? `(${log.targetId.substring(0, 8)}...)` : ''}
                  </td>
                  <td className="p-4 text-xs text-zinc-400">
                    <pre className="bg-zinc-950/60 p-1.5 rounded-lg border border-zinc-800/50 text-[11px] font-mono max-w-xs truncate overflow-hidden">
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

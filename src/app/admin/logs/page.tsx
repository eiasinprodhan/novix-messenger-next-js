'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Clock, ShieldCheck, ChevronLeft, ChevronRight, User, Terminal, Download } from 'lucide-react';

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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            System Audit & Security Logs
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">
            Immutable audit trail of administrative activities, user modifications & security events
          </p>
        </div>
        <button
          onClick={exportLogsCSV}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs sm:text-sm font-semibold flex items-center gap-2 px-3.5 py-2.5 rounded-xl transition shadow-xs cursor-pointer"
          title="Export current audit logs as CSV"
        >
          <Download size={16} />
          <span>Export Logs CSV</span>
        </button>
      </div>

      <div className="bg-white dark:bg-[#111a2e] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
          <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[720px]">
            <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-5">Timestamp</th>
                <th className="py-3.5 px-5">Administrator</th>
                <th className="py-3.5 px-5">Action Event</th>
                <th className="py-3.5 px-5">Target Entity</th>
                <th className="py-3.5 px-5">Details & Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400 font-medium">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span>Fetching audit logs...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400 font-medium">
                    No system audit logs recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
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

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Page {page} of {totalPages}</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40 transition cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40 transition cursor-pointer"
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

import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { AuditLog } from '../types';
import { Navbar } from '../components/Navbar';
import { Modal } from '../components/Modal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import {
  History,
  Filter,
  Eye,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  User,
} from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await apiClient.audit.list({
        skip: (page - 1) * 15,
        limit: 15,
        action: actionFilter || undefined,
      });
      setLogs(data.items);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col pb-12">
      <Navbar
        title="Enterprise Audit Trail & Security Ledger"
        subtitle="Cryptographically tracked immutable log of system events, decisions, and access"
      />

      <div className="p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* Controls */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Security Events</option>
              <option value="LOGIN">User Logins</option>
              <option value="CREATE">Customer Created</option>
              <option value="UPDATE">Customer Updated</option>
              <option value="COMPLAINT_CREATED">Complaint Created</option>
              <option value="COMPLAINT_UPDATED">Complaint Updated</option>
              <option value="DISPUTE_DETECTED">Dispute Detected</option>
              <option value="DISPUTE_REVIEWED">Dispute Reviewed</option>
              <option value="RECOMMENDATION_REVIEWED">Recommendation Reviewed</option>
              <option value="SYSTEM_INIT">System Initialization</option>
            </select>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <LoadingSpinner message="Querying tamper-evident audit ledger..." />
          ) : logs.length === 0 ? (
            <EmptyState
              title="No Audit Logs"
              description="No audit logs matched your query."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/80 border-b border-slate-200 font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Event Action</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Entity</th>
                    <th className="py-3 px-4">Entity ID</th>
                    <th className="py-3 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 text-slate-500 font-sans">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans font-medium text-slate-800">
                        {log.user_name || 'System / Automated'}
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-600">{log.entity_type}</td>
                      <td className="py-3 px-4 text-blue-600">{log.entity_id || '—'}</td>
                      <td className="py-3 px-4 text-right font-sans">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="View JSON Payload"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {logs.length} of {total} audit records
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-slate-700">
                Page {page} of {pages}
              </span>
              <button
                disabled={page >= pages}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* JSON Payload Detail Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={`Audit Event #${selectedLog?.id} Payload`}
        maxWidth="md"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400 font-semibold">Action:</span>{' '}
                <span className="font-bold text-slate-800">{selectedLog.action}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold">Actor:</span>{' '}
                <span className="font-bold text-slate-800">{selectedLog.user_name}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold">Entity:</span>{' '}
                <span className="font-mono text-slate-800">{selectedLog.entity_type}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold">ID:</span>{' '}
                <span className="font-mono text-blue-600">{selectedLog.entity_id}</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Raw Telemetry Details:</p>
              <pre className="p-3 bg-slate-900 text-teal-400 rounded-xl text-xs font-mono overflow-x-auto max-h-64">
                {JSON.stringify(selectedLog.details, null, 2) || '{}'}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

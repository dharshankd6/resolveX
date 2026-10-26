import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Dispute } from '../types';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  FileSearch,
  UserCheck,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export const Disputes: React.FC = () => {
  const { isAgent } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Review Modal State
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [reviewStatus, setReviewStatus] = useState('Approved');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');

  useEffect(() => {
    fetchDisputes();
  }, [page, statusFilter, priorityFilter]);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const data = await apiClient.disputes.list({
        skip: (page - 1) * 10,
        limit: 10,
        status: statusFilter || undefined,
        risk_priority: priorityFilter || undefined,
      });
      setDisputes(data.items);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err) {
      console.error('Failed to load disputes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReview = (d: Dispute) => {
    setSelectedDispute(d);
    setReviewStatus(d.status === 'Under Review' ? 'Approved' : d.status);
    setReviewNotes(d.review_notes || '');
    setReviewSuccess('');
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute) return;
    setReviewing(true);
    try {
      await apiClient.disputes.review(selectedDispute.id, reviewStatus, reviewNotes);
      setReviewSuccess('Dispute review decision successfully recorded.');
      setTimeout(() => {
        setSelectedDispute(null);
        fetchDisputes();
      }, 1000);
    } catch (err: any) {
      alert('Review submission failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setReviewing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col pb-12">
      <Navbar
        title="Autonomous Dispute Detection & Investigation"
        subtitle="Explainable rule-based detection engine with mandatory human-in-the-loop review"
      />

      <div className="p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* Governance Banner */}
        <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-950 leading-relaxed">
            <strong className="font-bold">Human-in-the-Loop Governance Notice:</strong> In accordance with financial compliance standards, ResolveX detection rules flag potential disputes and propose investigation paths. Automatic funds transfer, legal determinations, or balance credits require authorized staff sign-off.
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="Under Review">Under Review</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Resolved">Resolved</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Risk Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        {/* Dispute Cards / Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <LoadingSpinner message="Scanning dispute telemetry..." />
          ) : disputes.length === 0 ? (
            <EmptyState
              title="No Disputes Found"
              description="No active disputes match your filter criteria."
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {disputes.map((d) => (
                <div key={d.id} className="p-6 hover:bg-slate-50/60 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded">
                          {d.dispute_id}
                        </span>
                        <StatusBadge type="priority" value={d.risk_priority} />
                        <StatusBadge type="status" value={d.status} />
                        {d.human_review_required && (
                          <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Human Review Required
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                        <span>
                          Customer:{' '}
                          <Link to={`/customers/${d.customer_id}`} className="font-bold text-blue-600 hover:underline">
                            {d.customer_name}
                          </Link>
                        </span>
                        {d.transaction_ref && (
                          <span>
                            • Txn Ref: <strong className="font-mono text-slate-700">{d.transaction_ref}</strong>
                          </span>
                        )}
                        <span>• Flagged: {new Date(d.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {isAgent && (
                      <button
                        onClick={() => handleOpenReview(d)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all self-start md:self-center shrink-0"
                      >
                        Review & Decision
                      </button>
                    )}
                  </div>

                  {/* Explainable Detection Reasons */}
                  <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                    <p className="text-xs font-bold text-slate-700 mb-2">Detection Engine Rationale:</p>
                    <div className="space-y-1">
                      {Array.isArray(d.detection_reasons) ? (
                        d.detection_reasons.map((reason, i) => (
                          <p key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                            <span className="text-blue-500 font-bold">•</span>
                            <span>{reason}</span>
                          </p>
                        ))
                      ) : (
                        <p className="text-xs text-slate-600">{d.detection_reasons}</p>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-200/80 text-xs">
                      <span className="font-bold text-slate-700">Recommended Next Step: </span>
                      <span className="text-slate-600">{d.suggested_action}</span>
                    </div>

                    {d.reviewer_name && (
                      <div className="mt-2 text-[11px] text-slate-500 bg-white p-2 rounded border border-slate-200">
                        <strong>Reviewed by {d.reviewer_name}:</strong> "{d.review_notes}" (
                        {d.reviewed_at ? new Date(d.reviewed_at).toLocaleString() : ''})
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {disputes.length} of {total} flagged dispute records
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

      {/* Review & Decision Modal */}
      <Modal
        isOpen={!!selectedDispute}
        onClose={() => setSelectedDispute(null)}
        title={`Review Dispute ${selectedDispute?.dispute_id}`}
        maxWidth="lg"
      >
        {selectedDispute && (
          <form onSubmit={handleSaveReview} className="space-y-4">
            {reviewSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{reviewSuccess}</span>
              </div>
            )}

            <div>
              <p className="text-xs text-slate-500">Customer</p>
              <p className="text-sm font-bold text-slate-900">{selectedDispute.customer_name}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-700 border border-slate-200/80">
              <p className="font-bold text-slate-800 mb-1">Recommended Investigation:</p>
              <p>{selectedDispute.suggested_action}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Investigation Decision Status
              </label>
              <select
                value={reviewStatus}
                onChange={(e) => setReviewStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Approved">Approved (Legitimate dispute, adjust ledger)</option>
                <option value="Rejected">Rejected (Claim unsubstantiated, maintain charge)</option>
                <option value="Resolved">Resolved (Customer reconciled and completed)</option>
                <option value="Under Review">Keep Under Review (Pending additional bank telemetry)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Mandatory Reviewer Notes / Justification
              </label>
              <textarea
                required
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="State verified facts, authorization check results, and justification..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedDispute(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={reviewing}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                {reviewing ? 'Recording...' : 'Submit Human Review'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

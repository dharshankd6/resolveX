import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Recommendation } from '../types';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import {
  Sparkles,
  CheckCircle,
  XCircle,
  Edit3,
  Filter,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export const Recommendations: React.FC = () => {
  const { isAgent } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Review Modal State
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const [reviewAction, setReviewAction] = useState('Approved');
  const [modifiedActionText, setModifiedActionText] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');

  useEffect(() => {
    fetchRecommendations();
  }, [page, statusFilter]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const data = await apiClient.recommendations.list({
        skip: (page - 1) * 10,
        limit: 10,
        approval_status: statusFilter || undefined,
      });
      setRecommendations(data.items);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err) {
      console.error('Failed to load recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReview = (rec: Recommendation, defaultStatus: string = 'Approved') => {
    setSelectedRec(rec);
    setReviewAction(defaultStatus);
    setModifiedActionText(rec.recommended_action);
    setReviewNotes('');
    setReviewSuccess('');
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRec) return;
    setSubmittingReview(true);
    try {
      await apiClient.recommendations.review(
        selectedRec.id,
        reviewAction,
        reviewNotes,
        reviewAction === 'Modified' ? modifiedActionText : undefined
      );
      setReviewSuccess(`Recommendation successfully updated to ${reviewAction}.`);
      setTimeout(() => {
        setSelectedRec(null);
        fetchRecommendations();
      }, 1000);
    } catch (err: any) {
      alert('Review failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col pb-12">
      <Navbar
        title="Autonomous Resolution Recommendations"
        subtitle="Rule-based resolution synthesis with human authorization & modification workflow"
      />

      <div className="p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* Controls Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Approvals</option>
              <option value="Pending">Pending Review</option>
              <option value="Approved">Approved</option>
              <option value="Modified">Modified & Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Recommendations List */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <LoadingSpinner message="Loading resolution recommendation matrix..." />
          ) : recommendations.length === 0 ? (
            <EmptyState
              title="No Recommendations Found"
              description="No resolution recommendations match your current filter."
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {recommendations.map((r) => (
                <div key={r.id} className="p-6 hover:bg-slate-50/60 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded">
                          {r.recommendation_id}
                        </span>
                        <StatusBadge type="priority" value={r.recommended_priority} />
                        <StatusBadge type="status" value={r.approval_status} />
                        <span className="text-xs text-slate-400">
                          Customer:{' '}
                          <Link to={`/customers/${r.customer_id}`} className="text-blue-600 font-semibold hover:underline">
                            {r.customer_name}
                          </Link>
                        </span>
                      </div>

                      <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                        <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                          Recommended Resolution:
                        </p>
                        <p className="text-xs text-slate-800 font-medium mt-1">{r.recommended_action}</p>
                      </div>

                      <div className="text-xs text-slate-600 space-y-1">
                        <p>
                          <strong className="text-slate-700">Reason:</strong> {r.reason}
                        </p>
                        <p>
                          <strong className="text-slate-700">Supporting Evidence:</strong> {r.supporting_evidence}
                        </p>
                      </div>

                      {r.reviewer_name && (
                        <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                          <strong>Reviewed by {r.reviewer_name}:</strong> {r.reviewer_notes || 'No review notes'} (
                          {r.review_timestamp ? new Date(r.review_timestamp).toLocaleString() : ''})
                        </div>
                      )}
                    </div>

                    {isAgent && r.approval_status === 'Pending' && (
                      <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
                        <button
                          onClick={() => handleOpenReview(r, 'Approved')}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleOpenReview(r, 'Modified')}
                          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Modify
                        </button>
                        <button
                          onClick={() => handleOpenReview(r, 'Rejected')}
                          className="px-3.5 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
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
              Showing {recommendations.length} of {total} resolution recommendations
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

      {/* Review Modal */}
      <Modal
        isOpen={!!selectedRec}
        onClose={() => setSelectedRec(null)}
        title={`Review Recommendation ${selectedRec?.recommendation_id}`}
        maxWidth="lg"
      >
        {selectedRec && (
          <form onSubmit={handleSaveReview} className="space-y-4">
            {reviewSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{reviewSuccess}</span>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Customer</p>
              <p className="text-sm font-bold text-slate-900">{selectedRec.customer_name}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Approval Decision
              </label>
              <select
                value={reviewAction}
                onChange={(e) => setReviewAction(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Approved">Approve Proposed Action</option>
                <option value="Modified">Modify Recommended Action</option>
                <option value="Rejected">Reject Recommendation</option>
              </select>
            </div>

            {reviewAction === 'Modified' && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Customized Resolution Action
                </label>
                <textarea
                  required
                  rows={3}
                  value={modifiedActionText}
                  onChange={(e) => setModifiedActionText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Reviewer Notes / Evidence Rationale
              </label>
              <textarea
                required
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="State verified authorization or adjustment reason..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedRec(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingReview}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                {submittingReview ? 'Submitting...' : 'Confirm Review'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

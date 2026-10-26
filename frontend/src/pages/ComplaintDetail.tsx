import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Navbar } from '../components/Navbar';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  ArrowLeft,
  User,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  History,
  FileText,
  Send,
} from 'lucide-react';

export const ComplaintDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Status update form
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState('');

  useEffect(() => {
    if (id) fetchDetail(parseInt(id));
  }, [id]);

  const fetchDetail = async (cid: number) => {
    try {
      setLoading(true);
      const res = await apiClient.complaints.get(cid);
      setData(res);
      setNewStatus(res.complaint.status);
    } catch (err) {
      console.error('Failed to load complaint details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setUpdating(true);
    setUpdateMsg('');
    try {
      await apiClient.complaints.updateStatus(parseInt(id), newStatus, statusNotes);
      setUpdateMsg(`Complaint status successfully updated to ${newStatus}`);
      setStatusNotes('');
      fetchDetail(parseInt(id));
    } catch (err: any) {
      alert('Failed to update status: ' + (err.response?.data?.detail || err.message));
    } finally {
      setUpdating(false);
    }
  };

  const handleApproveRecommendation = async (recId: number) => {
    try {
      await apiClient.recommendations.review(recId, 'Approved', 'Approved from complaint detail panel');
      if (id) fetchDetail(parseInt(id));
    } catch (err: any) {
      alert('Failed to approve recommendation: ' + (err.response?.data?.detail || err.message));
    }
  };

  if (loading || !data) {
    return (
      <div className="flex-1 flex flex-col">
        <Navbar title="Complaint Ticket Details" subtitle="Loading ticket data..." />
        <LoadingSpinner message="Retrieving complaint audit logs..." />
      </div>
    );
  }

  const { complaint, history, recommendations } = data;

  return (
    <div className="flex-1 flex flex-col pb-12">
      <Navbar
        title={`Complaint ${complaint.complaint_id}`}
        subtitle={`${complaint.category} Issue • Customer: ${complaint.customer_name}`}
      />

      <div className="p-8 max-w-7xl w-full mx-auto space-y-6">
        <Link
          to="/complaints"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Complaints
        </Link>

        {updateMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{updateMsg}</span>
          </div>
        )}

        {/* Top Grid: Ticket Overview & Status Workflow Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded">
                  {complaint.complaint_id}
                </span>
                <span className="text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-full">
                  {complaint.category}
                </span>
                <StatusBadge type="priority" value={complaint.priority} />
              </div>
              <StatusBadge type="status" value={complaint.status} />
            </div>

            <h2 className="text-lg font-bold text-slate-900 mt-4">{complaint.subject}</h2>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 mt-3 text-xs text-slate-700 leading-relaxed font-mono whitespace-pre-wrap">
              {complaint.description}
            </div>

            {complaint.resolution_notes && (
              <div className="mt-4 p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl">
                <p className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Resolution Notes
                </p>
                <p className="text-xs text-emerald-900">{complaint.resolution_notes}</p>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100 text-xs">
              <div>
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Customer</p>
                <Link
                  to={`/customers/${complaint.customer_id}`}
                  className="font-bold text-blue-600 hover:underline mt-0.5 block"
                >
                  {complaint.customer_name}
                </Link>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Assigned Agent</p>
                <p className="font-bold text-slate-800 mt-0.5">{complaint.assigned_agent_name}</p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Created</p>
                <p className="text-slate-600 mt-0.5">{new Date(complaint.created_at).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Status Update Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">Update Ticket Status</h3>
              <p className="text-xs text-slate-500 mb-4">
                Transition ticket state and record audit trail history.
              </p>

              <form onSubmit={handleStatusUpdate} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                    Target Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Pending">Pending Customer Response</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                    Resolution / Progress Notes
                  </label>
                  <textarea
                    rows={3}
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    placeholder="Enter actions taken or customer communication summary..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={updating}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  {updating ? 'Saving Status...' : 'Apply Status Transition'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Linked LexIntel Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Autonomous Resolution Recommendations for this Ticket
              </h3>
            </div>
            <div className="space-y-3">
              {recommendations.map((r: any) => (
                <div
                  key={r.id}
                  className="p-4 rounded-xl border border-teal-100 bg-teal-50/30 flex items-start justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-900 font-mono">{r.recommendation_id}</span>
                      <StatusBadge type="priority" value={r.recommended_priority} />
                      <StatusBadge type="status" value={r.approval_status} />
                    </div>
                    <p className="text-xs font-semibold text-slate-800 mt-1">{r.recommended_action}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      <strong className="text-slate-600">Rationale:</strong> {r.reason}
                    </p>
                  </div>
                  {r.approval_status === 'Pending' && (
                    <button
                      onClick={() => handleApproveRecommendation(r.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shrink-0 transition-colors shadow-sm"
                    >
                      Approve Action
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Complaint Status History Timeline */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <History className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Ticket Lifecycle & Status History</h3>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {history.map((h: any, idx: number) => (
              <div key={h.id || idx} className="relative">
                <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow-sm" />
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-bold text-slate-900">{h.new_status}</span>
                  {h.old_status && (
                    <span className="text-[11px] text-slate-400 font-medium">(was {h.old_status})</span>
                  )}
                  <span className="text-[10px] text-slate-400">• {new Date(h.timestamp).toLocaleString()}</span>
                </div>
                {h.notes && (
                  <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono">
                    {h.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

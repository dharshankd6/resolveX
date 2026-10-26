import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { CustomerDetail as CustomerDetailType } from '../types';
import { Navbar } from '../components/Navbar';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Modal } from '../components/Modal';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  DollarSign,
  TrendingDown,
  ShieldAlert,
  AlertCircle,
  MessageSquare,
  Plus,
  CheckCircle,
} from 'lucide-react';

export const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<CustomerDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'complaints' | 'transactions' | 'interactions'>('complaints');

  // Dispute scan alert
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');

  // Add Interaction Modal
  const [isInteractionOpen, setIsInteractionOpen] = useState(false);
  const [interactionText, setInteractionText] = useState('');
  const [interactionChannel, setInteractionChannel] = useState('Email');
  const [submittingInteraction, setSubmittingInteraction] = useState(false);

  useEffect(() => {
    if (id) fetchCustomerDetail(parseInt(id));
  }, [id]);

  const fetchCustomerDetail = async (customerId: number) => {
    try {
      setLoading(true);
      const res = await apiClient.customers.get(customerId);
      setData(res);
    } catch (err) {
      console.error('Failed to load customer profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunDisputeScan = async () => {
    if (!data) return;
    setScanning(true);
    setScanMessage('');
    try {
      const res = await apiClient.disputes.scan(data.customer.id);
      setScanMessage(res.message);
      fetchCustomerDetail(data.customer.id);
    } catch (err: any) {
      alert('Dispute scan failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setScanning(false);
    }
  };

  const handleAddInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    setSubmittingInteraction(true);
    try {
      await apiClient.interactions.create({
        customer_id: data.customer.id,
        channel: interactionChannel,
        raw_text: interactionText,
      });
      setIsInteractionOpen(false);
      setInteractionText('');
      fetchCustomerDetail(data.customer.id);
    } catch (err: any) {
      alert('Failed to log interaction: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSubmittingInteraction(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex-1 flex flex-col">
        <Navbar title="Customer Profile 360" subtitle="Loading customer telemetry..." />
        <LoadingSpinner message="Aggregating full customer history..." />
      </div>
    );
  }

  const { customer, complaints, transactions, interactions } = data;

  return (
    <div className="flex-1 flex flex-col pb-12">
      <Navbar
        title={`${customer.full_name} (${customer.customer_id})`}
        subtitle="Customer 360 Profile • Contract & Telemetry Intelligence"
      />

      <div className="p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link
            to="/customers"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Customers
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsInteractionOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-sm transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
              Log Interaction
            </button>
            <button
              onClick={handleRunDisputeScan}
              disabled={scanning}
              className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              {scanning ? 'Running Detection...' : 'Run Dispute Scan'}
            </button>
          </div>
        </div>

        {scanMessage && (
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl flex items-center gap-2 text-teal-800 text-xs font-medium">
            <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
            <span>{scanMessage}</span>
          </div>
        )}

        {/* Profile Card & Churn Assessment */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Core Profile */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {customer.customer_id}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-2">{customer.full_name}</h2>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> {customer.email}
                  </span>
                  {customer.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> {customer.phone}
                    </span>
                  )}
                </div>
              </div>
              <StatusBadge type="status" value={customer.account_status} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase">Tenure</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{customer.tenure_months} Months</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase">Contract</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{customer.contract_type}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase">Monthly Bill</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">${customer.monthly_spending.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase">Payment Method</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{customer.payment_method}</p>
              </div>
            </div>
          </div>

          {/* LexIntel Churn Predictor Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">LexIntel Churn Score</p>
                <StatusBadge type="churn" value={customer.latest_churn_risk || 'Low'} />
              </div>

              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {((customer.latest_churn_probability || 0.15) * 100).toFixed(0)}%
                </span>
                <span className="text-xs text-slate-500 font-medium">estimated churn propensity</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    (customer.latest_churn_risk || 'Low') === 'High'
                      ? 'bg-rose-500'
                      : (customer.latest_churn_risk || 'Low') === 'Medium'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${((customer.latest_churn_probability || 0.15) * 100)}%` }}
                />
              </div>

              {customer.contributing_factors && customer.contributing_factors.length > 0 && (
                <div className="mt-4 space-y-1.5">
                  <p className="text-[11px] font-semibold text-slate-600">Model Contributing Factors:</p>
                  {customer.contributing_factors.map((f, i) => (
                    <div key={i} className="text-xs text-slate-500 flex items-start gap-1.5">
                      <span className="text-blue-500 font-bold">•</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Evaluated by LexIntel AI</span>
              <span className="font-mono">v1.0-RF</span>
            </div>
          </div>
        </div>

        {/* Tabbed History Section */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex border-b border-slate-200 bg-slate-50/50 px-6">
            <button
              onClick={() => setActiveTab('complaints')}
              className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'complaints'
                  ? 'border-blue-600 text-blue-600 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              Complaints ({complaints.length})
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'transactions'
                  ? 'border-blue-600 text-blue-600 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Transactions ({transactions.length})
            </button>
            <button
              onClick={() => setActiveTab('interactions')}
              className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'interactions'
                  ? 'border-blue-600 text-blue-600 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Interactions & Sentiment ({interactions.length})
            </button>
          </div>

          <div className="p-6">
            {/* Tab 1: Complaints */}
            {activeTab === 'complaints' && (
              <div>
                {complaints.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">No complaints filed for this customer.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {complaints.map((c) => (
                      <div key={c.id} className="py-4 flex items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{c.complaint_id}</span>
                            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              {c.category}
                            </span>
                            <StatusBadge type="priority" value={c.priority} />
                            <StatusBadge type="status" value={c.status} />
                          </div>
                          <p className="text-xs font-semibold text-slate-800 mt-1">{c.subject}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Created: {new Date(c.created_at).toLocaleString()}
                          </p>
                        </div>
                        <Link
                          to={`/complaints/${c.id}`}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                        >
                          View Details
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Transactions */}
            {activeTab === 'transactions' && (
              <div>
                {transactions.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">No transaction records on file.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 border-b border-slate-100 font-semibold text-slate-500 uppercase">
                        <tr>
                          <th className="py-2.5 px-3">Transaction ID</th>
                          <th className="py-2.5 px-3">Reference</th>
                          <th className="py-2.5 px-3">Amount</th>
                          <th className="py-2.5 px-3">Expected</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {transactions.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{t.transaction_id}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-500">{t.transaction_ref}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-900">
                              ${t.amount.toFixed(2)} {t.currency}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500">
                              {t.expected_amount !== null ? `$${t.expected_amount?.toFixed(2)}` : '—'}
                            </td>
                            <td className="py-2.5 px-3">
                              <StatusBadge type="status" value={t.status} />
                            </td>
                            <td className="py-2.5 px-3 text-slate-400">
                              {new Date(t.transaction_date).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Interactions */}
            {activeTab === 'interactions' && (
              <div>
                {interactions.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">No recorded customer feedback or interactions.</p>
                ) : (
                  <div className="space-y-4">
                    {interactions.map((i) => (
                      <div key={i.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                              {i.channel}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {new Date(i.created_at).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge type="sentiment" value={i.sentiment} />
                            <span className="text-xs font-mono text-slate-400">
                              {(i.sentiment_score * 100).toFixed(0)}% conf
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">"{i.raw_text}"</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Log Interaction Modal */}
      <Modal
        isOpen={isInteractionOpen}
        onClose={() => setIsInteractionOpen(false)}
        title="Log Customer Interaction"
        maxWidth="md"
      >
        <form onSubmit={handleAddInteraction} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Channel</label>
            <select
              value={interactionChannel}
              onChange={(e) => setInteractionChannel(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Email">Email</option>
              <option value="Chat">Chat</option>
              <option value="Phone">Phone Support</option>
              <option value="Web Form">Web Portal Form</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Customer Message / Feedback Transcript
            </label>
            <textarea
              required
              rows={4}
              value={interactionText}
              onChange={(e) => setInteractionText(e.target.value)}
              placeholder="Enter customer message to run real-time LexIntel sentiment analysis..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsInteractionOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingInteraction}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              {submittingInteraction ? 'Analyzing...' : 'Log & Analyze Sentiment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

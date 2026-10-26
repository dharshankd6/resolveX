import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Complaint, Customer, User } from '../types';
import { Navbar } from '../components/Navbar';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import {
  AlertCircle,
  Search,
  Plus,
  Filter,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Clock,
} from 'lucide-react';

export const Complaints: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [agents, setAgents] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    customer_id: 0,
    category: 'Billing',
    subject: '',
    description: '',
    priority: 'Medium',
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [page, search, statusFilter, priorityFilter, categoryFilter]);

  const fetchInitialData = async () => {
    try {
      const [custList, usersList] = await Promise.all([
        apiClient.customers.list({ limit: 100 }),
        apiClient.users.list().catch(() => []), // May be restricted if not admin
      ]);
      setCustomers(custList.items);
      setAgents(usersList.filter((u: any) => u.role === 'Support Agent' || u.role === 'Admin'));
      if (custList.items.length > 0 && formData.customer_id === 0) {
        setFormData((prev) => ({ ...prev, customer_id: custList.items[0].id }));
      }
    } catch (err) {
      console.error('Failed to load initial form data:', err);
    }
  };

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const data = await apiClient.complaints.list({
        skip: (page - 1) * 10,
        limit: 10,
        search: search || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        category: categoryFilter || undefined,
      });
      setComplaints(data.items);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err) {
      console.error('Failed to load complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setSubmitting(true);
    try {
      await apiClient.complaints.create(formData);
      setIsModalOpen(false);
      setFormData({
        customer_id: customers[0]?.id || 0,
        category: 'Billing',
        subject: '',
        description: '',
        priority: 'Medium',
      });
      fetchComplaints();
    } catch (err: any) {
      setModalError(err.response?.data?.detail || 'Failed to create complaint');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col pb-12">
      <Navbar
        title="Enterprise Complaint Management"
        subtitle="End-to-end grievance resolution, SLA tracking, and audit history"
      />

      <div className="p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* Filter & Action Controls */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search subject, description, or CMP ID..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending">Pending</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              <option value="Billing">Billing</option>
              <option value="Refund">Refund</option>
              <option value="Technical">Technical</option>
              <option value="Service">Service</option>
              <option value="Transaction">Transaction</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            File Complaint
          </button>
        </div>

        {/* Complaints Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <LoadingSpinner message="Loading complaint records..." />
          ) : complaints.length === 0 ? (
            <EmptyState
              title="No Complaints Found"
              description="No complaints match your criteria. File a new ticket or adjust filters."
              actionText="File New Complaint"
              onAction={() => setIsModalOpen(true)}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Ticket</th>
                    <th className="py-3.5 px-4">Subject</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Priority</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Assigned Agent</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {complaints.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        <Link to={`/complaints/${c.id}`} className="hover:text-blue-600">
                          {c.complaint_id}
                        </Link>
                        <span className="text-[10px] block font-sans font-medium text-slate-400">
                          {c.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <Link
                          to={`/complaints/${c.id}`}
                          className="font-semibold text-slate-800 hover:text-blue-600 transition-colors block line-clamp-1"
                        >
                          {c.subject}
                        </Link>
                        <span className="text-xs text-slate-400 line-clamp-1 mt-0.5">{c.description}</span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        <Link to={`/customers/${c.customer_id}`} className="hover:underline">
                          {c.customer_name}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge type="priority" value={c.priority} />
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge type="status" value={c.status} />
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                        {c.assigned_agent_name || 'Unassigned'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/complaints/${c.id}`}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                        >
                          Manage
                        </Link>
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
              Showing {complaints.length} of {total} complaint tickets
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

      {/* File Complaint Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="File New Customer Complaint Ticket"
        maxWidth="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Customer</label>
            <select
              value={formData.customer_id}
              onChange={(e) => setFormData({ ...formData, customer_id: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} ({c.customer_id})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Billing">Billing</option>
                <option value="Refund">Refund</option>
                <option value="Technical">Technical</option>
                <option value="Service">Service</option>
                <option value="Transaction">Transaction</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Subject</label>
            <input
              type="text"
              required
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="e.g. Duplicate monthly subscription charge"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Detailed Description</label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide exact error messages, transaction references, or context..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              {submitting ? 'Filing Ticket...' : 'Submit Complaint'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

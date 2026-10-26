import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Customer } from '../types';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import {
  Users,
  Search,
  Plus,
  Filter,
  Trash2,
  Edit2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  AlertCircle,
} from 'lucide-react';

export const Customers: React.FC = () => {
  const { isAdmin } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [contractFilter, setContractFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [modalError, setModalError] = useState('');
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    customer_id: '',
    full_name: '',
    email: '',
    phone: '',
    tenure_months: 1,
    contract_type: 'Month-to-month',
    payment_method: 'Electronic check',
    monthly_spending: 75.0,
    account_status: 'Active',
  });

  useEffect(() => {
    fetchCustomers();
  }, [page, search, statusFilter, contractFilter]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await apiClient.customers.list({
        skip: (page - 1) * 10,
        limit: 10,
        search: search || undefined,
        status: statusFilter || undefined,
        contract_type: contractFilter || undefined,
      });
      setCustomers(data.items);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({
      customer_id: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
      full_name: '',
      email: '',
      phone: '',
      tenure_months: 1,
      contract_type: 'Month-to-month',
      payment_method: 'Electronic check',
      monthly_spending: 75.0,
      account_status: 'Active',
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      customer_id: c.customer_id,
      full_name: c.full_name,
      email: c.email,
      phone: c.phone || '',
      tenure_months: c.tenure_months,
      contract_type: c.contract_type,
      payment_method: c.payment_method,
      monthly_spending: c.monthly_spending,
      account_status: c.account_status,
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setSaving(true);
    try {
      if (editingCustomer) {
        await apiClient.customers.update(editingCustomer.id, formData);
      } else {
        await apiClient.customers.create(formData);
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err: any) {
      setModalError(err.response?.data?.detail || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this customer? This cannot be undone.')) return;
    try {
      await apiClient.customers.delete(id);
      fetchCustomers();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete customer');
    }
  };

  return (
    <div className="flex-1 flex flex-col pb-12">
      <Navbar
        title="Customer Directory & Intelligence"
        subtitle="Customer profiles, contract lifecycles, and predictive churn indicators"
      />

      <div className="p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* Controls Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by customer name, email, or ID..."
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
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
            </select>

            <select
              value={contractFilter}
              onChange={(e) => {
                setContractFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Contracts</option>
              <option value="Month-to-month">Month-to-month</option>
              <option value="One year">One year</option>
              <option value="Two year">Two year</option>
            </select>
          </div>

          <button
            onClick={handleOpenAdd}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </button>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <LoadingSpinner message="Loading customer directory..." />
          ) : customers.length === 0 ? (
            <EmptyState
              title="No Customers Found"
              description="No customer records match your filter criteria. Try resetting filters or adding a new customer."
              actionText="Add New Customer"
              onAction={handleOpenAdd}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Tenure & Contract</th>
                    <th className="py-3.5 px-4">Monthly Bill</th>
                    <th className="py-3.5 px-4">Account Status</th>
                    <th className="py-3.5 px-4">LexIntel Churn Risk</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <Link
                          to={`/customers/${c.id}`}
                          className="font-bold text-slate-900 hover:text-blue-600 transition-colors block"
                        >
                          {c.full_name}
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <span>{c.customer_id}</span>
                          <span>•</span>
                          <span>{c.email}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-800">{c.tenure_months} mos</span>
                        <span className="text-xs text-slate-400 block">{c.contract_type}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900">${c.monthly_spending.toFixed(2)}</span>
                        <span className="text-xs text-slate-400 block">{c.payment_method}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge type="status" value={c.account_status} />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <StatusBadge type="churn" value={c.latest_churn_risk || 'Low'} />
                          {c.latest_churn_probability !== undefined && (
                            <span className="text-xs text-slate-400 font-mono">
                              {(c.latest_churn_probability * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/customers/${c.id}`}
                            title="View Customer 360"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleOpenEdit(c)}
                            title="Edit Customer"
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(c.id)}
                              title="Delete Customer"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {customers.length} of {total} customer records
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

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? 'Edit Customer Record' : 'Add New Enterprise Customer'}
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Customer ID</label>
              <input
                type="text"
                required
                disabled={!!editingCustomer}
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 text-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Tenure (Mos)</label>
              <input
                type="number"
                min={1}
                value={formData.tenure_months}
                onChange={(e) => setFormData({ ...formData, tenure_months: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Monthly Spending ($)</label>
              <input
                type="number"
                step="0.01"
                min={0}
                value={formData.monthly_spending}
                onChange={(e) => setFormData({ ...formData, monthly_spending: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Account Status</label>
              <select
                value={formData.account_status}
                onChange={(e) => setFormData({ ...formData, account_status: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Contract Type</label>
              <select
                value={formData.contract_type}
                onChange={(e) => setFormData({ ...formData, contract_type: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Month-to-month">Month-to-month</option>
                <option value="One year">One year</option>
                <option value="Two year">Two year</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Payment Method</label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Electronic check">Electronic check</option>
                <option value="Mailed check">Mailed check</option>
                <option value="Bank transfer">Bank transfer</option>
                <option value="Credit card">Credit card</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingCustomer ? 'Update Customer' : 'Create Customer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

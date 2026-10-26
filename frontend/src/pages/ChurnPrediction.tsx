import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Customer, ChurnPredictionResult } from '../types';
import { Navbar } from '../components/Navbar';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  TrendingDown,
  Sparkles,
  Calculator,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Info,
} from 'lucide-react';

export const ChurnPrediction: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Simulator Form State
  const [tenure, setTenure] = useState(4);
  const [monthlySpend, setMonthlySpend] = useState(120.0);
  const [complaintCount, setComplaintCount] = useState(2);
  const [contractType, setContractType] = useState('Month-to-month');
  const [paymentMethod, setPaymentMethod] = useState('Electronic check');

  const [simResult, setSimResult] = useState<ChurnPredictionResult | null>(null);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    fetchCustomers();
    handleSimulate();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await apiClient.customers.list({ limit: 100 });
      // Sort customers by churn probability descending
      const sorted = [...data.items].sort(
        (a, b) => (b.latest_churn_probability || 0) - (a.latest_churn_probability || 0)
      );
      setCustomers(sorted);
    } catch (err) {
      console.error('Failed to load customers for churn module:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSimulating(true);
    try {
      const res = await apiClient.ml.predictChurn({
        tenure_months: tenure,
        monthly_spending: monthlySpend,
        complaint_count: complaintCount,
        contract_type: contractType,
        payment_method: paymentMethod,
      });
      setSimResult(res);
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col pb-12">
      <Navbar
        title="Predictive Churn Risk Analytics"
        subtitle="LexIntel Random Forest predictive risk modeling & contributing factor analysis"
      />

      <div className="p-8 max-w-7xl w-full mx-auto space-y-8">
        {/* Interactive ML Simulator */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900">
                Interactive Churn Propensity Simulator
              </h3>
            </div>
            <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded">
              Model: Random Forest • Low &lt;40% | Med 40-70% | High ≥70%
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
            {/* Input Controls */}
            <form onSubmit={handleSimulate} className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Tenure: {tenure} Months
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={72}
                    value={tenure}
                    onChange={(e) => setTenure(parseInt(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Monthly Bill: ${monthlySpend.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min={20}
                    max={250}
                    step={5}
                    value={monthlySpend}
                    onChange={(e) => setMonthlySpend(parseFloat(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Customer Complaints: {complaintCount}
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    value={complaintCount}
                    onChange={(e) => setComplaintCount(parseInt(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Contract Agreement
                  </label>
                  <select
                    value={contractType}
                    onChange={(e) => setContractType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Month-to-month">Month-to-month</option>
                    <option value="One year">One year</option>
                    <option value="Two year">Two year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Electronic check">Electronic check</option>
                    <option value="Mailed check">Mailed check</option>
                    <option value="Bank transfer">Bank transfer</option>
                    <option value="Credit card">Credit card</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={simulating}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {simulating ? 'Calculating...' : 'Run Simulation'}
                </button>
              </div>
            </form>

            {/* Simulation Result Card */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
              {simResult ? (
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase">Predicted Tier</span>
                    <StatusBadge type="churn" value={simResult.churn_risk_tier} />
                  </div>

                  <div className="mt-3">
                    <span className="text-4xl font-black text-slate-900 tracking-tight">
                      {(simResult.churn_probability * 100).toFixed(0)}%
                    </span>
                    <span className="text-xs text-slate-500 block mt-0.5">estimated probability of churn</span>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-2.5 mt-4 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        simResult.churn_risk_tier === 'High'
                          ? 'bg-rose-500'
                          : simResult.churn_risk_tier === 'Medium'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${simResult.churn_probability * 100}%` }}
                    />
                  </div>

                  <div className="mt-4 space-y-1.5">
                    <p className="text-[11px] font-bold text-slate-700 uppercase">Key Indicators:</p>
                    {simResult.contributing_factors.map((f, i) => (
                      <div key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                        <span className="text-blue-500 font-bold">•</span>
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-xs text-slate-400">
                  Awaiting simulation parameters...
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center gap-1.5 text-[11px] text-slate-400">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>Predictions are statistical estimates, not financial guarantees.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Churn Risk Ranking Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Customer Risk Ranking</h3>
              <p className="text-xs text-slate-500">Live accounts ordered by predicted churn propensity</p>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner message="Ranking customers by risk index..." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Tenure & Contract</th>
                    <th className="py-3 px-4">Monthly Spending</th>
                    <th className="py-3 px-4">Risk Category</th>
                    <th className="py-3 px-4">Churn Probability</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <Link to={`/customers/${c.id}`} className="hover:text-blue-600 block">
                          {c.full_name}
                        </Link>
                        <span className="text-xs text-slate-400 font-normal">{c.customer_id}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs text-slate-800 font-medium">{c.tenure_months} months</span>
                        <span className="text-xs text-slate-400 block">{c.contract_type}</span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        ${c.monthly_spending.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge type="churn" value={c.latest_churn_risk || 'Low'} />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full ${
                                (c.latest_churn_risk || 'Low') === 'High'
                                  ? 'bg-rose-500'
                                  : (c.latest_churn_risk || 'Low') === 'Medium'
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${(c.latest_churn_probability || 0.15) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono font-bold text-slate-700">
                            {((c.latest_churn_probability || 0.15) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/customers/${c.id}`}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                        >
                          Customer 360
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

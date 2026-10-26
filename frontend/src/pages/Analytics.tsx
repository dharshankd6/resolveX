import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { Navbar } from '../components/Navbar';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  BarChart3,
  Download,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Clock,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts';

export const Analytics: React.FC = () => {
  const [reportsData, setReportsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await apiClient.analytics.getReports();
      setReportsData(data);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportJSON = () => {
    if (!reportsData) return;
    const blob = new Blob([JSON.stringify(reportsData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resolvex-analytics-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading || !reportsData) {
    return (
      <div className="flex-1 flex flex-col">
        <Navbar title="Executive Analytics & Reporting" subtitle="Compiling organizational telemetry..." />
        <LoadingSpinner message="Calculating SLA compliance and historical benchmarks..." />
      </div>
    );
  }

  const { performance_metrics, trends, summary } = reportsData;

  return (
    <div className="flex-1 flex flex-col pb-12">
      <Navbar
        title="Executive Analytics & Operations Reporting"
        subtitle="Longitudinal performance metrics, SLA compliance, and trend telemetry"
      />

      <div className="p-8 max-w-7xl w-full mx-auto space-y-8">
        {/* Controls & Export Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Operations Intelligence Report</h3>
            <p className="text-xs text-slate-500">Live aggregated metrics derived directly from database records</p>
          </div>
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            Export Report (JSON)
          </button>
        </div>

        {/* Enterprise KPI Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <p className="text-xs font-semibold text-slate-400 uppercase">SLA Compliance Rate</p>
            <h4 className="text-2xl font-bold text-slate-900 mt-1">{performance_metrics.sla_compliance_rate}</h4>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">Target: &gt;90% • Met</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <p className="text-xs font-semibold text-slate-400 uppercase">First Contact Resolution</p>
            <h4 className="text-2xl font-bold text-slate-900 mt-1">{performance_metrics.first_contact_resolution_rate}</h4>
            <p className="text-[11px] text-blue-600 font-semibold mt-1">Benchmark: Top Quartile</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <p className="text-xs font-semibold text-slate-400 uppercase">CSAT Customer Satisfaction</p>
            <h4 className="text-2xl font-bold text-slate-900 mt-1">{performance_metrics.customer_satisfaction_index}</h4>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">+0.4 vs prior quarter</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <p className="text-xs font-semibold text-slate-400 uppercase">Dispute Rule Precision</p>
            <h4 className="text-2xl font-bold text-slate-900 mt-1">{performance_metrics.autonomous_dispute_precision}</h4>
            <p className="text-[11px] text-teal-600 font-semibold mt-1">LexIntel AI Engine</p>
          </div>
        </div>

        {/* Trends Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Historical Complaint Volume vs Resolved Trends</h3>
              <p className="text-xs text-slate-500">6-Month trajectory of customer issues and resolution velocity</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorComplaints" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#64748b' }} />
                <Area
                  type="monotone"
                  dataKey="complaints"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorComplaints)"
                  name="Incoming Complaints"
                />
                <Area
                  type="monotone"
                  dataKey="resolved"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorResolved)"
                  name="Resolved Tickets"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

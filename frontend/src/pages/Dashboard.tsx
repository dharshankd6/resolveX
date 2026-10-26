import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { DashboardOverview } from '../types';
import { Navbar } from '../components/Navbar';
import { StatsCard } from '../components/StatsCard';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  Users,
  AlertCircle,
  Clock,
  ShieldAlert,
  TrendingDown,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const overview = await apiClient.analytics.getOverview();
      setData(overview);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex-1 flex flex-col">
        <Navbar title="Enterprise Command Center" subtitle="Real-time CX Telemetry & Autonomous Dispute Intelligence" />
        <LoadingSpinner message="Aggregating live customer intelligence..." />
      </div>
    );
  }

  // Format Sentiment Chart Data
  const sentimentChartData = Object.entries(data.sentiment_distribution || {}).map(([key, val]) => ({
    name: key,
    value: val,
  }));
  const SENTIMENT_COLORS = {
    Positive: '#10b981', // emerald
    Neutral: '#64748b',  // slate
    Negative: '#f43f5e', // rose
  };

  // Format Category Chart Data
  const categoryChartData = Object.entries(data.complaint_category_distribution || {}).map(([key, val]) => ({
    category: key,
    count: val,
  }));

  // Format Churn Risk Chart Data
  const churnChartData = Object.entries(data.churn_risk_distribution || {}).map(([key, val]) => ({
    name: `${key} Risk`,
    value: val,
  }));
  const CHURN_COLORS = {
    'Low Risk': '#10b981',
    'Medium Risk': '#f59e0b',
    'High Risk': '#ef4444',
  };

  return (
    <div className="flex-1 flex flex-col pb-12">
      <Navbar
        title="Enterprise Command Center"
        subtitle="LexIntel AI Real-Time Telemetry & Dispute Orchestration"
      />

      <div className="p-8 max-w-7xl w-full mx-auto space-y-8">
        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatsCard
            title="Total Customers"
            value={data.total_customers}
            subtitle="Active accounts tracked"
            icon={<Users className="w-5 h-5" />}
            color="blue"
            trend={{ value: '+12%', isPositive: true }}
          />
          <StatsCard
            title="Open Complaints"
            value={data.open_complaints}
            subtitle={`${data.resolved_complaints} resolved to date`}
            icon={<AlertCircle className="w-5 h-5" />}
            color="amber"
          />
          <StatsCard
            title="Disputes Requiring Review"
            value={data.disputes_requiring_review}
            subtitle="Flagged by LexIntel rules"
            icon={<ShieldAlert className="w-5 h-5" />}
            color="rose"
            trend={{ value: 'Audit Required', isPositive: false }}
          />
          <StatsCard
            title="High Churn Risk"
            value={data.high_churn_risk_customers}
            subtitle={`Avg SLA: ${data.avg_resolution_time_hours} hrs`}
            icon={<TrendingDown className="w-5 h-5" />}
            color="teal"
          />
        </div>

        {/* Analytics Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sentiment Distribution */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Sentiment Distribution</h3>
                <p className="text-xs text-slate-500">TF-IDF & Logistic Regression telemetry</p>
              </div>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Live
              </span>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {sentimentChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={SENTIMENT_COLORS[entry.name as keyof typeof SENTIMENT_COLORS] || '#94a3b8'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#64748b' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Complaint Categories Bar Chart */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Complaints by Category</h3>
                <p className="text-xs text-slate-500">Breakdown of active issue streams</p>
              </div>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Customer Churn Risk Tiers */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Churn Risk Profile</h3>
                <p className="text-xs text-slate-500">Random Forest predictive model</p>
              </div>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={churnChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    dataKey="value"
                    label={({ name, percent }: any) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {churnChartData.map((entry, index) => (
                      <Cell
                        key={`churn-${index}`}
                        fill={CHURN_COLORS[entry.name as keyof typeof CHURN_COLORS] || '#94a3b8'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#64748b' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Live Operational Queues */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Disputes Requiring Review */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-900">Potential Disputes Under Review</h3>
              </div>
              <Link
                to="/disputes"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {data.recent_disputes.length === 0 ? (
                <p className="p-6 text-xs text-slate-500 text-center">No open disputes flagged.</p>
              ) : (
                data.recent_disputes.map((d) => (
                  <div key={d.id} className="p-4 hover:bg-slate-50/80 transition-colors flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{d.dispute_id}</span>
                        <StatusBadge type="priority" value={d.risk_priority} />
                        <StatusBadge type="status" value={d.status} />
                      </div>
                      <p className="text-xs text-slate-600 mt-1 font-medium">{d.customer_name}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {Array.isArray(d.detection_reasons) ? d.detection_reasons[0] : d.detection_reasons}
                      </p>
                    </div>
                    <Link
                      to="/disputes"
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium shrink-0 transition-colors"
                    >
                      Investigate
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Customer Complaints */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Recent Customer Complaints</h3>
              </div>
              <Link
                to="/complaints"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {data.recent_complaints.length === 0 ? (
                <p className="p-6 text-xs text-slate-500 text-center">No complaints recorded.</p>
              ) : (
                data.recent_complaints.map((c) => (
                  <div key={c.id} className="p-4 hover:bg-slate-50/80 transition-colors flex items-start justify-between gap-4">
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
                      <p className="text-xs text-slate-500 mt-0.5">
                        Customer: {c.customer_name} • Agent: {c.assigned_agent_name}
                      </p>
                    </div>
                    <Link
                      to={`/complaints/${c.id}`}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium shrink-0 transition-colors"
                    >
                      Details
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

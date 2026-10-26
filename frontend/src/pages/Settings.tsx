import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { Navbar } from '../components/Navbar';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  Settings as SettingsIcon,
  Shield,
  Cpu,
  Database,
  CheckCircle2,
  Server,
  Lock,
  RefreshCw,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [health, setHealth] = useState<any>(null);
  const [mlStatus, setMlStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemStatus();
  }, []);

  const fetchSystemStatus = async () => {
    try {
      setLoading(true);
      const [healthData, mlData] = await Promise.all([
        apiClient.health.check(),
        apiClient.ml.getStatus(),
      ]);
      setHealth(healthData);
      setMlStatus(mlData);
    } catch (err) {
      console.error('Failed to query system status:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col pb-12">
      <Navbar
        title="System Settings & Engine Diagnostics"
        subtitle="LexIntel AI engine diagnostics, model versioning, and environment specifications"
      />

      <div className="p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* User Profile Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-teal-400 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-500/20">
              {user?.full_name ? user.full_name[0] : 'U'}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{user?.full_name}</h3>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <div className="ml-auto">
              {user?.role && <StatusBadge type="role" value={user.role} />}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Security Role</span>
              <p className="font-bold text-slate-800 mt-0.5">{user?.role}</p>
            </div>
            <div>
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Session Status</span>
              <p className="font-semibold text-emerald-600 mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Authenticated via JWT (HS256)
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Member Since</span>
              <p className="text-slate-700 mt-0.5">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* LexIntel AI Telemetry Status */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-teal-600" />
              <h3 className="text-base font-bold text-slate-900">LexIntel AI Engine Telemetry</h3>
            </div>
            <button
              onClick={fetchSystemStatus}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Diagnostics
            </button>
          </div>

          {loading ? (
            <LoadingSpinner message="Polling ML engine telemetry..." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sentiment Engine */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Sentiment Classification Model</span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Active & Serialized
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  <strong>Algorithm:</strong> {mlStatus?.models?.sentiment_classifier?.algorithm}
                </p>
                <p className="text-xs text-slate-600">
                  <strong>Version:</strong> {mlStatus?.models?.sentiment_classifier?.version}
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
                  <span>Classes:</span>
                  {mlStatus?.models?.sentiment_classifier?.classes?.map((c: string) => (
                    <span key={c} className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Churn Engine */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Churn Predictive Model</span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Active & Serialized
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  <strong>Algorithm:</strong> {mlStatus?.models?.churn_predictor?.algorithm}
                </p>
                <p className="text-xs text-slate-600">
                  <strong>Version:</strong> {mlStatus?.models?.churn_predictor?.version}
                </p>
                <p className="text-xs text-slate-500">
                  <strong>Risk Thresholds:</strong> Low &lt;40% • Med 40-70% • High ≥70%
                </p>
              </div>

              {/* Dispute Detection Rules */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Autonomous Dispute Detector</span>
                  <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Explainable Rule Matrix
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  <strong>Rules Active:</strong> Duplicate Charges, Amount Mismatch, Delayed Refund, Unauthorized Claims, Frequency Anomaly
                </p>
                <p className="text-xs text-slate-500">Human review enforced on all flagged transactions.</p>
              </div>

              {/* Recommendation Decision Matrix */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Resolution Decision Matrix</span>
                  <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    Governed Policy Engine
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  <strong>Governance:</strong> Autonomous recommendation synthesis with human approve/modify sign-off.
                </p>
                <p className="text-xs text-slate-500">Zero automatic debit/credit without agent approval.</p>
              </div>
            </div>
          )}
        </div>

        {/* Infrastructure & Database Health */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">Infrastructure & System Runtime</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Database Status</span>
              <p className="font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Operational ({health?.database || 'healthy'})
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Application Version</span>
              <p className="font-mono font-bold text-slate-900 mt-1">v{health?.version || '1.0.0'}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Backend Framework</span>
              <p className="font-bold text-slate-900 mt-1">FastAPI • Python 3.12</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { Interaction, SentimentAnalysisResult, Customer } from '../types';
import { Navbar } from '../components/Navbar';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  MessageSquareText,
  Sparkles,
  Send,
  Filter,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

export const Interactions: React.FC = () => {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sentimentFilter, setSentimentFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Live Sentiment Tester State
  const [testText, setTestText] = useState('');
  const [testResult, setTestResult] = useState<SentimentAnalysisResult | null>(null);
  const [testing, setTesting] = useState(false);

  // Quick Log State
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');
  const [channel, setChannel] = useState('Email');
  const [logText, setLogText] = useState('');
  const [savingLog, setSavingLog] = useState(false);
  const [logSuccess, setLogSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, [sentimentFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [intData, custList] = await Promise.all([
        apiClient.interactions.list({ sentiment: sentimentFilter || undefined, limit: 50 }),
        apiClient.customers.list({ limit: 100 }),
      ]);
      setInteractions(intData);
      setCustomers(custList.items);
      if (custList.items.length > 0 && selectedCustomerId === '') {
        setSelectedCustomerId(custList.items[0].id);
      }
    } catch (err) {
      console.error('Failed to load interactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestInference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testText.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await apiClient.ml.predictSentiment(testText);
      setTestResult(res);
    } catch (err) {
      console.error('Inference probe failed:', err);
    } finally {
      setTesting(false);
    }
  };

  const handleSaveInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !logText.trim()) return;
    setSavingLog(true);
    setLogSuccess('');
    try {
      await apiClient.interactions.create({
        customer_id: Number(selectedCustomerId),
        channel,
        raw_text: logText,
      });
      setLogSuccess('Interaction analyzed and persisted to customer record!');
      setLogText('');
      fetchData();
    } catch (err: any) {
      alert('Failed to log interaction: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSavingLog(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col pb-12">
      <Navbar
        title="Customer Interaction & Sentiment Intelligence"
        subtitle="LexIntel AI TF-IDF & Logistic Regression real-time sentiment scoring"
      />

      <div className="p-8 max-w-7xl w-full mx-auto space-y-8">
        {/* Top Interactive ML Tester & Fast Log Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Real-time Probe Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">LexIntel Real-Time Sentiment Probe</h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                  Pipeline: TF-IDF + Logistic Regression
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Test custom feedback, customer emails, or review statements to observe real-time classification and confidence.
              </p>

              <form onSubmit={handleTestInference} className="space-y-3">
                <textarea
                  rows={3}
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  placeholder="e.g. The resolution for my invoice dispute was handled promptly and courteously. Very satisfied!"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setTestText(
                          'The customer care team went above and beyond to fix my dispute. Truly grateful!'
                        )
                      }
                      className="text-[11px] text-blue-600 hover:underline"
                    >
                      Sample Positive
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={() =>
                        setTestText(
                          'I was charged twice for the same monthly transaction! This is completely unacceptable.'
                        )
                      }
                      className="text-[11px] text-rose-600 hover:underline"
                    >
                      Sample Negative
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={testing || !testText.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                  >
                    {testing ? 'Inference...' : 'Test Model'}
                  </button>
                </div>
              </form>
            </div>

            {testResult && (
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase">Predicted Sentiment</p>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge type="sentiment" value={testResult.sentiment} />
                    <span className="text-xs font-mono font-bold text-slate-700">
                      {(testResult.confidence * 100).toFixed(1)}% confidence
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-mono block">
                    Version: {testResult.model_version}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    {testResult.is_fallback ? 'Fallback Active' : 'Calibrated Model'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Record Interaction */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquareText className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-900">Record Live Customer Interaction</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Submit interaction transcript to classify sentiment and append to customer profile.
            </p>

            {logSuccess && (
              <div className="mb-3 p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-800 font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>{logSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveInteraction} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Customer</label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.full_name} ({c.customer_id})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Channel</label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Email">Email</option>
                    <option value="Chat">Live Chat</option>
                    <option value="Phone">Phone Support</option>
                    <option value="Web Form">Web Portal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Interaction Transcript</label>
                <textarea
                  required
                  rows={2}
                  value={logText}
                  onChange={(e) => setLogText(e.target.value)}
                  placeholder="Enter verbatim message from customer..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingLog || !logText.trim()}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {savingLog ? 'Saving...' : 'Analyze & Save'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Feed & History Container */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Interaction Telemetry Feed</h3>
              <p className="text-xs text-slate-500">Chronological stream of incoming feedback and classified sentiment</p>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sentimentFilter}
                onChange={(e) => setSentimentFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Sentiments</option>
                <option value="positive">Positive</option>
                <option value="neutral">Neutral</option>
                <option value="negative">Negative</option>
              </select>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner message="Filtering interaction feed..." />
          ) : interactions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No customer interactions match the selected sentiment filter.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {interactions.map((i) => (
                <div key={i.id} className="p-5 hover:bg-slate-50/60 transition-colors flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {i.channel}
                      </span>
                      <StatusBadge type="sentiment" value={i.sentiment} />
                      <span className="text-xs font-mono text-slate-400">
                        {(i.sentiment_score * 100).toFixed(0)}% confidence
                      </span>
                      <span className="text-[11px] text-slate-400">•</span>
                      <span className="text-[11px] text-slate-400">{new Date(i.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-800 leading-relaxed font-medium">"{i.raw_text}"</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 font-mono block">{i.model_version}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React from 'react';

interface StatusBadgeProps {
  type: 'status' | 'priority' | 'churn' | 'sentiment' | 'role';
  value: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, value }) => {
  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  const val = value.toLowerCase();

  if (type === 'sentiment') {
    if (val === 'positive') colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    else if (val === 'neutral') colorClasses = 'bg-slate-50 text-slate-700 border-slate-200';
    else if (val === 'negative') colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (type === 'churn') {
    if (val === 'low') colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    else if (val === 'medium') colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
    else if (val === 'high') colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (type === 'priority') {
    if (val === 'critical') colorClasses = 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
    else if (val === 'high') colorClasses = 'bg-orange-50 text-orange-700 border-orange-200';
    else if (val === 'medium') colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
    else if (val === 'low') colorClasses = 'bg-slate-50 text-slate-600 border-slate-200';
  } else if (type === 'status') {
    if (['resolved', 'closed', 'approved'].includes(val)) {
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (['open', 'under review', 'detected'].includes(val)) {
      colorClasses = 'bg-sky-50 text-sky-700 border-sky-200';
    } else if (['in progress', 'pending', 'modified'].includes(val)) {
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
    } else if (['rejected', 'failed', 'suspended'].includes(val)) {
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
    }
  } else if (type === 'role') {
    if (val === 'admin') colorClasses = 'bg-purple-50 text-purple-700 border-purple-200';
    else if (val === 'support agent') colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
    else if (val === 'analyst') colorClasses = 'bg-teal-50 text-teal-700 border-teal-200';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClasses}`}>
      {value}
    </span>
  );
};

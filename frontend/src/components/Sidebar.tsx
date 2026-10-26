import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  MessageSquareText,
  AlertCircle,
  TrendingDown,
  ShieldAlert,
  Sparkles,
  BarChart3,
  History,
  UserCheck,
  Settings,
  Shield,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();

  const navItems = [
    { to: '/', label: 'Main Dashboard', icon: LayoutDashboard },
    { to: '/customers', label: 'Customers', icon: Users },
    { to: '/interactions', label: 'Interaction & Sentiment', icon: MessageSquareText },
    { to: '/complaints', label: 'Complaints', icon: AlertCircle },
    { to: '/churn', label: 'Churn Prediction', icon: TrendingDown },
    { to: '/disputes', label: 'Dispute Investigation', icon: ShieldAlert },
    { to: '/recommendations', label: 'Recommendations', icon: Sparkles },
    { to: '/analytics', label: 'Analytics & Reports', icon: BarChart3 },
    { to: '/audit', label: 'Audit Trail', icon: History },
    ...(isAdmin ? [{ to: '/users', label: 'User & Roles', icon: UserCheck }] : []),
    { to: '/settings', label: 'Settings & Engine', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-slate-800">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-teal-400 flex items-center justify-center shadow-md shadow-blue-500/20 text-white font-bold">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white tracking-tight text-lg">ResolveX</span>
            <span className="text-[10px] uppercase font-semibold bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30">
              Enterprise
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">LexIntel AI Engine</p>
        </div>
      </div>

      {/* Nav Links */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Core Operations
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white shrink-0 uppercase border border-slate-600">
              {user?.full_name ? user.full_name[0] : 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.full_name}</p>
              <p className="text-[10px] text-teal-400 font-medium truncate">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

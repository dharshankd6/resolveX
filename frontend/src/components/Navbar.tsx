import React from 'react';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from './StatusBadge';
import { Activity, Bell, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  title: string;
  subtitle?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ title, subtitle }) => {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between sticky top-0 z-20 shadow-sm/50">
      <div>
        <h1 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* LexIntel AI Telemetry Status Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200/60 text-xs text-teal-800 font-medium">
          <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse-subtle" />
          <span>LexIntel AI: Online</span>
        </div>

        {/* User Role Pill */}
        {user?.role && <StatusBadge type="role" value={user.role} />}
      </div>
    </header>
  );
};

'use client';

import React from 'react';
import {
  Home,
  Users,
  ArrowLeftRight,
  Share2,
  FileText,
  Search,
  Bookmark,
  Database,
  Settings,
  HelpCircle,
  Bot,
  Award
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'accounts', label: 'Suspicious Accounts', icon: Users },
    { id: 'transactions', label: 'Transaction Analysis', icon: ArrowLeftRight },
    { id: 'network', label: 'Network Investigation', icon: Share2 },
    { id: 'complaints', label: 'Complaints & Incidents', icon: FileText },
    { id: 'entity-search', label: 'Entity Search', icon: Search },
    { id: 'solved-cases', label: 'Solved Case Stories', icon: Award },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'watchlist', label: 'Watchlist', icon: Bookmark },
    { id: 'data-management', label: 'Data Management', icon: Database },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-4 min-h-[calc(100vh-4rem)]">
      {/* Primary Navigation */}
      <div className="space-y-6">
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Secondary Links */}
        <div className="pt-4 border-t border-slate-200 space-y-1">
          <button
            onClick={() => onSelectTab('settings')}
            className="w-full flex items-center space-x-3 px-3.5 py-2 text-sm text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Settings</span>
          </button>
          <button
            onClick={() => onSelectTab('help')}
            className="w-full flex items-center space-x-3 px-3.5 py-2 text-sm text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition"
          >
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>Help & Documentation</span>
          </button>
        </div>
      </div>

      {/* AI Assistant Callout Box */}
      <div className="mt-6 p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl">
        <div className="flex items-center space-x-2.5 mb-1.5">
          <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-slate-900">AI Assistant</span>
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          Ask questions about accounts, transactions or networks.
        </p>
      </div>
    </aside>
  );
};

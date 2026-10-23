'use client';

import React from 'react';
import { Search, Bell, Shield, User, Bot, Sparkles } from 'lucide-react';

interface HeaderProps {
  onSearch?: (term: string) => void;
  onOpenCopilot?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSearch, onOpenCopilot }) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Brand & Agency Title */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-lg text-slate-900 tracking-tight">FraudTrace AI</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-700">Team SUVI</span>
          </div>
          <p className="text-xs text-slate-500 font-medium">Financial Crime Investigation Platform</p>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="flex-1 max-w-xl mx-8">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search account, transaction ID, complaint ID, name, mobile, etc..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-12 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            onChange={(e) => onSearch?.(e.target.value)}
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-400">
            ⌘ K
          </kbd>
        </div>
      </div>

      {/* Investigator Actions & Profile */}
      <div className="flex items-center space-x-4">
        {/* AI Copilot Launcher Button */}
        <button
          onClick={onOpenCopilot}
          className="relative inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition transform hover:-translate-y-0.5"
          title="Open AI Investigation Copilot (Ctrl+J)"
        >
          <Bot className="w-4 h-4 text-amber-300" />
          <span>AI Copilot</span>
          <span className="text-[10px] px-1 py-0.2 bg-white/20 rounded font-mono font-normal">⌘J</span>
        </button>

        <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition" title="Notifications">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            5
          </span>
        </button>

        <div className="flex items-center space-x-3 pl-3 border-l border-slate-200">
          <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold border border-slate-300">
            <User className="w-5 h-5 text-slate-700" />
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold text-slate-900 leading-tight">Investigator</div>
            <div className="text-xs text-slate-500 leading-tight">Cyber Crime Unit</div>
          </div>
        </div>
      </div>
    </header>
  );
};

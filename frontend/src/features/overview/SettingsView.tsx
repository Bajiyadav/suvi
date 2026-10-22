'use client';

import React, { useState } from 'react';
import { Settings, Shield, Sliders, Lock, CheckCircle2, Key, Server, AlertTriangle } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

export const SettingsView: React.FC = () => {
  const [apiKey, setApiKey] = useState('demo-investigator-key-2026');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-bold text-slate-900">System & Governance Settings</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure risk weights, decision-support thresholds, and authentication parameters.
          </p>
        </div>
      </div>

      {/* Safety Policy Box */}
      <div className="bg-emerald-50/80 border border-emerald-200 p-5 rounded-xl space-y-2">
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-emerald-600" />
          <h2 className="text-sm font-bold text-emerald-900">
            Mandatory Safety Policy: Human-in-the-Loop Decision Support
          </h2>
        </div>
        <p className="text-xs text-emerald-800 leading-relaxed">
          FraudTrace AI strictly prohibits automated debit freezes, liens, or account suspensions. All risk scores, graph clusters, and suspect lists serve exclusively to empower human law enforcement investigators and compliance officers to review and make informed determinations.
        </p>
      </div>

      {/* Risk Scoring Rubric Configuration */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
          <Sliders className="w-3.5 h-3.5 text-blue-600" />
          <span>Risk Scoring Weight Distribution (Max 100 Points)</span>
        </h2>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <div className="font-semibold text-slate-800">Rapid Inflow-to-Outflow Pass-through</div>
              <div className="text-[11px] text-slate-500">Funds withdrawn or transferred out in &lt; 30 minutes</div>
            </div>
            <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">25 Points</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <div className="font-semibold text-slate-800">Layering & High Fund Dispersal Ratio</div>
              <div className="text-[11px] text-slate-500">Dispersal ratio &gt; 80% with minimal retained balance</div>
            </div>
            <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">25 Points</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <div className="font-semibold text-slate-800">Cybercrime NCRP Complaint Linkage</div>
              <div className="text-[11px] text-slate-500">Direct or multi-hop connection to registered cybercrime FIR</div>
            </div>
            <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">20 Points</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <div className="font-semibold text-slate-800">High Transaction Velocity Anomaly</div>
              <div className="text-[11px] text-slate-500">Sudden burst of multiple transactions in short time-window</div>
            </div>
            <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">20 Points</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <div className="font-semibold text-slate-800">Structuring & Round-Amount Smurfing</div>
              <div className="text-[11px] text-slate-500">Repeated round-sum transfers designed to avoid CTR thresholds</div>
            </div>
            <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">10 Points</span>
          </div>
        </div>
      </div>

      {/* API & Authentication Settings */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
          <Key className="w-3.5 h-3.5 text-blue-600" />
          <span>API Connection & Investigator Credentials</span>
        </h2>

        <form onSubmit={handleSave} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-600 font-medium mb-1">Backend REST API Endpoint</label>
            <input
              type="text"
              readOnly
              value={API_BASE_URL}
              className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg font-mono text-slate-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">Investigator API Key / Authorization Header</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {isSaved && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Settings and credentials updated successfully.</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition shadow-xs"
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

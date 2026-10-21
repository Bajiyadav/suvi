'use client';

import React from 'react';
import { AlertTriangle, Share2, FileText, Landmark } from 'lucide-react';
import { KpiMetrics } from '@/types';

interface KpiRowProps {
  kpis: KpiMetrics;
}

export const KpiRow: React.FC<KpiRowProps> = ({ kpis }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. High Risk Accounts */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
        <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center text-red-600 flex-shrink-0">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">High Risk Accounts</div>
          <div className="flex items-baseline space-x-2 mt-0.5">
            <span className="text-2xl font-bold text-slate-900">{kpis.high_risk_accounts}</span>
            <span className="text-xs font-semibold text-red-600">▲ {kpis.high_risk_trend}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Require immediate review</p>
        </div>
      </div>

      {/* 2. Suspicious Networks */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
        <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 flex-shrink-0">
          <Share2 className="w-6 h-6" />
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Suspicious Networks</div>
          <div className="flex items-baseline space-x-2 mt-0.5">
            <span className="text-2xl font-bold text-slate-900">{kpis.suspicious_networks}</span>
            <span className="text-xs font-semibold text-red-600">▲ {kpis.networks_trend}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Identified via graph analysis</p>
        </div>
      </div>

      {/* 3. Linked Complaints */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
        <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Linked Complaints</div>
          <div className="flex items-baseline space-x-2 mt-0.5">
            <span className="text-2xl font-bold text-slate-900">{kpis.linked_complaints}</span>
            <span className="text-xs font-semibold text-emerald-600">▲ {kpis.complaints_trend}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Related to suspicious entities</p>
        </div>
      </div>

      {/* 4. Total Transactions Analyzed */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
        <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
          <Landmark className="w-6 h-6" />
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Transactions Analyzed</div>
          <div className="flex items-baseline space-x-2 mt-0.5">
            <span className="text-2xl font-bold text-slate-900">{kpis.total_transactions_analyzed}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">{kpis.transactions_timeframe}</p>
        </div>
      </div>
    </div>
  );
};

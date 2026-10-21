'use client';

import React from 'react';
import { Landmark, ArrowRight } from 'lucide-react';
import { FlowAnalysisSummary } from '@/types';

interface TransactionFlowCardProps {
  flow: FlowAnalysisSummary;
  onViewTrail?: () => void;
}

export const TransactionFlowCard: React.FC<TransactionFlowCardProps> = ({ flow, onViewTrail }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Landmark className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-900">Transaction Flow Analysis</h2>
          <span className="text-xs text-slate-500 font-medium ml-2">
            Account: <strong className="text-slate-800">{flow.account_number_masked}</strong> | Risk Score: <strong className="text-red-600">{flow.risk_score} (High)</strong>
          </span>
        </div>
        <button
          onClick={onViewTrail}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition flex items-center"
        >
          View Full Trail <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </button>
      </div>

      {/* 3 Flow Steps */}
      <div className="flex items-center justify-between space-x-3">
        {/* Step 1: Incoming Funds */}
        <div className="flex-1 bg-emerald-50/70 border border-emerald-200 rounded-lg p-3 text-center">
          <div className="text-[11px] font-semibold text-emerald-800">Incoming Funds</div>
          <div className="text-lg font-bold text-emerald-700 mt-0.5">{flow.incoming_total_formatted}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">({flow.incoming_count} transactions)</div>
        </div>

        <ArrowRight className="w-5 h-5 text-emerald-500 flex-shrink-0" />

        {/* Step 2: Layering / Transfers */}
        <div className="flex-1 bg-amber-50/70 border border-amber-200 rounded-lg p-3 text-center">
          <div className="text-[11px] font-semibold text-amber-800">Layering / Transfers</div>
          <div className="text-lg font-bold text-amber-700 mt-0.5">{flow.layering_total_formatted}</div>
          <div className="text-[10px] text-amber-600 mt-0.5">({flow.layering_count} transactions)</div>
        </div>

        <ArrowRight className="w-5 h-5 text-red-500 flex-shrink-0" />

        {/* Step 3: Outflow to Others */}
        <div className="flex-1 bg-red-50/70 border border-red-200 rounded-lg p-3 text-center">
          <div className="text-[11px] font-semibold text-red-800">Outflow to Others</div>
          <div className="text-lg font-bold text-red-700 mt-0.5">{flow.outflow_total_formatted}</div>
          <div className="text-[10px] text-red-600 mt-0.5">({flow.outflow_count} transactions)</div>
        </div>
      </div>
    </div>
  );
};

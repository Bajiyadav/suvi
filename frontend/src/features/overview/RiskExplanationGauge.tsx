'use client';

import React from 'react';
import { Sparkles, HelpCircle } from 'lucide-react';
import { RiskExplanation } from '@/types';

interface RiskExplanationGaugeProps {
  riskData: RiskExplanation;
  onExplainClick?: () => void;
}

export const RiskExplanationGauge: React.FC<RiskExplanationGaugeProps> = ({ riskData, onExplainClick }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">AI Risk Explanation</h2>
          </div>
          <button
            onClick={onExplainClick}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition flex items-center"
          >
            How score is calculated? <HelpCircle className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>

        {/* Content: Circular Gauge + Factor Bars */}
        <div className="flex items-center space-x-6">
          {/* Circular Risk Score Badge */}
          <div className="flex flex-col items-center flex-shrink-0">
            <div className="w-24 h-24 rounded-full border-4 border-red-500 bg-red-50/50 flex flex-col items-center justify-center shadow-inner">
              <span className="text-3xl font-extrabold text-red-600">{riskData.risk_score}</span>
              <span className="text-[10px] uppercase font-bold text-slate-500">Risk Score</span>
            </div>
            <div className="mt-2 text-center">
              <div className="text-xs font-bold text-red-600">High Risk</div>
              <div className="text-[10px] text-slate-500">Requires Investigation</div>
            </div>
          </div>

          {/* Top Contributing Factors */}
          <div className="flex-1 space-y-1.5">
            <div className="text-xs font-bold text-slate-700 mb-1">Top Contributing Factors</div>
            {riskData.top_contributing_factors.map((factor) => (
              <div key={factor.indicator_id} className="flex items-center justify-between text-xs space-x-2">
                <span className="text-slate-600 font-medium truncate max-w-[170px]" title={factor.summary}>
                  {factor.name}
                </span>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-red-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, factor.percentage_impact * 2.8)}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 w-7 text-right">
                    {factor.percentage_impact}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

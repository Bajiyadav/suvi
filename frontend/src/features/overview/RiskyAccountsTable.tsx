'use client';

import React from 'react';
import { AlertCircle, ChevronRight } from 'lucide-react';
import { RiskyAccountItem } from '@/types';

interface RiskyAccountsTableProps {
  accounts: RiskyAccountItem[];
  selectedAccountId: string;
  onSelectAccount: (accountId: string) => void;
}

export const RiskyAccountsTable: React.FC<RiskyAccountsTableProps> = ({
  accounts,
  selectedAccountId,
  onSelectAccount,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Risky Accounts (Top Priority)</h2>
          </div>
          <button className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition flex items-center">
            View All <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-2 px-2 text-center w-12">Rank</th>
                <th className="py-2 px-2">Account Number (Masked)</th>
                <th className="py-2 px-2 text-center">Risk Score</th>
                <th className="py-2 px-2 text-center">Risk Level</th>
                <th className="py-2 px-2">Key Indicators</th>
                <th className="py-2 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs">
              {accounts.map((acc) => {
                const isSelected = acc.account_id === selectedAccountId;
                return (
                  <tr
                    key={acc.account_id}
                    className={`transition hover:bg-slate-50/80 cursor-pointer ${
                      isSelected ? 'bg-blue-50/60 font-medium' : ''
                    }`}
                    onClick={() => onSelectAccount(acc.account_id)}
                  >
                    <td className="py-2.5 px-2 text-center text-slate-400 font-bold">{acc.rank}</td>
                    <td className="py-2.5 px-2 font-semibold text-slate-900">{acc.account_number}</td>
                    <td className="py-2.5 px-2 text-center">
                      <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                        {acc.risk_score}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          acc.risk_level === 'High'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {acc.risk_level}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-slate-600 max-w-xs truncate" title={acc.key_indicators}>
                      {acc.key_indicators}
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAccount(acc.account_id);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 border border-blue-200 rounded transition"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

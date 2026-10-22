'use client';

import React, { useState, useEffect } from 'react';
import { FullAccount } from '@/types';
import { fetchAccounts } from '@/lib/api';
import {
  Users,
  Search,
  Filter,
  ShieldAlert,
  ArrowUpRight,
  Bookmark,
  FileText,
  AlertTriangle,
  RefreshCw,
  Building2,
  Smartphone,
  CreditCard
} from 'lucide-react';

interface AccountsViewProps {
  onSelectAccount: (accountId: string) => void;
  onOpenDossier: (accountId: string) => void;
  onAddToWatchlist: (accountId: string) => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  onSelectAccount,
  onOpenDossier,
  onAddToWatchlist,
}) => {
  const [accounts, setAccounts] = useState<FullAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('ALL');

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAccounts(tierFilter === 'ALL' ? undefined : tierFilter);
      setAccounts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch accounts list.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tierFilter]);

  const filteredAccounts = accounts.filter((acc) => {
    const term = searchTerm.toLowerCase();
    return (
      acc.account_id.toLowerCase().includes(term) ||
      acc.account_number_masked.toLowerCase().includes(term) ||
      acc.account_holder_name.toLowerCase().includes(term) ||
      acc.bank_name.toLowerCase().includes(term) ||
      (acc.upi_vpa && acc.upi_vpa.toLowerCase().includes(term))
    );
  });

  const highRiskCount = accounts.filter((a) => a.risk_score >= 70).length;
  const muleSuspectCount = accounts.filter((a) => a.account_category === 'MULE_SUSPECT').length;

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-bold text-slate-900">Suspicious Accounts Directory</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dynamic risk-ranked bank accounts assessed under Problem Statement PS-01 multi-factor scoring rubric.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Total Accounts</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{accounts.length}</p>
          <span className="text-[11px] text-slate-400">In database ledger</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-red-100 bg-red-50/20 shadow-sm">
          <span className="text-xs font-medium text-red-600">High Risk (Score ≥ 70)</span>
          <p className="text-2xl font-bold text-red-700 mt-1">{highRiskCount}</p>
          <span className="text-[11px] text-red-500">Priority review required</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-purple-100 bg-purple-50/20 shadow-sm">
          <span className="text-xs font-medium text-purple-600">Mule Suspect Category</span>
          <p className="text-2xl font-bold text-purple-700 mt-1">{muleSuspectCount}</p>
          <span className="text-[11px] text-purple-500">Rapid churn / layering</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Human Review Policy</span>
          <p className="text-sm font-semibold text-emerald-700 mt-2">Active Enforcement</p>
          <span className="text-[11px] text-slate-400">Zero automated freezing</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID, masked account, holder, UPI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center space-x-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 mr-1 hidden md:block" />
          {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((tier) => (
            <button
              key={tier}
              onClick={() => setTierFilter(tier)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                tierFilter === tier
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tier === 'ALL' ? 'All Tiers' : `${tier} Risk`}
            </button>
          ))}
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Accounts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Account ID</th>
                <th className="py-3 px-4">Masked Number</th>
                <th className="py-3 px-4">Holder & Bank</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Balance</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4">Indicators</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                    Loading suspicious accounts...
                  </td>
                </tr>
              ) : filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No matching accounts found for query "{searchTerm}".
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((acc) => {
                  const isHigh = acc.risk_score >= 70;
                  const isMedium = acc.risk_score >= 40 && acc.risk_score < 70;

                  return (
                    <tr key={acc.account_id} className="hover:bg-slate-50/60 transition group">
                      <td className="py-3.5 px-4 font-mono font-medium text-blue-600">
                        {acc.account_id}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {acc.account_number_masked}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">{acc.account_holder_name}</div>
                        <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                          <Building2 className="w-3 h-3" />
                          <span>{acc.bank_name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          acc.account_category === 'MULE_SUSPECT'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {acc.account_category || 'STANDARD'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-900">
                        ₹{acc.current_balance.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isHigh
                              ? 'bg-red-100 text-red-700 border border-red-200'
                              : isMedium
                              ? 'bg-amber-100 text-amber-700 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}>
                            {acc.risk_score}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">{acc.risk_tier}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs truncate text-[11px] text-slate-500">
                        {acc.key_indicators || 'Normal activity baseline'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => onSelectAccount(acc.account_id)}
                            title="Focus in Investigation Dashboard"
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenDossier(acc.account_id)}
                            title="View Evidence Dossier"
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onAddToWatchlist(acc.account_id)}
                            title="Add to Watchlist"
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-md transition"
                          >
                            <Bookmark className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

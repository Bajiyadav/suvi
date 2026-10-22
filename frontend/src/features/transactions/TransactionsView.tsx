'use client';

import React, { useState, useEffect } from 'react';
import { FullTransaction } from '@/types';
import { fetchTransactions } from '@/lib/api';
import {
  ArrowLeftRight,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  Zap,
  Layers,
  TrendingUp,
  ArrowUpRight,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface TransactionsViewProps {
  onSelectAccount: (accountId: string) => void;
  onOpenDossier: (accountId: string) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  onSelectAccount,
  onOpenDossier,
}) => {
  const [transactions, setTransactions] = useState<FullTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState('ALL');
  const [patternFilter, setPatternFilter] = useState('ALL');

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchTransactions(undefined, 150);
      setTransactions(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch transaction stream.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTransactions = transactions.filter((txn) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      txn.transaction_id.toLowerCase().includes(term) ||
      txn.sender_account_id.toLowerCase().includes(term) ||
      txn.receiver_account_id.toLowerCase().includes(term) ||
      (txn.narrative && txn.narrative.toLowerCase().includes(term));

    const matchesChannel = channelFilter === 'ALL' || txn.channel === channelFilter;
    const matchesPattern =
      patternFilter === 'ALL' ||
      (txn.pattern_tag && txn.pattern_tag.toUpperCase().includes(patternFilter));

    return matchesSearch && matchesChannel && matchesPattern;
  });

  const totalVolume = transactions.reduce((acc, t) => acc + t.amount, 0);
  const rapidCount = transactions.filter((t) =>
    (t.pattern_tag || '').toUpperCase().includes('RAPID')
  ).length;
  const layeringCount = transactions.filter((t) =>
    (t.pattern_tag || '').toUpperCase().includes('LAYERING')
  ).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <ArrowLeftRight className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-bold text-slate-900">Transaction Velocity & Flow Explorer</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time transaction log with automated detection of rapid pass-throughs, layering, and high-velocity churn.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={isLoading}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Total Analyzed Volume</span>
          <p className="text-xl font-bold text-slate-900 mt-1">
            ₹{totalVolume.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-slate-400">{transactions.length} total records</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-100 bg-amber-50/20 shadow-sm">
          <span className="text-xs font-medium text-amber-700 flex items-center space-x-1">
            <Zap className="w-3.5 h-3.5" />
            <span>Rapid Transfers</span>
          </span>
          <p className="text-xl font-bold text-amber-800 mt-1">{rapidCount}</p>
          <span className="text-[11px] text-amber-600">Disbursed &lt; 30 mins</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-purple-100 bg-purple-50/20 shadow-sm">
          <span className="text-xs font-medium text-purple-700 flex items-center space-x-1">
            <Layers className="w-3.5 h-3.5" />
            <span>Layering Chains</span>
          </span>
          <p className="text-xl font-bold text-purple-800 mt-1">{layeringCount}</p>
          <span className="text-[11px] text-purple-600">Complex hop sequences</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Avg Transaction Size</span>
          <p className="text-xl font-bold text-slate-900 mt-1">
            ₹{transactions.length ? Math.round(totalVolume / transactions.length).toLocaleString('en-IN') : 0}
          </p>
          <span className="text-[11px] text-slate-400">Normalizing for channel</span>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Txn ID, sender, receiver, narrative..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Channel Filter */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
            {['ALL', 'UPI', 'IMPS', 'NEFT', 'RTGS', 'POS'].map((ch) => (
              <button
                key={ch}
                onClick={() => setChannelFilter(ch)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                  channelFilter === ch ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {ch}
              </button>
            ))}
          </div>

          {/* Pattern Filter */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
            {['ALL', 'RAPID', 'LAYERING'].map((pt) => (
              <button
                key={pt}
                onClick={() => setPatternFilter(pt)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                  patternFilter === pt ? 'bg-white text-purple-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {pt === 'ALL' ? 'All Patterns' : pt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Txn ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Sender Account</th>
                <th className="py-3 px-4">Receiver Account</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Pattern Flag</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                    Loading transaction records...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No transactions matching selected filters.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((txn) => {
                  const isRapid = (txn.pattern_tag || '').toUpperCase().includes('RAPID');
                  const isLayering = (txn.pattern_tag || '').toUpperCase().includes('LAYERING');
                  const dateStr = new Date(txn.timestamp).toLocaleString('en-IN', {
                    dateStyle: 'short',
                    timeStyle: 'short'
                  });

                  return (
                    <tr key={txn.transaction_id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-800">
                        {txn.transaction_id}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <button
                          onClick={() => onSelectAccount(txn.sender_account_id)}
                          className="text-blue-600 hover:underline hover:text-blue-800 font-medium"
                        >
                          {txn.sender_account_id}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <button
                          onClick={() => onSelectAccount(txn.receiver_account_id)}
                          className="text-blue-600 hover:underline hover:text-blue-800 font-medium"
                        >
                          {txn.receiver_account_id}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        ₹{txn.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {txn.channel}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {isRapid ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <Zap className="w-2.5 h-2.5" />
                            <span>Rapid Pass-through</span>
                          </span>
                        ) : isLayering ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                            <Layers className="w-2.5 h-2.5" />
                            <span>Layering Hop</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Standard</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center space-x-1 text-[11px] text-emerald-700 font-medium">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>{txn.status}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onSelectAccount(txn.sender_account_id)}
                          title="Inspect Sender in Dashboard"
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
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

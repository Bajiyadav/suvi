'use client';

import React, { useState, useEffect } from 'react';
import { FullAccount, FullTransaction, CybercrimeComplaint } from '@/types';
import { fetchAccounts, fetchTransactions, fetchComplaints } from '@/lib/api';
import {
  Search,
  Users,
  ArrowLeftRight,
  FileText,
  ArrowUpRight,
  Building2,
  Smartphone,
  CreditCard,
  Layers,
  ShieldAlert,
  Bookmark
} from 'lucide-react';

interface EntitySearchViewProps {
  onSelectAccount: (accountId: string) => void;
  onOpenDossier: (accountId: string) => void;
  onAddToWatchlist: (accountId: string) => void;
}

export const EntitySearchView: React.FC<EntitySearchViewProps> = ({
  onSelectAccount,
  onOpenDossier,
  onAddToWatchlist,
}) => {
  const [query, setQuery] = useState('');
  const [entityType, setEntityType] = useState<'ALL' | 'ACCOUNTS' | 'TRANSACTIONS' | 'COMPLAINTS'>('ALL');
  const [accounts, setAccounts] = useState<FullAccount[]>([]);
  const [transactions, setTransactions] = useState<FullTransaction[]>([]);
  const [complaints, setComplaints] = useState<CybercrimeComplaint[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadAll() {
      setIsLoading(true);
      try {
        const [accs, txns, cmps] = await Promise.all([
          fetchAccounts(),
          fetchTransactions(undefined, 100),
          fetchComplaints(50),
        ]);
        setAccounts(accs);
        setTransactions(txns);
        setComplaints(cmps);
      } catch (e) {
        console.error('Error loading search corpus:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadAll();
  }, []);

  const q = query.trim().toLowerCase();

  const matchingAccounts = accounts.filter(
    (a) =>
      !q ||
      a.account_id.toLowerCase().includes(q) ||
      a.account_number_masked.toLowerCase().includes(q) ||
      a.account_holder_name.toLowerCase().includes(q) ||
      a.bank_name.toLowerCase().includes(q) ||
      (a.upi_vpa && a.upi_vpa.toLowerCase().includes(q)) ||
      (a.registered_mobile_masked && a.registered_mobile_masked.toLowerCase().includes(q))
  );

  const matchingTransactions = transactions.filter(
    (t) =>
      !q ||
      t.transaction_id.toLowerCase().includes(q) ||
      t.sender_account_id.toLowerCase().includes(q) ||
      t.receiver_account_id.toLowerCase().includes(q) ||
      (t.narrative && t.narrative.toLowerCase().includes(q))
  );

  const matchingComplaints = complaints.filter(
    (c) =>
      !q ||
      c.complaint_id.toLowerCase().includes(q) ||
      c.complaint_type.toLowerCase().includes(q) ||
      c.status.toLowerCase().includes(q)
  );

  return (
    <div className="space-y-5">
      {/* Search Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-bold text-slate-900">Unified Entity Search Console</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Search across accounts, transactions, cybercrime FIRs, UPI VPAs, and mobile numbers.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Account ID (e.g. ACC-4321), Masked Number (XXXX 4321), UPI VPA, Mobile, or FIR ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Entity Type Filter Tabs */}
        <div className="flex items-center space-x-2 pt-1 border-t border-slate-100">
          {[
            { id: 'ALL', label: 'All Entities', count: matchingAccounts.length + matchingTransactions.length + matchingComplaints.length },
            { id: 'ACCOUNTS', label: 'Accounts', count: matchingAccounts.length },
            { id: 'TRANSACTIONS', label: 'Transactions', count: matchingTransactions.length },
            { id: 'COMPLAINTS', label: 'Complaints', count: matchingComplaints.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setEntityType(tab.id as any)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                entityType === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                entityType === tab.id ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-6">
        {/* Accounts Results */}
        {(entityType === 'ALL' || entityType === 'ACCOUNTS') && matchingAccounts.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Matching Bank Accounts ({matchingAccounts.length})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {matchingAccounts.map((acc) => (
                <div key={acc.account_id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-blue-600">{acc.account_id}</span>
                      <h3 className="font-semibold text-slate-900 text-sm">{acc.account_holder_name}</h3>
                      <div className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                        <Building2 className="w-3 h-3" />
                        <span>{acc.bank_name}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      acc.risk_score >= 70
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : acc.risk_score >= 40
                        ? 'bg-amber-100 text-amber-700 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    }`}>
                      Risk: {acc.risk_score}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-lg font-mono text-[11px]">
                    <div>Masked: {acc.account_number_masked}</div>
                    {acc.upi_vpa && <div>UPI: {acc.upi_vpa}</div>}
                    <div>Mobile: {acc.registered_mobile_masked}</div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => onSelectAccount(acc.account_id)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1"
                    >
                      <span>Focus on Dashboard</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onOpenDossier(acc.account_id)}
                      className="text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center space-x-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Dossier</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transactions Results */}
        {(entityType === 'ALL' || entityType === 'TRANSACTIONS') && matchingTransactions.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
              <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600" />
              <span>Matching Transactions ({matchingTransactions.length})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {matchingTransactions.slice(0, 10).map((txn) => (
                <div key={txn.transaction_id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-slate-800">{txn.transaction_id}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                        {txn.channel}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 font-mono">
                      {txn.sender_account_id} → {txn.receiver_account_id}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {new Date(txn.timestamp).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-sm font-bold font-mono text-slate-900">
                      ₹{txn.amount.toLocaleString('en-IN')}
                    </div>
                    <button
                      onClick={() => onSelectAccount(txn.sender_account_id)}
                      className="text-xs text-blue-600 hover:underline flex items-center space-x-1 justify-end"
                    >
                      <span>Inspect</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Complaints Results */}
        {(entityType === 'ALL' || entityType === 'COMPLAINTS') && matchingComplaints.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Matching Cybercrime Complaints ({matchingComplaints.length})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {matchingComplaints.map((c) => (
                <div key={c.complaint_id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="font-mono text-xs font-bold text-blue-600">{c.complaint_id}</span>
                    <div className="text-xs font-semibold text-slate-900">{c.complaint_type}</div>
                    <div className="text-[11px] text-slate-400">
                      Loss: {c.reported_loss_formatted || `₹${c.reported_loss_amount.toLocaleString('en-IN')}`}
                    </div>
                  </div>
                  <button
                    onClick={() => onSelectAccount('ACC-4321')}
                    className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition font-medium"
                  >
                    View in Graph
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

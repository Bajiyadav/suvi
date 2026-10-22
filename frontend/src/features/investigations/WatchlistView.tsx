'use client';

import React, { useState, useEffect } from 'react';
import { WatchlistEntry, AuditLogEntry } from '@/types';
import { fetchWatchlist, addToWatchlist, removeFromWatchlist, fetchAuditLogs } from '@/lib/api';
import {
  Bookmark,
  Plus,
  Trash2,
  RefreshCw,
  AlertTriangle,
  ArrowUpRight,
  ShieldAlert,
  Building2,
  FileText,
  CheckCircle2,
  Clock,
  History,
  ShieldCheck,
  Search
} from 'lucide-react';

interface WatchlistViewProps {
  onSelectAccount: (accountId: string) => void;
  onOpenDossier: (accountId: string) => void;
}

export const WatchlistView: React.FC<WatchlistViewProps> = ({
  onSelectAccount,
  onOpenDossier,
}) => {
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newAccountId, setNewAccountId] = useState('');
  const [newReason, setNewReason] = useState('');
  const [newPriority, setNewPriority] = useState('HIGH');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [wData, aData] = await Promise.all([
        fetchWatchlist(),
        fetchAuditLogs(50).catch(() => [])
      ]);
      setWatchlist(wData);
      setAuditLogs(aData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch active watchlist entries.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountId.trim()) return;

    setIsSubmitting(true);
    setFeedback(null);
    try {
      await addToWatchlist(
        newAccountId.trim().toUpperCase(),
        newReason.trim() || 'Flagged for continuous surveillance from Watchlist portal',
        newPriority,
        'INV-CYBER-HQ'
      );
      setNewAccountId('');
      setNewReason('');
      setFeedback(`Account ${newAccountId} successfully added to database watchlist.`);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to add account to watchlist.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (accountId: string) => {
    try {
      await removeFromWatchlist(accountId);
      setWatchlist((prev) => prev.filter((item) => item.account_id !== accountId));
      setFeedback(`Account ${accountId} removed from active watchlist.`);
    } catch (err: any) {
      setError(err.message || `Failed to remove ${accountId} from watchlist.`);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <Bookmark className="w-5 h-5 text-purple-600" />
            <h1 className="text-lg font-bold text-slate-900">Active Surveillance Watchlist</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Accounts under active monitoring for rapid fund disbursement, sudden velocity spikes, or cybercrime complaint linkage.
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

      {/* Add to Watchlist Form */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
          <Plus className="w-3.5 h-3.5 text-blue-600" />
          <span>Add Account to Surveillance Watchlist</span>
        </h2>
        <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-600 font-medium mb-1">Account ID</label>
            <input
              type="text"
              placeholder="e.g. ACC-4321"
              value={newAccountId}
              onChange={(e) => setNewAccountId(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-medium mb-1">Priority Level</label>
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
            >
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="block text-slate-600 font-medium mb-1">Surveillance Reason</label>
            <input
              type="text"
              placeholder="Reason for surveillance..."
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={isSubmitting || !newAccountId.trim()}
              className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition shadow-xs flex items-center justify-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Enrolling...' : 'Enroll Account'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Notifications */}
      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{feedback}</span>
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Watchlist Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Account ID</th>
                <th className="py-3 px-4">Masked Number</th>
                <th className="py-3 px-4">Bank</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4">Reason for Surveillance</th>
                <th className="py-3 px-4">Added Timestamp</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-purple-500" />
                    Loading watchlist...
                  </td>
                </tr>
              ) : watchlist.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No accounts currently on active surveillance watchlist.
                  </td>
                </tr>
              ) : (
                watchlist.map((item) => (
                  <tr key={item.entry_id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-mono font-medium text-purple-600">
                      {item.account_id}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      {item.account_number_masked || `XXXX ${item.account_id.replace(/\D/g, '')}`}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {item.bank_name || 'State Bank of Bharat'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.priority === 'CRITICAL'
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : item.priority === 'HIGH'
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : 'bg-blue-100 text-blue-700 border border-blue-200'
                      }`}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {item.risk_score ?? 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                      {item.reason || 'Flagged for surveillance'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {new Date(item.added_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => onSelectAccount(item.account_id)}
                          title="Focus on Dashboard"
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onOpenDossier(item.account_id)}
                          title="Evidence Dossier"
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemove(item.account_id)}
                          title="Remove from Watchlist"
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Trail & Chain of Custody */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-800">Legal Audit Trail & Chain of Custody</h2>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded">
              DPDPA 2023 COMPLIANT
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            Immutable log entries ({auditLogs.length} events recorded)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Investigator / Actor</th>
                <th className="py-2.5 px-4">Target Entity</th>
                <th className="py-2.5 px-4">Details / Justification</th>
                <th className="py-2.5 px-4 text-right">Log ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">
                    No audit records recorded yet.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => {
                  const isActionReq = log.action_type.startsWith('REQUEST_');
                  const isExport = log.action_type.includes('EXPORT');
                  const isWatchlist = log.action_type.includes('WATCHLIST');

                  return (
                    <tr key={log.audit_id} className="hover:bg-slate-50/60 transition">
                      <td className="py-2.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('en-IN', {
                          dateStyle: 'short',
                          timeStyle: 'medium',
                        })}
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold font-sans ${
                            isActionReq
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : isExport
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : isWatchlist
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {log.action_type}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-sans text-slate-700 font-medium">
                        {log.investigator_id || 'SYSTEM_AUTH'}
                      </td>
                      <td className="py-2.5 px-4 text-blue-600 font-semibold">
                        {log.resource_id || 'N/A'}
                      </td>
                      <td className="py-2.5 px-4 font-sans text-slate-600 max-w-sm truncate" title={log.details ? JSON.stringify(log.details) : ''}>
                        {log.details?.details || (typeof log.details === 'string' ? log.details : JSON.stringify(log.details) || 'Action completed')}
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-400 text-[10px]">
                        {log.audit_id}
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

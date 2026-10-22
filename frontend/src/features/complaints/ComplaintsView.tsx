'use client';

import React, { useState, useEffect } from 'react';
import { CybercrimeComplaint } from '@/types';
import { fetchComplaints } from '@/lib/api';
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  Building,
  ShieldCheck,
  ArrowUpRight,
  IndianRupee,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface ComplaintsViewProps {
  onSelectAccount: (accountId: string) => void;
  onOpenDossier: (accountId: string) => void;
}

export const ComplaintsView: React.FC<ComplaintsViewProps> = ({
  onSelectAccount,
  onOpenDossier,
}) => {
  const [complaints, setComplaints] = useState<CybercrimeComplaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchComplaints(100);
      setComplaints(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch complaints list.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalLoss = complaints.reduce((sum, c) => sum + (c.reported_loss_amount || 0), 0);
  const linkedAccountsTotal = complaints.reduce((sum, c) => sum + (c.linked_accounts_count || 0), 0);

  const filteredComplaints = complaints.filter((c) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      c.complaint_id.toLowerCase().includes(term) ||
      c.complaint_type.toLowerCase().includes(term) ||
      c.status.toLowerCase().includes(term);

    const matchesType = typeFilter === 'ALL' || c.complaint_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const uniqueTypes = ['ALL', ...Array.from(new Set(complaints.map((c) => c.complaint_type)))];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-bold text-slate-900">National Cybercrime Incidents & Complaints</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Registered NCRP / Cyber Cell complaints correlated with suspect transaction flows and mule banking chains.
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

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Registered Complaints</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{complaints.length}</p>
          <span className="text-[11px] text-slate-400">NCRP / Cyber Crime Cell</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-red-100 bg-red-50/20 shadow-sm">
          <span className="text-xs font-medium text-red-600">Total Reported Losses</span>
          <p className="text-2xl font-bold text-red-700 mt-1">₹{totalLoss.toLocaleString('en-IN')}</p>
          <span className="text-[11px] text-red-500">Victim reported impact</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-purple-100 bg-purple-50/20 shadow-sm">
          <span className="text-xs font-medium text-purple-600">Correlated Suspect Accounts</span>
          <p className="text-2xl font-bold text-purple-700 mt-1">{linkedAccountsTotal}</p>
          <span className="text-[11px] text-purple-500">Linked to money trails</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Law Enforcement Status</span>
          <p className="text-sm font-semibold text-blue-700 mt-2">Correlated via Graph</p>
          <span className="text-[11px] text-slate-400">Verifiable evidence chains</span>
        </div>
      </div>

      {/* Visual End-to-End Cybercrime Modus Operandi Chain */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-xl border border-indigo-900/50 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
              End-to-End Cybercrime-to-Mule Correlation Chain
            </h2>
          </div>
          <span className="text-[10px] bg-indigo-800/60 text-indigo-200 px-2 py-0.5 rounded font-mono">
            PS-01 REQ 5: VISUAL TRACE
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-center text-xs">
          {/* Step 1: NCRP Complaint */}
          <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/10 flex flex-col items-center justify-center">
            <div className="text-[10px] font-bold text-red-300 uppercase">1. NCRP Incident</div>
            <div className="text-xs font-bold text-white mt-1">C2026-0305 / 0158</div>
            <div className="text-[10px] text-slate-300 mt-0.5">Task / Digital Arrest Scam</div>
          </div>
          {/* Step 2: Victim Outflow */}
          <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/10 flex flex-col items-center justify-center">
            <div className="text-[10px] font-bold text-amber-300 uppercase">2. Victim Outflow</div>
            <div className="text-xs font-bold text-white mt-1">₹4,85,000 Total</div>
            <div className="text-[10px] text-slate-300 mt-0.5">UPI / IMPS under duress</div>
          </div>
          {/* Step 3: Layer 1 Mule */}
          <div className="bg-red-500/20 backdrop-blur-sm p-3 rounded-lg border border-red-500/40 flex flex-col items-center justify-center">
            <div className="text-[10px] font-bold text-red-300 uppercase">3. Primary Mule (L1)</div>
            <div className="text-xs font-bold text-white mt-1 font-mono">ACC-4321</div>
            <div className="text-[10px] text-red-200 mt-0.5">Rapid churn &lt; 10 min</div>
          </div>
          {/* Step 4: Layer 2 Mules */}
          <div className="bg-purple-500/20 backdrop-blur-sm p-3 rounded-lg border border-purple-500/40 flex flex-col items-center justify-center">
            <div className="text-[10px] font-bold text-purple-300 uppercase">4. Layering / Split (L2)</div>
            <div className="text-xs font-bold text-white mt-1 font-mono">ACC-1111 / 2211 / 4444</div>
            <div className="text-[10px] text-purple-200 mt-0.5">Shared IP &amp; Device cluster</div>
          </div>
          {/* Step 5: Cash-out */}
          <div className="bg-emerald-500/20 backdrop-blur-sm p-3 rounded-lg border border-emerald-500/40 flex flex-col items-center justify-center">
            <div className="text-[10px] font-bold text-emerald-300 uppercase">5. Terminal Cash-Out</div>
            <div className="text-xs font-bold text-white mt-1">POS &amp; Merchant Kart</div>
            <div className="text-[10px] text-emerald-200 mt-0.5">ACC-MERCHANT-TECHKART</div>
          </div>
        </div>
      </div>

      {/* Search and Category Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Complaint ID, category, status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center space-x-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 mr-1 hidden md:block" />
          {uniqueTypes.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                typeFilter === t
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t === 'ALL' ? 'All Incidents' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Complaint ID</th>
                <th className="py-3 px-4">Incident Date</th>
                <th className="py-3 px-4">Cybercrime Category</th>
                <th className="py-3 px-4">Reported Loss</th>
                <th className="py-3 px-4">Linked Suspects</th>
                <th className="py-3 px-4">Investigation Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                    Loading cybercrime complaints...
                  </td>
                </tr>
              ) : filteredComplaints.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No cybercrime complaints found.
                  </td>
                </tr>
              ) : (
                filteredComplaints.map((c) => {
                  const dateFormatted = new Date(c.incident_date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  });

                  return (
                    <tr key={c.complaint_id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 font-mono font-medium text-blue-600">
                        {c.complaint_id}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 flex items-center space-x-1.5 mt-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{dateFormatted}</span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {c.complaint_type}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-red-600">
                        {c.reported_loss_formatted || `₹${(c.reported_loss_amount || 0).toLocaleString('en-IN')}`}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          <span>{c.linked_accounts_count} suspect account(s)</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>{c.status}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onSelectAccount('ACC-4321')}
                          title="Inspect in Main Dashboard"
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

'use client';

import React, { useState, useEffect } from 'react';
import { Database, ShieldCheck, RefreshCw, CheckCircle2, AlertTriangle, FolderUp, Server, RotateCcw, Play, Check } from 'lucide-react';
import { fetchAccounts, fetchTransactions, fetchComplaints, reseedDatabase, API_BASE_URL } from '@/lib/api';

export const DataManagementView: React.FC = () => {
  const [stats, setStats] = useState({
    accountsCount: 0,
    transactionsCount: 0,
    complaintsCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isReseeding, setIsReseeding] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [filePath, setFilePath] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [ingestSummary, setIngestSummary] = useState<any | null>(null);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const [accs, txns, cmps] = await Promise.all([
        fetchAccounts(),
        fetchTransactions(undefined, 200),
        fetchComplaints(),
      ]);
      setStats({
        accountsCount: accs.length,
        transactionsCount: txns.length,
        complaintsCount: cmps.length,
      });
    } catch (e) {
      console.error('Failed to load DB stats:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleReseed = async () => {
    setIsReseeding(true);
    setMessage(null);
    setIngestSummary(null);
    try {
      await reseedDatabase();
      await loadStats();
      setMessage('Database successfully reset to official competition benchmark synthetic fixtures.');
    } catch (e: any) {
      setMessage(`Error: ${e.message || 'Failed to reseed database'}`);
    } finally {
      setIsReseeding(false);
    }
  };

  const handleIngestDataset = async () => {
    if (!filePath.trim()) {
      setMessage('Error: Please enter a valid file path or folder path to the dataset.');
      return;
    }
    setIsIngesting(true);
    setMessage(null);
    setIngestSummary(null);
    try {
      const res = await fetch(`${API_BASE_URL}/cases/ingest-dataset?file_path=${encodeURIComponent(filePath.trim())}&wipe_existing=true`, {
        method: 'POST',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server responded with ${res.status}`);
      }
      const data = await res.json();
      setIngestSummary(data);
      await loadStats();
      setMessage(`Successfully ingested new dataset: ${data.total_accounts} accounts, ${data.total_transactions} transactions, ${data.total_complaints} complaints.`);
    } catch (e: any) {
      setMessage(`Error: ${e.message || 'Failed to ingest dataset'}`);
    } finally {
      setIsIngesting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-bold text-slate-900">Synthetic Data & Dataset Governance</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Data management console adhering strictly to Cyber Hackathon 2026 privacy and synthetic data compliance mandates.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={loadStats}
            disabled={isLoading}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Stats</span>
          </button>
          <button
            onClick={handleReseed}
            disabled={isReseeding}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition shadow-xs"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isReseeding ? 'animate-spin' : ''}`} />
            <span>{isReseeding ? 'Resetting...' : 'Reset Benchmark Fixtures'}</span>
          </button>
        </div>
      </div>

      {/* Action Notification */}
      {message && (
        <div className={`p-4 rounded-xl border text-xs flex items-center space-x-2 ${
          message.startsWith('Error')
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          {message.startsWith('Error') ? (
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          )}
          <span>{message}</span>
        </div>
      )}

      {/* Official Hackathon Dataset Loader Card */}
      <div className="bg-white p-5 rounded-xl border border-blue-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FolderUp className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Ingest Hackathon Dataset (Google Drive / Local File or Folder)
            </h2>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Auto-Detects CSV, JSON, XLSX & Directories
          </span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          When the Cyber Hackathon 2026 organizers share the sample dataset, save the file or unzipped directory anywhere in the workspace (e.g. <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">data/sample_dataset.csv</code> or a directory of files). Enter the path below to wipe and load, automatically normalize columns, discover accounts, and compute explainable risk scores.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={filePath}
            onChange={(e) => setFilePath(e.target.value)}
            placeholder="e.g. data/transactions.csv or /Users/.../CyberHackathon_Dataset"
            className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
          />
          <button
            onClick={handleIngestDataset}
            disabled={isIngesting || !filePath.trim()}
            className="flex items-center justify-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition shadow-xs whitespace-nowrap"
          >
            <Play className={`w-3.5 h-3.5 ${isIngesting ? 'animate-spin' : ''}`} />
            <span>{isIngesting ? 'Ingesting & Analyzing...' : 'Ingest & Run FraudTrace AI'}</span>
          </button>
        </div>

        {/* Ingestion Results Breakdown */}
        {ingestSummary && (
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg space-y-3 mt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Ingestion Execution Summary</span>
              <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Pipeline Completed
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="bg-white p-2 rounded border border-slate-200">
                <div className="text-xs text-slate-500">Accounts</div>
                <div className="text-base font-bold text-slate-900">{ingestSummary.total_accounts}</div>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <div className="text-xs text-slate-500">Transactions</div>
                <div className="text-base font-bold text-slate-900">{ingestSummary.total_transactions}</div>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <div className="text-xs text-slate-500">Complaints</div>
                <div className="text-base font-bold text-slate-900">{ingestSummary.total_complaints}</div>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <div className="text-xs text-slate-500">Mule Suspects (Score &ge; 70)</div>
                <div className="text-base font-bold text-red-600">{ingestSummary.high_risk_accounts_count}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Synthetic Compliance Certification Banner */}
      <div className="bg-emerald-50/70 border border-emerald-200 p-5 rounded-xl space-y-2">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <h2 className="text-sm font-bold text-emerald-900">
            Official Compliance Statement: 100% Synthetic Test Data
          </h2>
        </div>
        <p className="text-xs text-emerald-800 leading-relaxed">
          FraudTrace AI operates exclusively on deterministically generated synthetic mock data. In strict accordance with competition rules and Indian data protection regulations (DPDPA 2023), no genuine customer records, unmasked Aadhaar, PAN, real banking credentials, or live transactional data are ingested, processed, or exposed by this prototype.
        </p>
      </div>

      {/* Database Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Synthetic Bank Accounts</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">Seeded</span>
          </div>
          <div className="text-3xl font-bold font-mono text-slate-900">
            {isLoading ? '...' : stats.accountsCount}
          </div>
          <p className="text-[11px] text-slate-500">
            Categorized across High Risk, Layering Intermediaries, and Standard accounts.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Transaction Records</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700">Seeded</span>
          </div>
          <div className="text-3xl font-bold font-mono text-slate-900">
            {isLoading ? '...' : stats.transactionsCount}
          </div>
          <p className="text-[11px] text-slate-500">
            Multi-hop fund flows, rapid pass-throughs, and timestamped UPI/NEFT transfers.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">NCRP Cybercrime Incidents</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700">Seeded</span>
          </div>
          <div className="text-3xl font-bold font-mono text-slate-900">
            {isLoading ? '...' : stats.complaintsCount}
          </div>
          <p className="text-[11px] text-slate-500">
            Correlated cybercrime FIR records linking victim losses to money mule chains.
          </p>
        </div>
      </div>

      {/* Backend Architecture & Seeding Info */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
          <Server className="w-3.5 h-3.5 text-blue-600" />
          <span>Backend Architecture & Universal Ingestion Info</span>
        </h3>
        <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
          <p>
            <strong>Storage Engine:</strong> SQLite database located at <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">backend/fraudtrace.db</code>.
          </p>
          <p>
            <strong>CLI Ingestion Command:</strong> <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[11px]">python -m app.seed.ingest_alternate_dataset --file &lt;path&gt;</code> or <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[11px]">--dir &lt;folder&gt;</code>.
          </p>
          <p>
            <strong>Audit Logging:</strong> Every action taken by investigators (Watchlist enrollment, dataset ingestion, case dossier export, risk recalculation) is permanently committed to the immutable <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">audit_logs</code> table.
          </p>
        </div>
      </div>
    </div>
  );
};

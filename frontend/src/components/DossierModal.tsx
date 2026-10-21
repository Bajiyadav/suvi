'use client';

import React, { useState } from 'react';
import { X, Download, FileText, CheckCircle, ShieldAlert, Copy, ExternalLink } from 'lucide-react';

interface DossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountId: string;
}

export const DossierModal: React.FC<DossierModalProps> = ({ isOpen, onClose, accountId }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'json'>('summary');
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const handleDownloadPdf = () => {
    window.open(`http://localhost:8000/api/v1/reports/download-pdf/${accountId}`, '_blank');
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(sampleDossierJson, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const sampleDossierJson = {
    report_id: "REP-20261021-0042",
    case_reference: "CASE-2026-0042",
    generating_agency: "Cyber Crime Unit / Financial Intelligence Platform",
    target_account: {
      account_id: accountId,
      account_number_masked: "XXXX 4321",
      bank_name: "State Bank of Bharat",
      holder_name: "Ramesh K. (Synthetic)",
      risk_score: 96,
      risk_tier: "URGENT_REVIEW"
    },
    flow_analysis: {
      incoming_funds: 1245000,
      layering_transfers: 1210500,
      outflow_sinks: 1198300,
      pass_through_ratio: "97.2%"
    },
    contributing_factors: [
      { name: "Rapid fund transfers", impact: "28%", points: "20/20" },
      { name: "Multiple short-duration credits", impact: "22%", points: "20/20" },
      { name: "Funds moved to high-risk accounts", impact: "18%", points: "18/20" },
      { name: "Links to 5 cybercrime complaints", impact: "16%", points: "15/15" },
      { name: "Layering pattern detected", impact: "10%", points: "10/10" },
      { name: "Unusual transaction locations", impact: "6%", points: "13/15" }
    ],
    linked_complaints: [
      { id: "C2026-0158", type: "UPI Fraud", amount: 50000, status: "Verified" },
      { id: "C2026-0210", type: "Job Scam", amount: 120000, status: "Under Investigation" },
      { id: "C2026-0305", type: "Investment Fraud", amount: 75000, status: "Verified" }
    ],
    statutory_notice: "STATUTORY NOTICE: Generated synthetically for Cyber Hackathon 2026 PS-01 evaluation. Does not represent actual criminal records."
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            <div>
              <h3 className="font-bold text-sm">Official Investigation Evidence Dossier</h3>
              <p className="text-[11px] text-slate-400">Target Account: XXXX 4321 | Case Reference: CASE-2026-0042</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center justify-between px-6 pt-3 border-b border-slate-200 bg-slate-50">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('summary')}
              className={`pb-2.5 text-xs font-bold border-b-2 transition ${
                activeTab === 'summary'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Executive Summary
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`pb-2.5 text-xs font-bold border-b-2 transition ${
                activeTab === 'json'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Structured Evidence JSON
            </button>
          </div>

          <div className="flex items-center space-x-2 pb-2">
            <button
              onClick={handleDownloadPdf}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'summary' ? (
            <div className="space-y-4 text-xs">
              {/* Risk Summary Card */}
              <div className="p-3.5 bg-red-50/70 border border-red-200 rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-bold text-red-900 text-sm">Priority Tier: URGENT REVIEW (Score: 96/100)</div>
                  <div className="text-red-700 mt-0.5">High-confidence mule account conduit with confirmed rapid layering flows.</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-red-600 text-white px-2 py-1 rounded">
                    Lien Recommended
                  </span>
                </div>
              </div>

              {/* Fund Flow Metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-slate-500 font-semibold text-[11px]">Total Turnover</div>
                  <div className="text-base font-bold text-slate-900 mt-0.5">₹12,45,000</div>
                  <div className="text-[10px] text-slate-400">42 incoming credits</div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-slate-500 font-semibold text-[11px]">Forwarded Layering</div>
                  <div className="text-base font-bold text-slate-900 mt-0.5">₹12,10,500</div>
                  <div className="text-[10px] text-slate-400">97.2% pass-through</div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-slate-500 font-semibold text-[11px]">Linked Complaints</div>
                  <div className="text-base font-bold text-slate-900 mt-0.5">3 NCRP Cases</div>
                  <div className="text-[10px] text-emerald-600 font-semibold">2 Verified by Cyber Cell</div>
                </div>
              </div>

              {/* Contributing Factors */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Key Investigative Findings</h4>
                <ul className="space-y-1.5 text-slate-600 list-disc pl-4">
                  <li>Dispatches funds out within 3 minutes of receiving victim deposits (average delta: 2.8 mins).</li>
                  <li>Linked directly to cybercrime complaint C2026-0158 (UPI refund phishing, ₹50,000).</li>
                  <li>Multi-hop trail isolates 4 secondary accounts (XXXX 1111, XXXX 4444, XXXX 5555, XXXX 2211).</li>
                </ul>
              </div>

              {/* Synthetic Notice */}
              <div className="p-3 bg-slate-100 rounded-lg text-[10px] text-slate-500 border border-slate-200 leading-relaxed">
                <strong>STATUTORY NOTICE:</strong> All data, account numbers, and complaint records are synthetic fixtures generated for Cyber Hackathon 2026 PS-01 technology evaluation.
              </div>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={handleCopyJson}
                className="absolute top-2 right-2 flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[11px] transition font-medium"
              >
                {isCopied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Copied' : 'Copy JSON'}</span>
              </button>
              <pre className="bg-slate-900 text-slate-200 p-4 rounded-lg text-[11px] font-mono overflow-x-auto leading-relaxed">
                {JSON.stringify(sampleDossierJson, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            Close
          </button>
          <button
            onClick={handleDownloadPdf}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Official Dossier (PDF)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

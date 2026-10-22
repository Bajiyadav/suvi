'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  FileText,
  CheckCircle,
  ShieldAlert,
  Copy,
  AlertCircle,
  Loader2,
  Landmark,
  User,
  Phone,
  ShieldCheck
} from 'lucide-react';
import { fetchDossierJson, API_BASE_URL } from '@/lib/api';
import { DossierData } from '@/types';

interface DossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountId: string;
}

export const DossierModal: React.FC<DossierModalProps> = ({ isOpen, onClose, accountId }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'json'>('summary');
  const [isCopied, setIsCopied] = useState(false);
  const [dossierData, setDossierData] = useState<DossierData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);
  const [expandedFactor, setExpandedFactor] = useState<string | null>(null);

  // Asynchronously fetch JSON dossier data when modal opens or accountId changes (Requirement B.1, B.6)
  useEffect(() => {
    if (!isOpen || !accountId) {
      setDossierData(null);
      setErrorMessage(null);
      setIsNotFound(false);
      return;
    }

    // Immediately clear previous account data to prevent stale display on account switch (Requirement B.6)
    setDossierData(null);
    setIsLoading(true);
    setErrorMessage(null);
    setIsNotFound(false);

    let isMounted = true;

    async function loadDossier() {
      try {
        const data = await fetchDossierJson(accountId);
        if (isMounted) {
          setDossierData(data);
        }
      } catch (err: any) {
        if (!isMounted) return;
        if (err.status === 404) {
          setIsNotFound(true);
          setErrorMessage(err.message || `Account '${accountId}' not found in database.`);
        } else {
          setErrorMessage(err.message || 'An unexpected error occurred while fetching the evidence dossier.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDossier();

    return () => {
      isMounted = false;
    };
  }, [isOpen, accountId]);

  if (!isOpen) return null;

  const handleDownloadPdf = () => {
    if (!accountId) return;
    window.open(`${API_BASE_URL}/reports/download-pdf/${encodeURIComponent(accountId)}`, '_blank');
  };

  const handleCopyJson = () => {
    if (!dossierData) return;
    navigator.clipboard.writeText(JSON.stringify(dossierData, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-sm">Official Investigation Evidence Dossier</h3>
              <p className="text-[11px] text-slate-400">
                {dossierData ? (
                  <span>
                    Target: <strong className="text-white">{dossierData.target_account.account_number_masked}</strong> ({dossierData.target_account.bank_name}) | Report Ref: <span className="text-slate-300 font-mono">{dossierData.dossier_metadata.report_id}</span>
                  </span>
                ) : (
                  <span>Target Account Identifier: <span className="font-mono text-slate-300">{accountId}</span></span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center justify-between px-6 pt-3 border-b border-slate-200 bg-slate-50 flex-shrink-0">
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
              disabled={isLoading || isNotFound || !dossierData}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition ${
                isLoading || isNotFound || !dossierData
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Loading State */}
          {isLoading && (
            <div className="py-16 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-xs font-medium text-slate-600">
                Fetching dynamic evidence dossier from backend for account <span className="font-mono">{accountId}</span>...
              </p>
            </div>
          )}

          {/* HTTP 404 / Missing Account State */}
          {!isLoading && isNotFound && (
            <div className="py-12 px-6 flex flex-col items-center text-center space-y-3 bg-red-50/60 rounded-xl border border-red-200">
              <ShieldAlert className="w-12 h-12 text-red-500" />
              <h4 className="text-base font-bold text-red-900">HTTP 404 — Account Not Found</h4>
              <p className="text-xs text-red-700 max-w-lg leading-relaxed">
                {errorMessage}
              </p>
              <div className="p-3 bg-white/80 rounded-lg border border-red-200 text-[11px] text-slate-600 max-w-lg">
                <strong>Compliance Guarantee:</strong> FraudTrace AI strictly refuses to fabricate identities, fund flows, or evidence dossiers for nonexistent accounts.
              </div>
            </div>
          )}

          {/* General Error State */}
          {!isLoading && errorMessage && !isNotFound && (
            <div className="py-12 px-6 flex flex-col items-center text-center space-y-3 bg-amber-50 rounded-xl border border-amber-200">
              <AlertCircle className="w-10 h-10 text-amber-600" />
              <h4 className="text-sm font-bold text-amber-900">Failed to Retrieve Dossier</h4>
              <p className="text-xs text-amber-700 max-w-md">{errorMessage}</p>
            </div>
          )}

          {/* Successful Real Dossier State */}
          {!isLoading && dossierData && (
            <>
              {activeTab === 'summary' ? (
                <div className="space-y-4 text-xs">
                  {/* Risk Summary Card */}
                  <div className={`p-4 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    dossierData.risk_assessment.risk_score >= 70
                      ? 'bg-red-50/80 border-red-200 text-red-900'
                      : dossierData.risk_assessment.risk_score >= 40
                      ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                      : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                  }`}>
                    <div>
                      <div className="font-bold text-sm">
                        Risk Tier: {dossierData.risk_assessment.risk_tier.toUpperCase()} (Score: {dossierData.risk_assessment.risk_score}/100)
                      </div>
                      <div className="text-[11px] mt-1 leading-relaxed opacity-90">
                        {dossierData.investigative_conclusions.rationale}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded shadow-xs ${
                        dossierData.risk_assessment.risk_score >= 70
                          ? 'bg-red-600 text-white'
                          : dossierData.risk_assessment.risk_score >= 40
                          ? 'bg-amber-600 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}>
                        {dossierData.investigative_conclusions.recommended_action}
                      </span>
                    </div>
                  </div>

                  {/* Account Profile Verification */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">Account Number</span>
                      <p className="font-bold text-slate-800 text-xs mt-0.5">{dossierData.target_account.account_number_masked}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">Account Holder</span>
                      <p className="font-bold text-slate-800 text-xs mt-0.5">{dossierData.target_account.account_holder_name}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">Bank / Institution</span>
                      <p className="font-bold text-slate-800 text-xs mt-0.5">{dossierData.target_account.bank_name}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">Registered Mobile</span>
                      <p className="font-bold text-slate-800 text-xs mt-0.5">{dossierData.target_account.registered_mobile}</p>
                    </div>
                  </div>

                  {/* Fund Flow Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs">
                      <div className="text-slate-500 font-semibold text-[11px]">Total Turnover</div>
                      <div className="text-base font-bold text-slate-900 mt-0.5">
                        {dossierData.transaction_flow_analysis.incoming_total_formatted}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {dossierData.transaction_flow_analysis.incoming_count} incoming credits
                      </div>
                    </div>
                    <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs">
                      <div className="text-slate-500 font-semibold text-[11px]">Forwarded Layering</div>
                      <div className="text-base font-bold text-slate-900 mt-0.5">
                        {dossierData.transaction_flow_analysis.layering_total_formatted}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {dossierData.transaction_flow_analysis.layering_count} rapid transfers ({dossierData.transaction_flow_analysis.retained_percentage}% retained)
                      </div>
                    </div>
                    <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs">
                      <div className="text-slate-500 font-semibold text-[11px]">Linked NCRP Complaints</div>
                      <div className="text-base font-bold text-slate-900 mt-0.5">
                        {dossierData.linked_cybercrime_complaints.length} Reported Cases
                      </div>
                      <div className="text-[10px] text-emerald-600 font-semibold">
                        {dossierData.linked_cybercrime_complaints.filter(c => c.status === 'Verified').length} Verified by Cyber Cell
                      </div>
                    </div>
                  </div>

                  {/* Contributing Risk Factors */}
                  <div>
                    <h4 className="font-bold text-slate-900 mb-2 flex items-center space-x-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Contributing Risk Indicators</span>
                    </h4>
                    {dossierData.risk_assessment.top_contributing_factors.length > 0 ? (
                      <div className="space-y-2">
                        {dossierData.risk_assessment.top_contributing_factors.map((factor) => {
                          const hasRows = factor.evidence_rows && factor.evidence_rows.length > 0;
                          const isExpanded = expandedFactor === factor.indicator_id;

                          return (
                            <div key={factor.indicator_id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-bold text-slate-800 flex items-center space-x-1.5">
                                    <span className="font-mono text-xs text-blue-700 bg-blue-100/60 px-1.5 py-0.2 rounded font-semibold">
                                      {factor.indicator_id}
                                    </span>
                                    <span>{factor.name}</span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 mt-0.5">{factor.summary}</div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                                    {factor.points_awarded}/{factor.max_points} pts
                                  </span>
                                  <div className="text-[10px] text-slate-400 mt-0.5">{factor.percentage_impact}% impact</div>
                                </div>
                              </div>

                              {hasRows && (
                                <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                                  <button
                                    onClick={() => setExpandedFactor(isExpanded ? null : factor.indicator_id)}
                                    className="text-[10px] font-bold text-blue-600 hover:text-blue-800 transition flex items-center space-x-1"
                                  >
                                    <span>{isExpanded ? 'Hide Evidence Records ▲' : `Inspect ${factor.evidence_rows!.length} Evidence Rows ▼`}</span>
                                  </button>
                                  <span className="text-[10px] text-slate-400">
                                    Verified DB records
                                  </span>
                                </div>
                              )}

                              {isExpanded && hasRows && (
                                <div className="mt-2 bg-white rounded border border-slate-200 p-2 overflow-x-auto">
                                  <table className="w-full text-left font-mono text-[10px]">
                                    <thead>
                                      <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase">
                                        {Object.keys(factor.evidence_rows![0]).map((col) => (
                                          <th key={col} className="py-1 px-1.5 whitespace-nowrap">
                                            {col.replace(/_/g, ' ')}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {factor.evidence_rows!.map((row, rIdx) => (
                                        <tr key={rIdx} className="hover:bg-slate-50">
                                          {Object.entries(row).map(([k, val], cIdx) => (
                                            <td key={cIdx} className="py-1 px-1.5 whitespace-nowrap text-slate-700">
                                              {typeof val === 'number' && (k.includes('amount') || k.includes('turnover') || k.includes('loss'))
                                                ? `₹${val.toLocaleString('en-IN')}`
                                                : Array.isArray(val)
                                                ? val.join(', ')
                                                : String(val ?? '')}
                                            </td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-slate-500 text-xs italic">No abnormal risk indicators identified for this account.</p>
                    )}
                  </div>

                  {/* Linked Cybercrime Complaints List */}
                  {dossierData.linked_cybercrime_complaints.length > 0 && (
                    <div>
                      <h4 className="font-bold text-slate-900 mb-2">Correlated Cybercrime Incidents</h4>
                      <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 text-[10px] uppercase">
                            <tr>
                              <th className="py-2 px-3">Complaint ID</th>
                              <th className="py-2 px-3">Type</th>
                              <th className="py-2 px-3">Reported Loss</th>
                              <th className="py-2 px-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 bg-white">
                            {dossierData.linked_cybercrime_complaints.map((comp) => (
                              <tr key={comp.complaint_id} className="hover:bg-slate-50">
                                <td className="py-2 px-3 font-mono font-semibold text-slate-800">{comp.complaint_id}</td>
                                <td className="py-2 px-3 text-slate-700">{comp.complaint_type}</td>
                                <td className="py-2 px-3 text-slate-700">{comp.reported_loss_formatted}</td>
                                <td className="py-2 px-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                    comp.status === 'Verified'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {comp.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Statutory Notice */}
                  <div className="p-3 bg-slate-100 rounded-lg text-[10px] text-slate-500 border border-slate-200 leading-relaxed">
                    <strong>{dossierData.dossier_metadata.classification}:</strong> {dossierData.dossier_metadata.synthetic_notice}
                  </div>
                </div>
              ) : (
                /* JSON Tab */
                <div className="relative">
                  <button
                    onClick={handleCopyJson}
                    className="absolute top-2 right-2 flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[11px] transition font-medium z-10"
                  >
                    {isCopied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                  <pre className="bg-slate-900 text-slate-200 p-4 rounded-lg text-[11px] font-mono overflow-x-auto leading-relaxed max-h-[50vh]">
                    {JSON.stringify(dossierData, null, 2)}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            Close
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={isLoading || isNotFound || !dossierData}
            className={`px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition flex items-center space-x-1.5 ${
              isLoading || isNotFound || !dossierData
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Official Dossier (PDF)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

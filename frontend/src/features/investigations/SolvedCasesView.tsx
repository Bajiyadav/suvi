'use client';

import React, { useState, useEffect } from 'react';
import { SolvedCase } from '@/types';
import { fetchSolvedCases, createSolvedCase } from '@/lib/api';
import {
  ShieldCheck,
  Award,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Building2,
  CreditCard,
  Phone,
  MapPin,
  User,
  ArrowRight,
  TrendingDown,
  Layers,
  FileText,
  Clock,
  Eye,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Database,
  Lock,
  Globe,
  RefreshCw,
  X,
  Share2
} from 'lucide-react';

interface SolvedCasesViewProps {
  onSelectAccount: (accountId: string) => void;
  onOpenDossier: (accountId: string) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const SolvedCasesView: React.FC<SolvedCasesViewProps> = ({
  onSelectAccount,
  onOpenDossier,
  onNavigateToTab,
}) => {
  const [cases, setCases] = useState<SolvedCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedCaseModal, setSelectedCaseModal] = useState<SolvedCase | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeTabSection, setActiveTabSection] = useState<'cases' | 'inter-agency'>('cases');

  // Form State for Add New Solved Case
  const [formData, setFormData] = useState({
    fir_number: '',
    police_station: 'Cyber Crime Police Station (CCSU), Patna',
    district: 'Patna',
    state: 'Bihar',
    investigating_officer: 'Inspector Cyber Cell',
    crime_category: 'UPI Phishing & Fast Layering',
    total_fraud_amount: 1500000,
    recovered_amount: 1250000,
    date_solved: new Date().toISOString().split('T')[0],
    case_status: 'Charge-sheeted',
    accused_name: '',
    father_name: '',
    age: 26,
    address: '',
    mobile_number: '',
    alternate_mobile: '',
    id_proof: '',
    bank_name: 'State Bank of India',
    account_number: '',
    ifsc_code: 'SBIN0001234',
    branch_name: 'Main Branch',
    bank_registered_mobile: '',
    upi_id: '',
    layering_speed_minutes: 4,
    layering_route: 'Layer 1: Victim to entry mule -> Layer 2: Rapid split across 5 accounts in 3 mins -> Layer 3: Cash withdrawal',
    modus_operandi: '',
    breakthrough_trail: '',
    seized_items: 'Android phones, pre-activated SIM cards, ATM debit cards, cash',
    national_portal_ref: 'NCRP-ACK-2026-BIH-REF',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formFeedback, setFormFeedback] = useState<string | null>(null);

  const loadCases = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchSolvedCases(
        selectedCategory === 'ALL' ? undefined : selectedCategory,
        searchQuery.trim() || undefined
      );
      setCases(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load solved case stories.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadCases();
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fir_number || !formData.accused_name || !formData.account_number || !formData.mobile_number) {
      setFormFeedback('Please fill in all required official fields.');
      return;
    }

    setIsSubmitting(true);
    setFormFeedback(null);
    try {
      await createSolvedCase({
        ...formData,
        total_fraud_amount: Number(formData.total_fraud_amount),
        recovered_amount: Number(formData.recovered_amount),
        age: Number(formData.age),
        layering_speed_minutes: Number(formData.layering_speed_minutes),
      });
      setIsAddModalOpen(false);
      setFormFeedback('Case successfully registered in police database.');
      await loadCases();
    } catch (err: any) {
      setFormFeedback(err.message || 'Failed to submit solved case.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalFraud = cases.reduce((acc, c) => acc + (c.total_fraud_amount || 0), 0);
  const totalRecovered = cases.reduce((acc, c) => acc + (c.recovered_amount || 0), 0);
  const recoveryRate = totalFraud > 0 ? Math.round((totalRecovered / totalFraud) * 100) : 0;

  const categories = [
    'ALL',
    'Electricity Bill Disconnection APK Phishing',
    'Telegram Part-Time Task & Crypto Investment Scam',
    'Instant Loan App Blackmail & Mule Syndicate',
    'UPI Phishing & Fast Layering',
    'Digital Arrest Impersonation',
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 text-white rounded-2xl p-6 shadow-xl border border-blue-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-blue-500/20 text-blue-300 text-xs font-semibold px-3 py-1 rounded-full border border-blue-400/30">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>OFFICIAL POLICE INVESTIGATION SUCCESS REPOSITORY</span>
              <span className="text-blue-400">•</span>
              <span>BIHAR CYBER POLICE & I4C ECOSYSTEM</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Solved Cyber Crime Case Stories & Mule Ring Busts
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Judicial records, verified accused profiles, bank accounts, fast-layering routes, and fund recovery memos from real-world cyber fraud investigations. Directly integrated with National Cybercrime Reporting Portal (1930) and CCTNS.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-sm shadow-md transition transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Log Solved Case Dossier</span>
            </button>
            <button
              onClick={loadCases}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition border border-white/10"
              title="Refresh repository"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Aggregate Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-xs text-slate-400 font-medium">Solved Cases Recorded</div>
            <div className="text-2xl font-bold text-white mt-1">{cases.length} Rings Busted</div>
            <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3" /> 100% Judicial Verification
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-xs text-slate-400 font-medium">Total Fraud Intercepted</div>
            <div className="text-2xl font-bold text-amber-300 mt-1">₹{(totalFraud / 100000).toFixed(2)} Lakhs</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Across multi-state mule chains</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-xs text-slate-400 font-medium">Citizen Funds Recovered / Frozen</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">₹{(totalRecovered / 100000).toFixed(2)} Lakhs</div>
            <div className="text-[11px] text-emerald-300 mt-0.5 font-semibold">
              {recoveryRate}% Recovery Rate (Golden Hour)
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-xs text-slate-400 font-medium">Inter-Agency Data Sync</div>
            <div className="text-2xl font-bold text-blue-300 mt-1">Active</div>
            <div className="text-[11px] text-blue-200 mt-0.5">NCRP 1930 • TAFCOP • CCTNS</div>
          </div>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl p-1.5 shadow-sm">
        <button
          onClick={() => setActiveTabSection('cases')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition ${
            activeTabSection === 'cases'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Solved Case Dossiers & Accused Profiles ({cases.length})</span>
        </button>
        <button
          onClick={() => setActiveTabSection('inter-agency')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition ${
            activeTabSection === 'inter-agency'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>National & State Ecosystem Integration Hub</span>
        </button>
      </div>

      {activeTabSection === 'cases' ? (
        <>
          {/* Search & Category Filter Controls */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by accused name, mobile, bank account, FIR No, or police station..."
                className="w-full pl-10 pr-24 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md transition"
              >
                Search
              </button>
            </form>

            <div className="flex items-center space-x-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="flex space-x-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                      selectedCategory === cat
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat === 'ALL' ? 'All Crime Categories' : cat.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cases List */}
          {isLoading ? (
            <div className="bg-white rounded-xl p-12 border border-slate-200 text-center shadow-sm">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-slate-600 font-medium">Loading official police solved case stories...</p>
            </div>
          ) : cases.length === 0 ? (
            <div className="bg-white rounded-xl p-12 border border-slate-200 text-center shadow-sm">
              <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-800">No solved cases found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                No police cases matched your search query. Try resetting filters or log a new solved case dossier using the button above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {cases.map((c) => {
                const recoveryPct = c.total_fraud_amount > 0
                  ? Math.round((c.recovered_amount / c.total_fraud_amount) * 100)
                  : 0;

                return (
                  <div
                    key={c.case_id}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition overflow-hidden"
                  >
                    {/* Card Header */}
                    <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            {c.state} Police • {c.police_station}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {c.fir_number}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {c.case_status}
                          </span>
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 mt-1.5 flex items-center gap-2">
                          {c.crime_category}
                        </h2>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-[11px] text-slate-400 uppercase font-semibold">Date Solved</div>
                          <div className="text-xs font-semibold text-slate-700">{c.date_solved}</div>
                        </div>
                        <button
                          onClick={() => setSelectedCaseModal(c)}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Full Police Dossier</span>
                        </button>
                      </div>
                    </div>

                    {/* Card Content Grid */}
                    <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Left: Accused Profile */}
                      <div className="lg:col-span-4 bg-slate-50/60 p-4 rounded-xl border border-slate-100 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                            <User className="w-3.5 h-3.5 text-blue-600" />
                            <span>Accused / Mule Operator</span>
                          </div>
                          <span className="text-[11px] font-semibold px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                            Age {c.age || 'N/A'}
                          </span>
                        </div>

                        <div>
                          <div className="text-sm font-bold text-slate-900">{c.accused_name}</div>
                          {c.father_name && (
                            <div className="text-xs text-slate-500 font-medium">S/O {c.father_name}</div>
                          )}
                        </div>

                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-start space-x-2 text-slate-600">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span className="leading-snug">{c.address}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-slate-600">
                            <Phone className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span className="font-mono font-semibold text-rose-600">{c.mobile_number}</span>
                            {c.alternate_mobile && (
                              <span className="text-[11px] text-slate-400">({c.alternate_mobile})</span>
                            )}
                          </div>
                          {c.id_proof && (
                            <div className="flex items-center space-x-2 text-slate-600">
                              <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="font-mono text-[11px] text-slate-500">{c.id_proof}</span>
                            </div>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 flex justify-between">
                          <span>Investigating Officer:</span>
                          <span className="font-semibold text-slate-700">{c.investigating_officer}</span>
                        </div>
                      </div>

                      {/* Middle: Bank & Fast-Layering Footprint */}
                      <div className="lg:col-span-5 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                            <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Mule Banking & Fast-Layering Footprint</span>
                          </div>
                          <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                            {c.layering_speed_minutes} min velocity
                          </span>
                        </div>

                        <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100 space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-xs text-slate-500 font-medium">Primary Mule Account</span>
                              <div className="text-sm font-bold text-slate-900 font-mono">
                                {c.bank_name} • {c.account_number}
                              </div>
                            </div>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => onSelectAccount(c.account_number)}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded shadow-sm transition"
                                title="Investigate this account in transaction analysis & network graph"
                              >
                                Trace Money Trail
                              </button>
                              <button
                                onClick={() => onOpenDossier(c.account_number)}
                                className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-semibold rounded transition"
                                title="Open full investigator dossier"
                              >
                                Dossier
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-emerald-100/60">
                            <div>
                              <span className="text-[11px] text-slate-400">Bank Registered Mobile:</span>
                              <div className="font-mono font-semibold text-slate-700">{c.bank_registered_mobile}</div>
                            </div>
                            <div>
                              <span className="text-[11px] text-slate-400">UPI VPA:</span>
                              <div className="font-mono font-semibold text-slate-700 truncate">{c.upi_id || 'N/A'}</div>
                            </div>
                          </div>
                        </div>

                        {/* Layering Route */}
                        <div>
                          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                            <Layers className="w-3 h-3 text-indigo-500" />
                            <span>Layering Route Identified by Police</span>
                          </div>
                          <div className="text-xs font-mono bg-slate-900 text-slate-200 p-2.5 rounded-lg leading-relaxed border border-slate-800">
                            {c.layering_route}
                          </div>
                        </div>
                      </div>

                      {/* Right: Recovery & Action Highlights */}
                      <div className="lg:col-span-3 space-y-3 bg-gradient-to-b from-slate-50 to-white p-4 rounded-xl border border-slate-200/80">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-2">
                          Recovery & Enforcement
                        </div>

                        <div>
                          <div className="flex justify-between items-baseline mb-1">
                            <span className="text-xs text-slate-500 font-medium">Fund Recovery:</span>
                            <span className="text-xs font-bold text-emerald-600">{recoveryPct}%</span>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(recoveryPct, 100)}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[11px] mt-1.5 font-medium">
                            <span className="text-slate-500">Defrauded: ₹{(c.total_fraud_amount / 100000).toFixed(2)}L</span>
                            <span className="text-emerald-700 font-bold">Frozen: ₹{(c.recovered_amount / 100000).toFixed(2)}L</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 text-xs">
                          <span className="text-[11px] text-slate-400 uppercase font-bold">National Ref:</span>
                          <div className="font-mono text-[11px] text-blue-600 font-semibold truncate mt-0.5">
                            {c.national_portal_ref || 'NCRP-I4C-VERIFIED'}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100">
                          <span className="text-[11px] text-slate-400 uppercase font-bold block mb-1">Seizure Memo:</span>
                          <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                            {c.seized_items || 'Devices, SIMs, and bank passbooks attached.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* National & State Ecosystem Integration Hub Section */
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-600" />
                  <span>Indian Inter-Agency Cybercrime Ecosystem Integration</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                  How FraudTrace AI integrates real-time state and central portals to stop mule account layering during the 30-minute "Golden Hour" across law enforcement agencies and banking networks.
                </p>
              </div>
              <div className="inline-flex items-center px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping mr-2" />
                Live Hub Synchronized
              </div>
            </div>

            {/* Architectural Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-3">
              {/* Connector 1: NCRP / 1930 */}
              <div className="border border-slate-200 rounded-xl p-5 hover:border-blue-400 transition bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    1930
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Active REST Sync
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">NCRP / I4C (MHA)</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Citizen Financial Cyber Fraud Reporting System (CFCFRMS).
                  </p>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-200">
                  <div className="flex justify-between">
                    <span>Incident Pull Latency:</span>
                    <span className="font-mono font-semibold text-blue-600">&lt; 15 seconds</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Golden Hour Freeze:</span>
                    <span className="font-semibold text-emerald-600">Automated Webhook</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bank Nodal API:</span>
                    <span className="font-semibold text-slate-700">Sec 102/106 BNSS Notice</span>
                  </div>
                </div>
              </div>

              {/* Connector 2: DoT TAFCOP & CEIR */}
              <div className="border border-slate-200 rounded-xl p-5 hover:border-blue-400 transition bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                    DoT
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Connected
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">TAFCOP & CEIR (DoT)</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Telecom Analytics for Fraud Management & Device Blacklisting.
                  </p>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-200">
                  <div className="flex justify-between">
                    <span>Bulk SIM Detection:</span>
                    <span className="font-semibold text-purple-600">&gt; 9 SIMs on 1 Aadhaar</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IMEI Device Lock:</span>
                    <span className="font-semibold text-slate-700">Central Register Push</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SIM Swap Alert:</span>
                    <span className="font-semibold text-amber-600">24-hour cooling trigger</span>
                  </div>
                </div>
              </div>

              {/* Connector 3: CCTNS */}
              <div className="border border-slate-200 rounded-xl p-5 hover:border-blue-400 transition bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                    CCTNS
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Inter-State Sync
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">CCTNS Police Database</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Crime & Criminal Tracking Network across all Cyber Thanas.
                  </p>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-200">
                  <div className="flex justify-between">
                    <span>FIR Triangulation:</span>
                    <span className="font-semibold text-slate-700">Auto-matches Repeat Mules</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Arrest Memo Sharing:</span>
                    <span className="font-semibold text-blue-600">Bihar & Neighboring States</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Chargesheet Repository:</span>
                    <span className="font-semibold text-slate-700">Section 66D IT Act</span>
                  </div>
                </div>
              </div>

              {/* Connector 4: NPCI & UPI Switch */}
              <div className="border border-slate-200 rounded-xl p-5 hover:border-blue-400 transition bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    NPCI
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    UPI Switch Link
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">NPCI / IMPS Switch</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Real-time payment rails and rapid debit freeze dispatch.
                  </p>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-200">
                  <div className="flex justify-between">
                    <span>Pass-Through Velocity:</span>
                    <span className="font-semibold text-rose-600">Auto-lien in &lt; 3 mins</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VPA Risk Tagging:</span>
                    <span className="font-semibold text-slate-700">Broadcast to all PSP apps</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ATM Terminal Geofence:</span>
                    <span className="font-semibold text-slate-700">Border district limits</span>
                  </div>
                </div>
              </div>

              {/* Connector 5: FIU-IND */}
              <div className="border border-slate-200 rounded-xl p-5 hover:border-blue-400 transition bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-xs">
                    FIU
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    FINnet 2.0
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">FIU-IND (Ministry of Finance)</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Financial Intelligence Unit Suspicious Transaction Reporting.
                  </p>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-200">
                  <div className="flex justify-between">
                    <span>Automated STR Filing:</span>
                    <span className="font-semibold text-slate-700">Under PMLA Section 12</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Crypto VASP Reporting:</span>
                    <span className="font-semibold text-rose-600">P2P OTC Wallet Trace</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shell Entity Screening:</span>
                    <span className="font-semibold text-slate-700">MCA-21 Cross-verification</span>
                  </div>
                </div>
              </div>

              {/* Connector 6: State Cyber Command (CCSU) */}
              <div className="border border-slate-200 rounded-xl p-5 hover:border-blue-400 transition bg-blue-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    CCSU
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    Local Node (Bihar)
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Bihar Police Cyber Command</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Dedicated district Cyber Thanas across 44 Bihar police districts.
                  </p>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-200">
                  <div className="flex justify-between">
                    <span>Raids & Transit Remand:</span>
                    <span className="font-semibold text-emerald-600">Real-time IO Dispatch</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Court Section 91 Notices:</span>
                    <span className="font-semibold text-slate-700">Auto-filled PDF Dossiers</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mule Rehabilitation:</span>
                    <span className="font-semibold text-slate-700">Account de-linking protocol</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Strategic Workflow: How We Stop These Frauds */}
            <div className="mt-6 p-5 bg-slate-900 text-white rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>End-to-End Interception Protocol: From Citizen Complaint to Mule Ring Bust</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700 space-y-1.5">
                  <div className="font-bold text-amber-300">Stage 1: Golden Hour Trigger (0-15 Min)</div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    Citizen dials 1930 / logs on NCRP. Ticket ingested into FraudTrace AI. Transaction reference mapped to beneficiary bank account ACC-4321 within seconds.
                  </p>
                </div>
                <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700 space-y-1.5">
                  <div className="font-bold text-blue-300">Stage 2: Graph Layering Traversal (15-20 Min)</div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    Platform traverses multi-hop transaction graph. Detects splitting across Layer 2 accounts. Telemetry from TAFCOP reveals 14 SIMs registered on suspect KYC.
                  </p>
                </div>
                <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700 space-y-1.5">
                  <div className="font-bold text-emerald-300">Stage 3: Multi-Bank Rapid Lien (20-30 Min)</div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    Investigator generates Section 106 BNSS / 102 CrPC freeze notices via one click. Bank nodal officers place debit freezes before ATM cash withdrawal or crypto off-ramp.
                  </p>
                </div>
                <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700 space-y-1.5">
                  <div className="font-bold text-purple-300">Stage 4: Physical Raid & Judicial Record</div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    Cyber Crime Thana raids operator hideout based on CDR/IP geolocation. Seizure memo recorded, chargesheet filed in CCTNS, and solved case dossier archived.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Solved Case Details Modal */}
      {selectedCaseModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 rounded-t-2xl flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-blue-300 font-semibold">{selectedCaseModal.police_station}</div>
                  <h2 className="text-base font-bold text-white">{selectedCaseModal.fir_number}</h2>
                </div>
              </div>
              <button
                onClick={() => setSelectedCaseModal(null)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-sm">
              {/* Crime & Status Banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl">
                <div>
                  <span className="text-[11px] text-slate-500 font-bold uppercase">Crime Classification</span>
                  <div className="text-sm font-bold text-slate-900">{selectedCaseModal.crime_category}</div>
                </div>
                <div className="flex gap-2">
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                    {selectedCaseModal.case_status}
                  </span>
                  <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full font-mono">
                    Solved: {selectedCaseModal.date_solved}
                  </span>
                </div>
              </div>

              {/* Accused Detailed Records */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-600" />
                  <span>Official Accused & Mule Operator Record</span>
                </h3>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400">Accused Full Name:</span>
                    <div className="font-bold text-slate-900 text-sm">{selectedCaseModal.accused_name}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Father's Name & Age:</span>
                    <div className="font-semibold text-slate-800">{selectedCaseModal.father_name || 'N/A'} (Age {selectedCaseModal.age || 'N/A'})</div>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-slate-400">Residential Address:</span>
                    <div className="font-medium text-slate-800 mt-0.5">{selectedCaseModal.address}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Crime Mobile Number:</span>
                    <div className="font-mono font-bold text-rose-600">{selectedCaseModal.mobile_number}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Alternate Mobile:</span>
                    <div className="font-mono font-semibold text-slate-700">{selectedCaseModal.alternate_mobile || 'None'}</div>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-slate-400">Identity Proof (Aadhaar/PAN):</span>
                    <div className="font-mono text-slate-700">{selectedCaseModal.id_proof || 'Forged Student KYC'}</div>
                  </div>
                </div>
              </div>

              {/* Bank & Fast-Layering Route */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span>Primary Bank Account & Layering Route</span>
                </h3>
                <div className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-100 space-y-3 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <span className="text-slate-400">Bank Name & Branch:</span>
                      <div className="font-bold text-slate-900">{selectedCaseModal.bank_name} ({selectedCaseModal.branch_name || 'Main'})</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Account Number:</span>
                      <div className="font-mono font-bold text-blue-600">{selectedCaseModal.account_number}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Bank Registered Mobile:</span>
                      <div className="font-mono font-bold text-slate-800">{selectedCaseModal.bank_registered_mobile}</div>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-1">Layering Route Detected by FraudTrace AI:</span>
                    <div className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-[11px] leading-relaxed">
                      {selectedCaseModal.layering_route}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modus Operandi & Police Breakthrough */}
              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Modus Operandi</span>
                  <p className="text-slate-600 leading-relaxed">{selectedCaseModal.modus_operandi}</p>
                </div>
                <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 space-y-1">
                  <span className="font-bold text-blue-800 uppercase tracking-wider text-[11px]">Police Breakthrough & Money Trail Interception</span>
                  <p className="text-slate-700 leading-relaxed">{selectedCaseModal.breakthrough_trail}</p>
                </div>
                <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-100 space-y-1">
                  <span className="font-bold text-amber-800 uppercase tracking-wider text-[11px]">Items Seized & Material Evidence Memo</span>
                  <p className="text-slate-700 leading-relaxed">{selectedCaseModal.seized_items || 'Devices, SIMs and Passbooks seized under Panchnama.'}</p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 rounded-b-2xl border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-500 font-mono">
                Investigating Officer: <span className="font-semibold text-slate-800">{selectedCaseModal.investigating_officer}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onSelectAccount(selectedCaseModal.account_number);
                    setSelectedCaseModal(null);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                >
                  Analyze Account in Platform
                </button>
                <button
                  onClick={() => setSelectedCaseModal(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Solved Case Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="bg-slate-900 text-white p-5 rounded-t-2xl flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-bold text-white">Log Official Solved Case Record</h2>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-5 text-xs">
              {formFeedback && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 font-medium">
                  {formFeedback}
                </div>
              )}

              {/* Section 1: Police & FIR Details */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
                  1. Police Station & FIR Jurisdictional Information
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">FIR Number & Law Sections *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. FIR No. 112/2026 u/s 420/120B IPC"
                      value={formData.fir_number}
                      onChange={(e) => setFormData({ ...formData, fir_number: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Police Station *</label>
                    <input
                      type="text"
                      required
                      value={formData.police_station}
                      onChange={(e) => setFormData({ ...formData, police_station: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">District & State</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={formData.district}
                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-lg"
                      />
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Investigating Officer (IO)</label>
                    <input
                      type="text"
                      value={formData.investigating_officer}
                      onChange={(e) => setFormData({ ...formData, investigating_officer: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Crime Category</label>
                    <input
                      type="text"
                      value={formData.crime_category}
                      onChange={(e) => setFormData({ ...formData, crime_category: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Case Status</label>
                    <select
                      value={formData.case_status}
                      onChange={(e) => setFormData({ ...formData, case_status: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="Charge-sheeted">Charge-sheeted</option>
                      <option value="Convicted">Convicted</option>
                      <option value="Under Trial">Under Trial</option>
                      <option value="Funds Frozen u/s 102/106 BNSS">Funds Frozen u/s 102/106 BNSS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Total Fraud Amount (₹)</label>
                    <input
                      type="number"
                      value={formData.total_fraud_amount}
                      onChange={(e) => setFormData({ ...formData, total_fraud_amount: Number(e.target.value) })}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Recovered / Frozen Amount (₹)</label>
                    <input
                      type="number"
                      value={formData.recovered_amount}
                      onChange={(e) => setFormData({ ...formData, recovered_amount: Number(e.target.value) })}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Accused Profile */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
                  2. Accused / Mule Operative Profile
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Accused Legal Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Kumar @ Sonu"
                      value={formData.accused_name}
                      onChange={(e) => setFormData({ ...formData, accused_name: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Father's Name & Age</label>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Father's name"
                        value={formData.father_name}
                        onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                        className="col-span-2 p-2 border border-slate-300 rounded-lg"
                      />
                      <input
                        type="number"
                        placeholder="Age"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                        className="p-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-slate-600 font-medium mb-1">Full Postal Address & PS *</label>
                    <input
                      type="text"
                      required
                      placeholder="Village/Town, Police Station, District, State, PIN"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Crime Mobile Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="+91-XXXXX-XXXXX"
                      value={formData.mobile_number}
                      onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Alternate Mobile / Handset IMEI</label>
                    <input
                      type="text"
                      placeholder="Alternate phone or IMEI"
                      value={formData.alternate_mobile}
                      onChange={(e) => setFormData({ ...formData, alternate_mobile: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Bank & Fast Layering */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
                  3. Bank Account & Fast-Layering Route
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Bank Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.bank_name}
                      onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Account Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ACC-4321 or bank account number"
                      value={formData.account_number}
                      onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Bank Registered Mobile *</label>
                    <input
                      type="text"
                      required
                      value={formData.bank_registered_mobile}
                      onChange={(e) => setFormData({ ...formData, bank_registered_mobile: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Layering Velocity (Minutes)</label>
                    <input
                      type="number"
                      value={formData.layering_speed_minutes}
                      onChange={(e) => setFormData({ ...formData, layering_speed_minutes: Number(e.target.value) })}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-slate-600 font-medium mb-1">Layering Route Path *</label>
                    <textarea
                      rows={2}
                      required
                      value={formData.layering_route}
                      onChange={(e) => setFormData({ ...formData, layering_route: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Narrative & Seizure */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
                  4. Modus Operandi & Breakthrough Narrative
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Modus Operandi</label>
                  <textarea
                    rows={2}
                    placeholder="How the victim was trapped..."
                    value={formData.modus_operandi}
                    onChange={(e) => setFormData({ ...formData, modus_operandi: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Police Breakthrough & Trace Method</label>
                  <textarea
                    rows={2}
                    placeholder="How 1930/FraudTrace AI helped identify and freeze..."
                    value={formData.breakthrough_trail}
                    onChange={(e) => setFormData({ ...formData, breakthrough_trail: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Seizure Memo</label>
                  <input
                    type="text"
                    value={formData.seized_items}
                    onChange={(e) => setFormData({ ...formData, seized_items: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering...' : 'Save Solved Case to Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

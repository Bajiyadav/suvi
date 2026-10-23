'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { KpiRow } from '@/features/overview/KpiRow';
import { RiskyAccountsTable } from '@/features/overview/RiskyAccountsTable';
import { NetworkGraphCanvas } from '@/features/overview/NetworkGraphCanvas';
import { TransactionFlowCard } from '@/features/overview/TransactionFlowCard';
import { TransactionTimelineCard } from '@/features/overview/TransactionTimelineCard';
import { RiskExplanationGauge } from '@/features/overview/RiskExplanationGauge';
import { LinkedComplaintsTable } from '@/features/overview/LinkedComplaintsTable';
import { AssociatedEntitiesTable } from '@/features/overview/AssociatedEntitiesTable';
import { InvestigationActions } from '@/features/overview/InvestigationActions';
import { RoadmapFooter } from '@/features/overview/RoadmapFooter';
import { DossierModal } from '@/components/DossierModal';

// Dedicated Tab Views
import { AccountsView } from '@/features/accounts/AccountsView';
import { TransactionsView } from '@/features/transactions/TransactionsView';
import { NetworkInvestigationView } from '@/features/network-graph/NetworkInvestigationView';
import { ComplaintsView } from '@/features/complaints/ComplaintsView';
import { EntitySearchView } from '@/features/investigations/EntitySearchView';
import { ReportsView } from '@/features/reports/ReportsView';
import { WatchlistView } from '@/features/investigations/WatchlistView';
import { SolvedCasesView } from '@/features/investigations/SolvedCasesView';
import { DataManagementView } from '@/features/overview/DataManagementView';
import { SettingsView } from '@/features/overview/SettingsView';
import { HelpDocumentationView } from '@/features/overview/HelpDocumentationView';
import { AICopilotDrawer } from '@/features/copilot/AICopilotDrawer';

import {
  fetchDashboardData,
  getEmptyDashboardData,
  fetchWatchlist,
  addToWatchlist,
  API_BASE_URL
} from '@/lib/api';
import { DashboardData, WatchlistEntry } from '@/types';
import { CheckCircle2, AlertTriangle, Info, X, Bot } from 'lucide-react';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedAccountId, setSelectedAccountId] = useState('ACC-4321');
  const [data, setData] = useState<DashboardData>(getEmptyDashboardData('ACC-4321'));
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmittingWatchlist, setIsSubmittingWatchlist] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Keyboard shortcut Ctrl+J / Cmd+J to toggle AI Copilot
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setIsCopilotOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load dashboard data whenever selectedAccountId changes
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoadingData(true);
      setApiError(null);
      try {
        const result = await fetchDashboardData(selectedAccountId);
        if (isMounted) {
          setData(result);
          if (result.focused_account && result.focused_account !== selectedAccountId) {
            setSelectedAccountId(result.focused_account);
          }
        }
      } catch (e: any) {
        if (isMounted) {
          console.warn('Dashboard API error, rendering empty safe state:', e);
          setApiError(e.message || 'Unable to connect to backend API server.');
          setData(getEmptyDashboardData(selectedAccountId));
        }
      } finally {
        if (isMounted) {
          setIsLoadingData(false);
        }
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [selectedAccountId]);

  // Load persistent watchlist from backend
  useEffect(() => {
    let isMounted = true;
    async function loadWatchlist() {
      try {
        const entries = await fetchWatchlist();
        if (isMounted) {
          setWatchlist(entries);
        }
      } catch (e) {
        console.warn('Failed to load initial watchlist entries:', e);
      }
    }
    loadWatchlist();
    return () => {
      isMounted = false;
    };
  }, []);

  const isCurrentAccountWatchlisted = watchlist.some(
    (w) => w.account_id === selectedAccountId && w.is_active
  );

  const handleSelectAccount = (accId: string) => {
    setSelectedAccountId(accId);
  };

  const handleOpenDossierForAccount = (accId: string) => {
    setSelectedAccountId(accId);
    setIsDossierOpen(true);
  };

  const handleAddToWatchlist = async (accId?: string) => {
    const targetId = accId || selectedAccountId;
    if (!targetId || isSubmittingWatchlist) return;

    setIsSubmittingWatchlist(true);
    try {
      await addToWatchlist(
        targetId,
        'Flagged for continuous monitoring from master investigation portal',
        'HIGH'
      );
      const updatedList = await fetchWatchlist();
      setWatchlist(updatedList);
      setNotification({
        type: 'success',
        message: `Account ${targetId} added to persistent watchlist in database.`
      });
    } catch (err: any) {
      if (err.status === 409) {
        setNotification({
          type: 'info',
          message: `Account ${targetId} is already on the active watchlist.`
        });
      } else {
        setNotification({
          type: 'error',
          message: err.message || `Failed to add account ${targetId} to watchlist.`
        });
      }
    } finally {
      setIsSubmittingWatchlist(false);
    }
  };

  const handleExportNetworkPdf = () => {
    if (!selectedAccountId) return;
    window.open(`${API_BASE_URL}/reports/download-pdf/${encodeURIComponent(selectedAccountId)}`, '_blank');
  };

  const handleShareAgency = () => {
    setNotification({
      type: 'info',
      message: `Case reference for ${selectedAccountId} dispatched to Law Enforcement Cyber Cell dispatch queue.`
    });
  };

  const handleHeaderSearch = (query: string) => {
    setSearchTerm(query);
    if (query.trim()) {
      setActiveTab('entity-search');
    }
  };

  // Filter accounts for overview table
  const filteredRiskyAccounts = (data.risky_accounts || []).filter(
    (acc) =>
      acc.account_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.key_indicators.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <Header
        onSearch={handleHeaderSearch}
        onOpenCopilot={() => setIsCopilotOpen((prev) => !prev)}
      />

      {/* Notification Toast */}
      {notification && (
        <div className="max-w-[1600px] mx-auto w-full px-6 pt-3">
          <div className={`p-3 rounded-lg flex items-center justify-between text-xs font-medium border animate-in fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : notification.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <div className="flex items-center space-x-2">
              {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              {notification.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-600" />}
              {notification.type === 'info' && <Info className="w-4 h-4 text-blue-600" />}
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Layout (Sidebar + Dynamic View Content) */}
      <div className="flex flex-1">
        {/* Left Sidebar */}
        <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

        {/* Center Content Canvas */}
        <main className="flex-1 p-6 space-y-5 max-w-[1600px] mx-auto overflow-x-hidden">
          {apiError && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center space-x-2 text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                <strong>Backend Notice:</strong> {apiError} (Ensure backend server is running on {API_BASE_URL}).
              </span>
            </div>
          )}

          {/* 1. Dashboard View */}
          {activeTab === 'dashboard' && (
            <div className="space-y-5">
              {/* Row 1: KPI Metrics */}
              <KpiRow kpis={data.kpis} />

              {/* Row 2: Risky Accounts (Top Priority) + Suspicious Network Graph */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <RiskyAccountsTable
                  accounts={filteredRiskyAccounts}
                  selectedAccountId={selectedAccountId}
                  onSelectAccount={handleSelectAccount}
                />
                <NetworkGraphCanvas
                  graphData={data.network_graph}
                  onSelectNode={handleSelectAccount}
                  onOpenFullScreen={() => setActiveTab('network')}
                />
              </div>

              {/* Row 3: Transaction Flow Analysis + Transaction Timeline */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <TransactionFlowCard
                  flow={data.flow_analysis}
                  onViewTrail={() => setIsDossierOpen(true)}
                />
                <TransactionTimelineCard
                  timeline={data.timeline}
                  onViewAll={() => setIsDossierOpen(true)}
                />
              </div>

              {/* Row 4: Linked Cybercrime Complaints + AI Risk Explanation */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <LinkedComplaintsTable
                  complaints={data.linked_complaints}
                  onViewAll={() => setIsDossierOpen(true)}
                />
                <RiskExplanationGauge
                  riskData={data.risk_explanation}
                  onExplainClick={() => setIsDossierOpen(true)}
                />
              </div>

              {/* Row 5: Associated Entities + Investigation Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <AssociatedEntitiesTable
                  entities={data.associated_entities}
                  onViewAll={() => setIsDossierOpen(true)}
                />
                <InvestigationActions
                  onGenerateReport={() => setIsDossierOpen(true)}
                  onAddToWatchlist={() => handleAddToWatchlist()}
                  onExportNetwork={handleExportNetworkPdf}
                  onShareAgency={handleShareAgency}
                  isWatchlisted={isCurrentAccountWatchlisted}
                  isSubmittingWatchlist={isSubmittingWatchlist}
                />
              </div>

              {/* Row 6: Statutory Disclaimer Banner + 8-Step Implementation Plan */}
              <RoadmapFooter />
            </div>
          )}

          {/* 2. Suspicious Accounts Directory */}
          {activeTab === 'accounts' && (
            <AccountsView
              onSelectAccount={(accId) => {
                handleSelectAccount(accId);
                setActiveTab('dashboard');
              }}
              onOpenDossier={handleOpenDossierForAccount}
              onAddToWatchlist={handleAddToWatchlist}
            />
          )}

          {/* 3. Transaction Velocity & Flow Explorer */}
          {activeTab === 'transactions' && (
            <TransactionsView
              onSelectAccount={(accId) => {
                handleSelectAccount(accId);
                setActiveTab('dashboard');
              }}
              onOpenDossier={handleOpenDossierForAccount}
            />
          )}

          {/* 4. Network & Money Trail Investigation */}
          {activeTab === 'network' && (
            <NetworkInvestigationView
              initialAccountId={selectedAccountId}
              onSelectAccount={handleSelectAccount}
              onOpenDossier={handleOpenDossierForAccount}
              onAddToWatchlist={handleAddToWatchlist}
            />
          )}

          {/* 5. Complaints & Cybercrime Incidents */}
          {activeTab === 'complaints' && (
            <ComplaintsView
              onSelectAccount={(accId) => {
                handleSelectAccount(accId);
                setActiveTab('dashboard');
              }}
              onOpenDossier={handleOpenDossierForAccount}
            />
          )}

          {/* 6. Unified Entity Search */}
          {activeTab === 'entity-search' && (
            <EntitySearchView
              onSelectAccount={(accId) => {
                handleSelectAccount(accId);
                setActiveTab('dashboard');
              }}
              onOpenDossier={handleOpenDossierForAccount}
              onAddToWatchlist={handleAddToWatchlist}
            />
          )}

          {/* 7. Evidence Dossier & Reports */}
          {activeTab === 'reports' && (
            <ReportsView
              currentAccountId={selectedAccountId}
              onOpenDossier={handleOpenDossierForAccount}
              onSelectAccount={handleSelectAccount}
            />
          )}

          {/* 7.5. Solved Case Stories & Mule Rings */}
          {activeTab === 'solved-cases' && (
            <SolvedCasesView
              onSelectAccount={(accId) => {
                handleSelectAccount(accId);
                setActiveTab('transactions');
              }}
              onOpenDossier={handleOpenDossierForAccount}
              onNavigateToTab={(tab) => setActiveTab(tab)}
            />
          )}

          {/* 8. Active Surveillance Watchlist */}
          {activeTab === 'watchlist' && (
            <WatchlistView
              onSelectAccount={(accId) => {
                handleSelectAccount(accId);
                setActiveTab('dashboard');
              }}
              onOpenDossier={handleOpenDossierForAccount}
            />
          )}

          {/* 9. Synthetic Data Management */}
          {activeTab === 'data-management' && (
            <DataManagementView />
          )}

          {/* 10. System & Governance Settings */}
          {activeTab === 'settings' && (
            <SettingsView />
          )}

          {/* 11. Help & Documentation */}
          {activeTab === 'help' && (
            <HelpDocumentationView />
          )}
        </main>
      </div>

      {/* Dossier & Report Export Modal */}
      <DossierModal
        isOpen={isDossierOpen}
        onClose={() => setIsDossierOpen(false)}
        accountId={selectedAccountId}
        onSelectAccount={handleSelectAccount}
      />

      {/* Autonomous Investigation AI Copilot Drawer */}
      <AICopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        onSelectTab={(tab) => setActiveTab(tab)}
        onSelectAccount={(acc) => {
          handleSelectAccount(acc);
          setActiveTab('network');
        }}
        activeTab={activeTab}
        focusedAccountId={selectedAccountId}
      />

      {/* Floating AI Copilot Launcher Badge */}
      {!isCopilotOpen && (
        <button
          onClick={() => setIsCopilotOpen(true)}
          className="fixed bottom-6 right-6 z-40 px-4 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl shadow-xl shadow-blue-500/30 flex items-center space-x-2.5 transition transform hover:scale-105 border border-blue-400/40 group"
          title="Open AI Investigation Copilot (Ctrl+J)"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
          </span>
          <Bot className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
          <span className="text-xs font-bold tracking-wide">AI Copilot</span>
          <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono font-medium">⌘J</span>
        </button>
      )}
    </div>
  );
}

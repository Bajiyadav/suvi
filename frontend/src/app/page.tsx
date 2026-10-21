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
import { fetchDashboardData, getFallbackDashboardData } from '@/lib/api';
import { DashboardData } from '@/types';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedAccountId, setSelectedAccountId] = useState('ACC-4321');
  const [data, setData] = useState<DashboardData>(getFallbackDashboardData('ACC-4321'));
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [watchlistCount, setWatchlistCount] = useState(12);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await fetchDashboardData(selectedAccountId);
        setData(result);
      } catch (e) {
        console.error('Failed to load dashboard data:', e);
      }
    }
    loadData();
  }, [selectedAccountId]);

  const handleSelectAccount = (accId: string) => {
    setSelectedAccountId(accId);
  };

  const handleAddToWatchlist = () => {
    setWatchlistCount((prev) => prev + 1);
    alert(`Account XXXX 4321 successfully added to Watchlist.`);
  };

  const handleExportNetworkPdf = () => {
    window.open(`http://localhost:8000/api/v1/reports/download-pdf/${selectedAccountId}`, '_blank');
  };

  const handleShareAgency = () => {
    alert(`Case dossier shared with Cyber Crime Investigation Agency (Central Unit).`);
  };

  // Filter accounts if search term is active
  const filteredRiskyAccounts = data.risky_accounts.filter(
    (acc) =>
      acc.account_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.key_indicators.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <Header onSearch={setSearchTerm} />

      {/* Main Layout (Sidebar + Content) */}
      <div className="flex flex-1">
        {/* Left Sidebar */}
        <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

        {/* Center Content Canvas */}
        <main className="flex-1 p-6 space-y-5 max-w-[1600px] mx-auto overflow-x-hidden">
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
              onAddToWatchlist={handleAddToWatchlist}
              onExportNetwork={handleExportNetworkPdf}
              onShareAgency={handleShareAgency}
            />
          </div>

          {/* Row 6: Statutory Disclaimer Banner + 8-Step Implementation Plan */}
          <RoadmapFooter />
        </main>
      </div>

      {/* Dossier & Report Export Modal */}
      <DossierModal
        isOpen={isDossierOpen}
        onClose={() => setIsDossierOpen(false)}
        accountId={selectedAccountId}
      />
    </div>
  );
}

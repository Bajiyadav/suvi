'use client';

import React, { useState, useEffect } from 'react';
import { NetworkGraphData, GraphNode } from '@/types';
import { fetchNetworkGraph } from '@/lib/api';
import { NetworkGraphCanvas } from '@/features/overview/NetworkGraphCanvas';
import {
  Share2,
  Search,
  Sliders,
  RefreshCw,
  AlertTriangle,
  ShieldAlert,
  ArrowUpRight,
  FileText,
  Bookmark,
  Layers,
  Building2,
  Users
} from 'lucide-react';

interface NetworkInvestigationViewProps {
  initialAccountId?: string;
  onSelectAccount: (accountId: string) => void;
  onOpenDossier: (accountId: string) => void;
  onAddToWatchlist: (accountId: string) => void;
}

export const NetworkInvestigationView: React.FC<NetworkInvestigationViewProps> = ({
  initialAccountId = 'ACC-4321',
  onSelectAccount,
  onOpenDossier,
  onAddToWatchlist,
}) => {
  const [currentAccountId, setCurrentAccountId] = useState(initialAccountId);
  const [inputAccountId, setInputAccountId] = useState(initialAccountId);
  const [maxDepth, setMaxDepth] = useState(2);
  const [graphData, setGraphData] = useState<NetworkGraphData | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGraph = async (accId: string, depth: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchNetworkGraph(accId, depth);
      setGraphData(data);
      // Automatically select central node if present
      const centerNode = data.nodes.find((n) => n.id === accId) || data.nodes[0] || null;
      setSelectedNode(centerNode);
    } catch (err: any) {
      setError(err.message || 'Failed to load network graph.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGraph(currentAccountId, maxDepth);
  }, [currentAccountId, maxDepth]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputAccountId.trim()) {
      setCurrentAccountId(inputAccountId.trim().toUpperCase());
    }
  };

  const handleNodeClick = (nodeId: string) => {
    if (!graphData) return;
    const found = graphData.nodes.find((n) => n.id === nodeId);
    if (found) {
      setSelectedNode(found);
    }
  };

  const handleRefocusOnNode = (nodeId: string) => {
    setCurrentAccountId(nodeId);
    setInputAccountId(nodeId);
  };

  const totalNodes = graphData?.nodes.length || 0;
  const totalEdges = graphData?.edges.length || 0;
  const highRiskNodes = graphData?.nodes.filter((n) => n.risk_score >= 70).length || 0;

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <Share2 className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-bold text-slate-900">Network & Money Trail Investigation</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dynamic NetworkX graph analytics tracing directional fund flows, intermediary layering mule hops, and suspect clusters.
          </p>
        </div>

        {/* Focus Account Form */}
        <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Enter Account ID (e.g. ACC-4321)"
              value={inputAccountId}
              onChange={(e) => setInputAccountId(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-56 font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition shadow-xs"
          >
            Trace Network
          </button>
        </form>
      </div>

      {/* Control Bar & Stats */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Graph Depth Slider */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="flex items-center space-x-1.5 text-xs font-medium text-slate-600">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span>Traversal Depth:</span>
          </div>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4].map((depth) => (
              <button
                key={depth}
                onClick={() => setMaxDepth(depth)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                  maxDepth === depth
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {depth} {depth === 1 ? 'Hop' : 'Hops'}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-1.5 text-slate-600">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>Nodes: <strong>{totalNodes}</strong></span>
          </div>
          <div className="flex items-center space-x-1.5 text-slate-600">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Edges: <strong>{totalEdges}</strong></span>
          </div>
          <div className="flex items-center space-x-1.5 text-red-600 font-medium">
            <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
            <span>High Risk Nodes: <strong>{highRiskNodes}</strong></span>
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

      {/* Main Graph Canvas & Node Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Canvas (2 cols) */}
        <div className="lg:col-span-2 min-h-[500px]">
          {graphData && (
            <NetworkGraphCanvas
              graphData={graphData}
              onSelectNode={(nodeId) => {
                handleNodeClick(nodeId);
                onSelectAccount(nodeId);
              }}
            />
          )}
        </div>

        {/* Selected Node Inspector Panel (1 col) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Entity Inspector
              </h2>
              {selectedNode && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  selectedNode.risk_score >= 70
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : selectedNode.risk_score >= 40
                    ? 'bg-amber-100 text-amber-700 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                }`}>
                  Risk Score: {selectedNode.risk_score}
                </span>
              )}
            </div>

            {selectedNode ? (
              <div className="mt-4 space-y-3.5">
                <div>
                  <span className="text-[11px] text-slate-400">Account Identifier</span>
                  <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                    {selectedNode.id}
                  </div>
                  <div className="text-xs font-mono text-slate-500">
                    {selectedNode.properties?.masked || selectedNode.label}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400">Network Role</span>
                  <div className="text-xs font-semibold text-slate-700 mt-0.5">
                    <span className="inline-flex px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-[10px]">
                      {selectedNode.type}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400">Bank & Location</span>
                  <div className="text-xs text-slate-700 mt-0.5 flex items-center space-x-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedNode.properties?.bank || 'Standard Banking Channel'}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400">Investigative Assessment</span>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {selectedNode.risk_score >= 70
                      ? 'Elevated risk profile detected. Flagged for rapid pass-through or layering activity.'
                      : 'Standard transactional node participating in network fund dispersal.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                Click any node on the graph canvas to inspect entity properties and actions.
              </div>
            )}
          </div>

          {/* Inspector Action Buttons */}
          {selectedNode && (
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <button
                onClick={() => handleRefocusOnNode(selectedNode.id)}
                className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Re-center Graph on {selectedNode.id}</span>
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onOpenDossier(selectedNode.id)}
                  className="flex items-center justify-center space-x-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Dossier</span>
                </button>
                <button
                  onClick={() => onAddToWatchlist(selectedNode.id)}
                  className="flex items-center justify-center space-x-1 py-1.5 px-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-medium rounded-lg transition"
                >
                  <Bookmark className="w-3.5 h-3.5 text-purple-500" />
                  <span>Watchlist</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

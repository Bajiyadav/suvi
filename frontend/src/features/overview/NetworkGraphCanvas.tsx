'use client';

import React, { useState } from 'react';
import { Maximize2, Share2, Landmark, Building2, AlertOctagon, ShoppingBag, FileWarning } from 'lucide-react';
import { NetworkGraphData, GraphNode } from '@/types';

interface NetworkGraphCanvasProps {
  graphData: NetworkGraphData;
  onSelectNode?: (nodeId: string) => void;
}

export const NetworkGraphCanvas: React.FC<NetworkGraphCanvasProps> = ({ graphData, onSelectNode }) => {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  // Pre-calculated visual coordinates for the network layout centered on target
  const nodePositions: Record<string, { x: number; y: number }> = {
    'ACC-4321': { x: 260, y: 160 },
    'ACC-1111': { x: 220, y: 65 },
    'ACC-2222': { x: 100, y: 140 },
    'ACC-3333': { x: 420, y: 145 },
    'ACC-4444': { x: 290, y: 250 },
    'ACC-5555': { x: 130, y: 240 },
    'ACC-6666': { x: 380, y: 245 },
    'MERCHANT-TECHKART': { x: 400, y: 70 },
    'COMPLAINT-C2026-0158': { x: 320, y: 55 },
    'COMPLAINT-C2026-0210': { x: 430, y: 205 },
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'TARGET_ACCOUNT':
        return '#DC2626'; // Red
      case 'HIGH_RISK':
        return '#EA580C'; // Orange
      case 'CONNECTED_ACCOUNT':
        return '#2563EB'; // Blue
      case 'MERCHANT':
        return '#059669'; // Green
      case 'COMPLAINT':
        return '#7C3AED'; // Purple
      default:
        return '#64748B';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between relative overflow-hidden">
      {/* Header & Legend */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Share2 className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Suspicious Network Graph</h2>
          </div>
          <button className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition flex items-center">
            <Maximize2 className="w-3.5 h-3.5 mr-1" /> Open in Full Screen
          </button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600 pb-2 border-b border-slate-100">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
            <span>Target Account</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <span>Connected Account</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
            <span>High Risk</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <span>Merchant / Entity</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
            <span>Complaint Linked</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="w-full h-72 relative bg-slate-50/50 rounded-lg mt-2 flex items-center justify-center">
        <svg viewBox="0 0 520 300" className="w-full h-full">
          <defs>
            <marker
              id="arrow-red"
              viewBox="0 0 10 10"
              refX="16"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#DC2626" />
            </marker>
            <marker
              id="arrow-slate"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#94A3B8" />
            </marker>
          </defs>

          {/* Edges */}
          {graphData.edges.map((edge) => {
            const src = nodePositions[edge.source] || { x: 260, y: 160 };
            const tgt = nodePositions[edge.target] || { x: 200, y: 100 };
            const isRed = edge.source === 'ACC-4321';
            return (
              <g key={edge.id} className="group cursor-pointer">
                <line
                  x1={src.x}
                  y1={src.y}
                  x2={tgt.x}
                  y2={tgt.y}
                  stroke={isRed ? '#DC2626' : '#94A3B8'}
                  strokeWidth={isRed ? 2 : 1.5}
                  strokeDasharray={edge.type === 'COMPLAINT_LINK' ? '3,3' : 'none'}
                  markerEnd={isRed ? 'url(#arrow-red)' : 'url(#arrow-slate)'}
                  className="transition group-hover:stroke-blue-600"
                />
              </g>
            );
          })}

          {/* Nodes */}
          {graphData.nodes.map((node) => {
            const pos = nodePositions[node.id] || { x: 250, y: 150 };
            const isTarget = node.type === 'TARGET_ACCOUNT';
            const color = getNodeColor(node.type);

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                className="cursor-pointer"
                onClick={() => {
                  setSelectedNode(node);
                  onSelectNode?.(node.id);
                }}
              >
                {/* Node Halo / Circle */}
                <circle
                  r={isTarget ? 22 : 14}
                  fill={isTarget ? '#DC2626' : color}
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  className="shadow-md transition hover:scale-110"
                />

                {/* Node Label */}
                <text
                  y={isTarget ? 34 : 24}
                  textAnchor="middle"
                  className="text-[9px] font-bold fill-slate-800"
                >
                  {node.label.split('\n')[0]}
                </text>
                {node.label.split('\n')[1] && (
                  <text
                    y={isTarget ? 44 : 33}
                    textAnchor="middle"
                    className="text-[8px] font-semibold fill-slate-500"
                  >
                    {node.label.split('\n')[1]}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Selected Node Drawer / Tooltip */}
        {selectedNode && (
          <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg p-2.5 shadow-lg text-xs max-w-[200px] z-10">
            <div className="flex justify-between items-start">
              <span className="font-bold text-slate-900">{selectedNode.label.split('\n')[0]}</span>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-slate-600 font-bold ml-2 text-sm"
              >
                ×
              </button>
            </div>
            <div className="text-[11px] text-slate-600 mt-1">
              <div>Type: <span className="font-medium text-slate-800">{selectedNode.type}</span></div>
              <div>Risk Score: <span className="font-bold text-red-600">{selectedNode.risk_score}</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

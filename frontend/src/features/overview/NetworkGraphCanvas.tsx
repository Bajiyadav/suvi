'use client';

import React, { useState, useMemo } from 'react';
import { Maximize2, Share2 } from 'lucide-react';
import { NetworkGraphData, GraphNode, GraphEdge } from '@/types';

interface NetworkGraphCanvasProps {
  graphData: NetworkGraphData;
  onSelectNode?: (nodeId: string) => void;
  onOpenFullScreen?: () => void;
}

export const NetworkGraphCanvas: React.FC<NetworkGraphCanvasProps> = ({ graphData, onSelectNode, onOpenFullScreen }) => {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);

  // Dynamically compute visual coordinates based on graph topology and size
  const nodePositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    const centerX = 260;
    const centerY = 150;
    const nodes = graphData.nodes || [];
    const targetId = graphData.target_node_id;

    const targetNode = nodes.find((n) => n.id === targetId || n.type === 'TARGET_ACCOUNT');
    if (targetNode) {
      positions[targetNode.id] = { x: centerX, y: centerY };
    }

    const otherNodes = nodes.filter((n) => n.id !== targetId && n.type !== 'TARGET_ACCOUNT');
    const totalOthers = otherNodes.length;

    if (totalOthers === 0) {
      return positions;
    }

    // Single ring layout if 8 or fewer nodes
    if (totalOthers <= 8) {
      const radiusX = 160;
      const radiusY = 95;
      otherNodes.forEach((node, idx) => {
        const angle = (2 * Math.PI * idx) / totalOthers - Math.PI / 2;
        const x = Math.round(centerX + radiusX * Math.cos(angle));
        const y = Math.round(centerY + radiusY * Math.sin(angle));
        positions[node.id] = {
          x: Math.max(45, Math.min(475, x)),
          y: Math.max(35, Math.min(265, y)),
        };
      });
      return positions;
    }

    // Concentric two-ring layout for larger networks (> 8 nodes)
    const innerNodes = otherNodes.filter(
      (n) => n.type === 'CONNECTED_ACCOUNT' || n.type === 'HIGH_RISK'
    );
    const outerNodes = otherNodes.filter(
      (n) => n.type === 'COMPLAINT' || n.type === 'MERCHANT'
    );

    let ring1 = innerNodes;
    let ring2 = outerNodes;
    if (ring2.length === 0) {
      const half = Math.ceil(otherNodes.length / 2);
      ring1 = otherNodes.slice(0, half);
      ring2 = otherNodes.slice(half);
    } else if (ring1.length === 0) {
      const half = Math.ceil(otherNodes.length / 2);
      ring1 = otherNodes.slice(0, half);
      ring2 = otherNodes.slice(half);
    }

    const r1X = 115;
    const r1Y = 70;
    ring1.forEach((node, idx) => {
      const angle = (2 * Math.PI * idx) / ring1.length - Math.PI / 2;
      const x = Math.round(centerX + r1X * Math.cos(angle));
      const y = Math.round(centerY + r1Y * Math.sin(angle));
      positions[node.id] = {
        x: Math.max(45, Math.min(475, x)),
        y: Math.max(35, Math.min(265, y)),
      };
    });

    const r2X = 205;
    const r2Y = 115;
    ring2.forEach((node, idx) => {
      const angle = (2 * Math.PI * idx) / ring2.length - Math.PI / 2 + Math.PI / Math.max(1, ring2.length);
      const x = Math.round(centerX + r2X * Math.cos(angle));
      const y = Math.round(centerY + r2Y * Math.sin(angle));
      positions[node.id] = {
        x: Math.max(40, Math.min(480, x)),
        y: Math.max(30, Math.min(270, y)),
      };
    });

    return positions;
  }, [graphData]);

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'TARGET_ACCOUNT':
        return '#DC2626'; // Red
      case 'HIGH_RISK':
        return '#EA580C'; // Orange
      case 'CONNECTED_ACCOUNT':
        return '#2563EB'; // Blue
      case 'TERMINAL_CASHOUT':
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
          <button
            onClick={onOpenFullScreen}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition flex items-center"
          >
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
              id="arrow-blue"
              viewBox="0 0 10 10"
              refX="16"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#2563EB" />
            </marker>
            <marker
              id="arrow-purple"
              viewBox="0 0 10 10"
              refX="16"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#7C3AED" />
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
            const src = nodePositions[edge.source] || { x: 260, y: 150 };
            const tgt = nodePositions[edge.target] || { x: 200, y: 100 };
            const isTargetOutflow = edge.source === graphData.target_node_id;
            const isTargetInflow = edge.target === graphData.target_node_id;
            const isComplaint = edge.type === 'COMPLAINT_LINK';

            let strokeColor = '#94A3B8';
            let marker = 'url(#arrow-slate)';
            if (isComplaint) {
              strokeColor = '#7C3AED';
              marker = 'url(#arrow-purple)';
            } else if (isTargetOutflow) {
              strokeColor = '#DC2626';
              marker = 'url(#arrow-red)';
            } else if (isTargetInflow) {
              strokeColor = '#2563EB';
              marker = 'url(#arrow-blue)';
            }

            return (
              <g
                key={edge.id}
                className="group cursor-pointer"
                onClick={() => {
                  setSelectedEdge(edge);
                  setSelectedNode(null);
                }}
              >
                <line
                  x1={src.x}
                  y1={src.y}
                  x2={tgt.x}
                  y2={tgt.y}
                  stroke={strokeColor}
                  strokeWidth={isTargetOutflow || isTargetInflow ? 2 : 1.5}
                  strokeDasharray={isComplaint ? '3,3' : 'none'}
                  markerEnd={marker}
                  className="transition group-hover:stroke-blue-600 group-hover:stroke-[2.5]"
                />
              </g>
            );
          })}

          {/* Nodes */}
          {graphData.nodes.map((node) => {
            const pos = nodePositions[node.id] || { x: 260, y: 150 };
            const isTarget = node.type === 'TARGET_ACCOUNT';
            const color = getNodeColor(node.type);

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                className="cursor-pointer"
                onClick={() => {
                  setSelectedNode(node);
                  setSelectedEdge(null);
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
          <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg p-2.5 shadow-lg text-xs max-w-[210px] z-10">
            <div className="flex justify-between items-start">
              <span className="font-bold text-slate-900">{selectedNode.label.split('\n')[0]}</span>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-slate-600 font-bold ml-2 text-sm"
              >
                ×
              </button>
            </div>
            <div className="text-[11px] text-slate-600 mt-1 space-y-0.5">
              <div>Type: <span className="font-medium text-slate-800">{selectedNode.type}</span></div>
              <div>Risk Score: <span className="font-bold text-red-600">{selectedNode.risk_score}</span></div>
              {selectedNode.properties?.bank && (
                <div>Bank: <span className="text-slate-700">{selectedNode.properties.bank}</span></div>
              )}
              {selectedNode.properties?.holder && (
                <div>Holder: <span className="text-slate-700">{selectedNode.properties.holder}</span></div>
              )}
              {selectedNode.properties?.loss_formatted && (
                <div>Reported Loss: <span className="font-bold text-slate-900">{selectedNode.properties.loss_formatted}</span></div>
              )}
            </div>
          </div>
        )}

        {/* Selected Edge Drawer / Tooltip */}
        {selectedEdge && (
          <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg p-2.5 shadow-lg text-xs max-w-[220px] z-10">
            <div className="flex justify-between items-start">
              <span className="font-bold text-slate-900">{selectedEdge.type}</span>
              <button
                onClick={() => setSelectedEdge(null)}
                className="text-slate-400 hover:text-slate-600 font-bold ml-2 text-sm"
              >
                ×
              </button>
            </div>
            <div className="text-[11px] text-slate-600 mt-1 space-y-0.5">
              <div>From: <span className="font-medium text-slate-800">{selectedEdge.source}</span></div>
              <div>To: <span className="font-medium text-slate-800">{selectedEdge.target}</span></div>
              <div>Amount: <span className="font-bold text-emerald-700">{selectedEdge.amount_formatted}</span></div>
              <div>Count: <span className="font-semibold text-slate-800">{selectedEdge.transaction_count} txn</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

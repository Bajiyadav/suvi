'use client';

import React from 'react';
import { Info, Settings } from 'lucide-react';

export const RoadmapFooter: React.FC = () => {
  const steps = [
    {
      num: '1',
      title: 'Project Setup',
      desc: 'Define tech stack, set up repository, design database schema, prepare synthetic dataset',
      color: 'bg-blue-600 text-white',
    },
    {
      num: '2',
      title: 'Data Ingestion',
      desc: 'Load transaction data, load complaint data, create entity mappings, data cleaning & preprocessing',
      color: 'bg-emerald-600 text-white',
    },
    {
      num: '3',
      title: 'Transaction Analysis',
      desc: 'Detect unusual patterns, build behavioural features, identify layering and rapid transfers',
      color: 'bg-purple-600 text-white',
    },
    {
      num: '4',
      title: 'Risk Scoring (Explainable AI)',
      desc: 'Calculate explainable risk score with reasons, show top contributing factors, add safeguards',
      color: 'bg-blue-700 text-white',
    },
    {
      num: '5',
      title: 'Graph Analytics',
      desc: 'Build knowledge graph, detect connected accounts, identify suspicious clusters, visualise relationships',
      color: 'bg-amber-600 text-white',
    },
    {
      num: '6',
      title: 'Complaint Correlation',
      desc: 'Link accounts to complaints, find related incidents, show entity connections, display timelines',
      color: 'bg-pink-600 text-white',
    },
    {
      num: '7',
      title: 'Investigation Dashboard',
      desc: 'Build UI with all modules, add search and filters, show alerts and priorities, generate reports',
      color: 'bg-sky-600 text-white',
    },
    {
      num: '8',
      title: 'Testing & Deployment',
      desc: 'Test with synthetic cases, validate explanations, add role-based access, deploy to cloud',
      color: 'bg-teal-600 text-white',
    },
  ];

  return (
    <div className="space-y-4 pt-2">
      {/* Disclaimer Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg py-2 px-4 flex items-center justify-center space-x-2 text-xs text-blue-900">
        <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
        <span>
          <strong>Important:</strong> Risk scores indicate the likelihood of suspicious activity. They do not confirm criminality. All flagged accounts require human investigation and verification with additional evidence.
        </span>
      </div>

      {/* Step-by-Step Implementation Plan */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Settings className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Step-by-Step Implementation Plan
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
          {steps.map((s) => (
            <div
              key={s.num}
              className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex flex-col justify-between text-left hover:border-slate-300 transition"
            >
              <div>
                <div className="flex items-center space-x-1.5 mb-1.5">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${s.color}`}
                  >
                    {s.num}
                  </span>
                  <span className="text-[11px] font-bold text-slate-800 leading-tight">
                    {s.title}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 leading-snug">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

'use client';

import React from 'react';
import { FileDown, BookmarkPlus, Download, Send, ShieldCheck, Check, Loader2 } from 'lucide-react';

interface InvestigationActionsProps {
  onGenerateReport: () => void;
  onAddToWatchlist?: () => void;
  onExportNetwork?: () => void;
  onShareAgency?: () => void;
  isWatchlisted?: boolean;
  isSubmittingWatchlist?: boolean;
}

export const InvestigationActions: React.FC<InvestigationActionsProps> = ({
  onGenerateReport,
  onAddToWatchlist,
  onExportNetwork,
  onShareAgency,
  isWatchlisted = false,
  isSubmittingWatchlist = false,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center space-x-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-900">Investigation Actions</h2>
        </div>

        {/* 2x2 Grid Buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={onGenerateReport}
            className="flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Generate Investigation Report</span>
          </button>

          <button
            onClick={onAddToWatchlist}
            disabled={isSubmittingWatchlist || isWatchlisted}
            className={`flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold border transition ${
              isWatchlisted
                ? 'bg-amber-50 text-amber-800 border-amber-200 cursor-default'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            {isSubmittingWatchlist ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
            ) : isWatchlisted ? (
              <Check className="w-3.5 h-3.5 text-amber-600" />
            ) : (
              <BookmarkPlus className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span>{isWatchlisted ? 'In Watchlist' : 'Add to Watchlist'}</span>
          </button>

          <button
            onClick={onExportNetwork}
            className="flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Network (PDF)</span>
          </button>

          <button
            onClick={onShareAgency}
            className="flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition"
          >
            <Send className="w-3.5 h-3.5 text-slate-500" />
            <span>Share with Agency</span>
          </button>
        </div>
      </div>
    </div>
  );
};

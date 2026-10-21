'use client';

import React from 'react';
import { Calendar, ChevronRight } from 'lucide-react';
import { TimelineItem } from '@/types';

interface TransactionTimelineCardProps {
  timeline: TimelineItem[];
  onViewAll?: () => void;
}

export const TransactionTimelineCard: React.FC<TransactionTimelineCardProps> = ({ timeline, onViewAll }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Transaction Timeline</h2>
          </div>
          <button
            onClick={onViewAll}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition flex items-center"
          >
            View All <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>

        {/* Timeline rows */}
        <div className="space-y-2">
          {timeline.map((item) => {
            const isIncoming = item.type === 'INCOMING';
            return (
              <div
                key={item.transaction_id}
                className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg hover:bg-slate-50 transition border border-transparent hover:border-slate-100"
              >
                {/* Date & Time */}
                <div className="flex items-center space-x-2 text-slate-500 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                  <span>{item.date_formatted}, {item.time_formatted}</span>
                </div>

                {/* Amount */}
                <div
                  className={`font-bold px-2 py-0.5 rounded ${
                    isIncoming ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
                  }`}
                >
                  {item.amount_formatted}
                </div>

                {/* Counterparty */}
                <div className="text-slate-700 font-semibold text-right min-w-[110px]">
                  {item.counterparty_masked}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

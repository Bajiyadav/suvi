'use client';

import React from 'react';
import { FileText, ChevronRight } from 'lucide-react';
import { CybercrimeComplaint } from '@/types';

interface LinkedComplaintsTableProps {
  complaints: CybercrimeComplaint[];
  onViewAll?: () => void;
}

export const LinkedComplaintsTable: React.FC<LinkedComplaintsTableProps> = ({ complaints, onViewAll }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Linked Cybercrime Complaints</h2>
          </div>
          <button
            onClick={onViewAll}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition flex items-center"
          >
            View All <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-2 px-1.5">Complaint ID</th>
                <th className="py-2 px-1.5">Date</th>
                <th className="py-2 px-1.5">Type</th>
                <th className="py-2 px-1.5 text-right">Amount</th>
                <th className="py-2 px-1.5 text-center">Status</th>
                <th className="py-2 px-1.5 text-center">Linked Accounts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {complaints.map((c) => (
                <tr key={c.complaint_id} className="hover:bg-slate-50/70 transition">
                  <td className="py-2 px-1.5 font-bold text-blue-600 cursor-pointer hover:underline">
                    {c.complaint_id}
                  </td>
                  <td className="py-2 px-1.5 text-slate-600">{c.incident_date}</td>
                  <td className="py-2 px-1.5 font-medium text-slate-800">{c.complaint_type}</td>
                  <td className="py-2 px-1.5 font-bold text-slate-900 text-right">
                    {c.reported_loss_formatted}
                  </td>
                  <td className="py-2 px-1.5 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.status === 'Verified'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="py-2 px-1.5 text-center font-bold text-slate-700">
                    {c.linked_accounts_count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

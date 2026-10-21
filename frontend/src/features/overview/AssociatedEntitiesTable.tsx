'use client';

import React from 'react';
import { Users, ChevronRight } from 'lucide-react';
import { AssociatedEntity } from '@/types';

interface AssociatedEntitiesTableProps {
  entities: AssociatedEntity[];
  onViewAll?: () => void;
}

export const AssociatedEntitiesTable: React.FC<AssociatedEntitiesTableProps> = ({ entities, onViewAll }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Associated Entities</h2>
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
                <th className="py-2 px-2">Entity Type</th>
                <th className="py-2 px-2">Name / ID</th>
                <th className="py-2 px-2 text-right">Connections</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {entities.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition">
                  <td className="py-2 px-2 font-medium text-slate-600">{item.entity_type}</td>
                  <td className="py-2 px-2 font-semibold text-slate-900">{item.name_or_id}</td>
                  <td className="py-2 px-2 text-right text-slate-500 font-medium">
                    {item.connections}
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

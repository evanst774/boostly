// src/components/admin/audit-logs/AuditLogsTable.tsx
'use client';

import { Sparkles } from 'lucide-react';
import { AuditLogsTableRow } from './AuditLogsTableRow';
import { AuditLogsMobileCard } from './AuditLogsMobileCard';
import { AuditLogEntry } from '@/app/admin/types';

interface AuditLogsTableProps {
  logs: AuditLogEntry[];
  loading: boolean;
  onSelectLog: (log: AuditLogEntry) => void;
  formatDate: (date: string) => string;
  formatTime: (date: string) => string;
  truncateText: (text: string, maxLen?: number) => string;
  getDescription: (log: AuditLogEntry) => string;
}

function TableRowSkeleton() {
  return (
    <tr className="border-b border-white/5">
      {[...Array(6)].map((_, i) => (
        <td key={i} className="py-4 px-4">
          <div
            className="h-4 bg-white/5 rounded animate-pulse"
            style={{ width: i === 0 ? '60px' : '100px' }}
          />
        </td>
      ))}
    </tr>
  );
}

function MobileCardSkeleton() {
  return (
    <div className="bg-gradient-to-br from-white/5 to-white/2 rounded-xl border border-white/10 p-4 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10" />
          <div className="space-y-2">
            <div className="h-4 w-24 bg-white/10 rounded" />
            <div className="h-3 w-16 bg-white/5 rounded" />
          </div>
        </div>
        <div className="h-6 w-16 bg-white/10 rounded-full" />
      </div>
      <div className="space-y-2 mb-3">
        <div className="h-3 w-full bg-white/5 rounded" />
        <div className="h-3 w-3/4 bg-white/5 rounded" />
      </div>
      <div className="flex justify-between pt-3 border-t border-white/10">
        <div className="h-3 w-24 bg-white/10 rounded" />
        <div className="h-3 w-16 bg-white/10 rounded" />
      </div>
    </div>
  );
}

export function AuditLogsTable({
  logs,
  loading,
  onSelectLog,
  formatDate,
  formatTime,
  truncateText,
  getDescription,
}: AuditLogsTableProps) {
  if (loading) {
    return (
      <>
        {/* Desktop Skeleton */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-white/[0.03]">
              <tr className="border-b border-white/10">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-4 px-4">
                  Date & Time
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-4 px-4">
                  User
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-4 px-4">
                  Action
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-4 px-4">
                  Description
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-4 px-4">
                  Record ID
                </th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider py-4 px-4 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {[...Array(10)].map((_, i) => (
                <TableRowSkeleton key={i} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Skeleton */}
        <div className="md:hidden space-y-3">
          {[...Array(5)].map((_, i) => (
            <MobileCardSkeleton key={i} />
          ))}
        </div>
      </>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-20">
        <Sparkles className="w-12 h-12 text-blue-400/30 mx-auto mb-3" />
        <p className="text-gray-400 text-lg font-space-grotesk">
          No audit logs found
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-white/[0.03]">
            <tr className="border-b border-white/10">
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-4 px-4">
                Date & Time
              </th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-4 px-4">
                User
              </th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-4 px-4">
                Action
              </th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-4 px-4">
                Description
              </th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-4 px-4">
                Record ID
              </th>
              <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider py-4 px-4 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, index) => (
              <AuditLogsTableRow
                key={log.id}
                log={log}
                index={index}
                onSelect={onSelectLog}
                formatDate={formatDate}
                formatTime={formatTime}
                truncateText={truncateText}
                getDescription={getDescription}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {logs.map((log, index) => (
          <AuditLogsMobileCard
            key={log.id}
            log={log}
            index={index}
            onSelect={onSelectLog}
            formatDate={formatDate}
            formatTime={formatTime}
            getDescription={getDescription}
          />
        ))}
      </div>
    </>
  );
}

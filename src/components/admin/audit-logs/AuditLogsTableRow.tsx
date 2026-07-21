// src/components/admin/audit-logs/AuditLogsTableRow.tsx
'use client';

import { motion } from 'framer-motion';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Eye } from 'lucide-react';
import { actionConfig } from './configs';
import { AuditLogEntry } from '@/app/admin/types';

interface AuditLogsTableRowProps {
  log: AuditLogEntry;
  index: number;
  onSelect: (log: AuditLogEntry) => void;
  formatDate: (date: string) => string;
  formatTime: (date: string) => string;
  truncateText: (text: string, maxLen?: number) => string;
  getDescription: (log: AuditLogEntry) => string;
}

export function AuditLogsTableRow({
  log,
  index,
  onSelect,
  formatDate,
  formatTime,
  truncateText,
  getDescription,
}: AuditLogsTableRowProps) {
  const actionCfg = actionConfig[log.action] || actionConfig.default;
  const description = getDescription(log);

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.02 }}
      className="border-b border-white/5 hover:bg-white/[0.03] transition-all group cursor-pointer"
      onClick={() => onSelect(log)}
    >
      <td className="py-4 px-4">
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <div className="cursor-default">
              <div className="text-sm text-white font-medium font-space-grotesk">
                {formatDate(log.createdAt)}
              </div>
              <div className="text-xs text-gray-500 font-space-grotesk">
                {formatTime(log.createdAt)}
              </div>
            </div>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content className="px-2 py-1 text-xs bg-gray-900 text-white rounded-md shadow-lg font-space-grotesk">
              {new Date(log.createdAt).toLocaleString('en-US', {
                dateStyle: 'full',
                timeStyle: 'medium',
              })}
              <Tooltip.Arrow className="fill-gray-900" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-lg">
            {log.userName?.charAt(0)?.toUpperCase() || 'S'}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white truncate font-space-grotesk">
              {log.userName || 'System'}
            </div>
            <div className="text-xs text-gray-500 truncate font-space-grotesk">
              {log.userRole || '—'}
            </div>
          </div>
        </div>
      </td>
      <td className="py-4 px-4">
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border font-space-grotesk"
          style={{
            background: actionCfg.bg,
            color: actionCfg.color,
            borderColor: `${actionCfg.color}30`,
          }}
        >
          {actionCfg.icon}
          {actionCfg.label}
        </span>
      </td>
      <td className="py-4 px-4 max-w-[250px]">
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <span className="text-sm text-gray-300 cursor-default block truncate font-space-grotesk">
              {truncateText(description, 50)}
            </span>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content className="max-w-[400px] px-3 py-2 text-xs bg-gray-900 text-white rounded-lg shadow-lg leading-relaxed break-words font-space-grotesk">
              {description}
              <Tooltip.Arrow className="fill-gray-900" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </td>
      <td className="py-4 px-4">
        {log.entityId ? (
          <span className="text-sm font-mono font-semibold text-blue-400">
            {log.entityId}
          </span>
        ) : (
          <span className="text-xs text-gray-600 font-space-grotesk">—</span>
        )}
      </td>
      <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onSelect(log)}
          className="touch-min-target p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
          aria-label="View log details"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
      </td>
    </motion.tr>
  );
}

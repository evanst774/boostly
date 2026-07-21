// src/components/admin/audit-logs/AuditLogsMobileCard.tsx
'use client';

import { motion } from 'framer-motion';
import { Eye, Clock, Hash } from 'lucide-react';
import { actionConfig } from './configs';
import { AuditLogEntry } from '@/app/admin/types';

interface AuditLogsMobileCardProps {
  log: AuditLogEntry;
  index: number;
  onSelect: (log: AuditLogEntry) => void;
  formatDate: (date: string) => string;
  formatTime: (date: string) => string;
  getDescription: (log: AuditLogEntry) => string;
}

export function AuditLogsMobileCard({
  log,
  index,
  onSelect,
  formatDate,
  formatTime,
  getDescription,
}: AuditLogsMobileCardProps) {
  const actionCfg = actionConfig[log.action] || actionConfig.default;
  const description = getDescription(log);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-sm rounded-xl border border-white/10 p-4 hover:border-white/20 transition-all duration-300 touch-manipulation cursor-pointer"
      onClick={() => onSelect(log)}
    >
      {/* Header: User + Action */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-lg">
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
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border flex-shrink-0 font-space-grotesk"
          style={{
            background: actionCfg.bg,
            color: actionCfg.color,
            borderColor: `${actionCfg.color}30`,
          }}
        >
          {actionCfg.icon}
          {actionCfg.label}
        </span>
      </div>

      {/* Description */}
      <div className="mb-3">
        <p className="text-sm text-gray-300 font-space-grotesk line-clamp-2">
          {description}
        </p>
      </div>

      {/* Footer: Date/Time + Record ID */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/10">
        <div className="flex items-center gap-3 text-xs text-gray-500 font-space-grotesk">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatDate(log.createdAt)}</span>
            <span className="text-gray-600">•</span>
            <span>{formatTime(log.createdAt)}</span>
          </div>
        </div>
        {log.entityId && (
          <div className="flex items-center gap-1.5 text-xs text-blue-400 font-mono font-semibold">
            <Hash className="w-3.5 h-3.5 text-gray-500" />
            <span>{log.entityId}</span>
          </div>
        )}
      </div>

      {/* View Details Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onSelect(log);
        }}
        className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all text-xs font-medium font-space-grotesk touch-min-target"
      >
        <Eye className="w-3.5 h-3.5" />
        View Details
      </button>
    </motion.div>
  );
}

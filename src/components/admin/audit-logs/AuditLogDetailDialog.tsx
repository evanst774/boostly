// src/components/admin/audit-logs/AuditLogDetailDialog.tsx
'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X, Clock, Activity } from 'lucide-react';
import { actionConfig } from './configs';
import { AuditLogEntry } from '@/app/admin/types';

interface AuditLogDetailDialogProps {
  log: AuditLogEntry | null;
  open: boolean;
  onClose: () => void;
  formatDate: (date: string) => string;
  formatTime: (date: string) => string;
}

export function AuditLogDetailDialog({
  log,
  open,
  onClose,
  formatDate,
  formatTime,
}: AuditLogDetailDialogProps) {
  if (!log) return null;

  const actionCfg = actionConfig[log.action] || actionConfig.default;
  let oldData = null;
  let newData = null;

  try {
    if (log.oldData) oldData = JSON.parse(log.oldData);
    if (log.newData) newData = JSON.parse(log.newData);
  } catch {
    // Invalid JSON, ignore
  }

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-32px)] max-w-lg max-h-[85vh] overflow-y-auto bg-[#0d1e38] border border-white/10 rounded-2xl shadow-2xl z-50 p-6">
          <Dialog.Title className="text-lg font-bold text-white mb-4 flex items-center gap-2 flex-wrap">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
              style={{
                background: actionCfg.bg,
                color: actionCfg.color,
                borderColor: `${actionCfg.color}30`,
              }}
            >
              {actionCfg.icon}
              {actionCfg.label}
            </span>
            <span className="text-gray-500">•</span>
            <span className="text-sm text-gray-400">
              {formatDate(log.createdAt)} at {formatTime(log.createdAt)}
            </span>
          </Dialog.Title>

          <div className="space-y-4">
            <div className="bg-white/5 rounded-xl border border-white/10 p-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500 text-xs">User</span>
                <p className="text-white font-medium">
                  {log.userName || 'System'}
                </p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">Role</span>
                <p className="text-white">{log.userRole || '—'}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">Module</span>
                <p className="text-white capitalize">{log.entityType || '—'}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">Record ID</span>
                <p className="text-blue-400 font-mono text-xs">
                  {log.entityId || '—'}
                </p>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500 text-xs">IP Address</span>
                <p className="text-white font-mono text-xs">
                  {log.ipAddress || '—'}
                </p>
              </div>
            </div>

            {oldData && (
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  Previous Data
                </div>
                <pre className="bg-white/5 rounded-xl border border-white/10 p-3 text-xs text-gray-300 overflow-x-auto max-h-40 whitespace-pre-wrap">
                  {JSON.stringify(oldData, null, 2)}
                </pre>
              </div>
            )}

            {newData && (
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Activity className="w-3 h-3 text-green-400" />
                  New Data
                </div>
                <pre className="bg-white/5 rounded-xl border border-white/10 p-3 text-xs text-gray-300 overflow-x-auto max-h-40 whitespace-pre-wrap">
                  {JSON.stringify(newData, null, 2)}
                </pre>
              </div>
            )}

            {!oldData && !newData && (
              <div className="text-center py-6 text-gray-500 text-sm">
                No detailed data available for this log entry.
              </div>
            )}
          </div>

          <Dialog.Close className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-all">
            <X className="w-4 h-4" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

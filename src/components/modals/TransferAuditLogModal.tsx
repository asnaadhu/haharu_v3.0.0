import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, History, Clock, User, Sparkles, FileText, ArrowRight } from 'lucide-react';
import { TransferRecord, TransferAuditLogEntry } from '../../types';

interface TransferAuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: TransferRecord | null;
}

export const TransferAuditLogModal: React.FC<TransferAuditLogModalProps> = ({
  isOpen,
  onClose,
  record,
}) => {
  if (!isOpen || !record) return null;

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'N/A';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    } catch {
      return isoString;
    }
  };

  // Fallback logs if auditLogs is empty or missing
  const logs: TransferAuditLogEntry[] = record.auditLogs && record.auditLogs.length > 0
    ? record.auditLogs
    : [
        {
          id: 'init-fallback',
          timestamp: record.updatedAt || record.createdAt,
          action: 'Request Created',
          performedBy: record.lastModifiedBy || record.createdBy || 'System User',
          details: `Initial transfer request created for ${record.fullName} (${record.position})`,
        },
      ];

  const lastModifiedUser = record.lastModifiedBy || record.createdBy || 'System User';
  const lastModifiedTime = formatDate(record.updatedAt || record.createdAt);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="bg-white border border-[#E5E5E1] shadow-2xl rounded-xs w-full max-w-xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Modal Header */}
          <div className="p-4 bg-[#1A1A1A] text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xs border border-amber-500/30">
                <History className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <span>Change History & Audit Logs</span>
                  <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-1.5 py-0.5 rounded-xs font-mono font-bold">
                    {logs.length} Log{logs.length > 1 ? 's' : ''}
                  </span>
                </h3>
                <p className="text-[11px] text-[#A3A39F] font-mono mt-0.5">
                  Request: <strong className="text-white">{record.requestId || record.psaNo}</strong> • PSA: {record.psaNo}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-[#A3A39F] hover:text-white hover:bg-white/10 rounded-xs transition-colors"
              title="Close Audit Log"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Context Banner */}
          <div className="p-3 bg-[#F9F9F8] border-b border-[#E5E5E1] text-xs flex items-center justify-between gap-2 shrink-0">
            <div>
              <span className="font-bold text-[#1A1A1A]">{record.fullName}</span>
              <span className="text-[#666662] ml-1">({record.position} • {record.department || 'Resort Staff'})</span>
            </div>
            <div className="text-[11px] text-[#666662] text-right">
              <div>Last modified by: <strong className="text-[#1A1A1A] font-semibold">{lastModifiedUser}</strong></div>
              <div className="text-[10px] text-[#A3A39F] font-mono">{lastModifiedTime}</div>
            </div>
          </div>

          {/* Timeline Content */}
          <div className="p-5 overflow-y-auto space-y-4 flex-1 bg-[#FAFAFA]">
            <div className="relative border-l-2 border-[#E5E5E1] ml-3 pl-5 space-y-5">
              {logs.map((log, index) => {
                const isCreation = index === logs.length - 1 || log.action.toLowerCase().includes('created');
                return (
                  <div key={log.id || index} className="relative group">
                    {/* Timeline Node Icon */}
                    <div className={`absolute -left-[27px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center border text-[10px] shadow-xs ${
                      isCreation
                        ? 'bg-emerald-100 border-emerald-400 text-emerald-800'
                        : 'bg-amber-100 border-amber-400 text-amber-900'
                    }`}>
                      {isCreation ? (
                        <Sparkles className="w-2.5 h-2.5 text-emerald-700" />
                      ) : (
                        <Clock className="w-2.5 h-2.5 text-amber-700" />
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="bg-white p-3 border border-[#E5E5E1] rounded-xs shadow-2xs hover:border-[#1A1A1A] transition-colors space-y-1.5">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-xs border ${
                          isCreation
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                            : 'bg-amber-50 text-amber-900 border-amber-200'
                        }`}>
                          {log.action}
                        </span>

                        <span className="text-[10px] font-mono text-[#888880] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#A3A39F]" />
                          {formatDate(log.timestamp)}
                        </span>
                      </div>

                      {/* Performed By User */}
                      <div className="text-[11px] text-[#555550] flex items-center gap-1.5 font-medium">
                        <User className="w-3 h-3 text-[#A3A39F]" />
                        <span>Modified by: <strong className="text-[#1A1A1A] font-bold">{log.performedBy || 'System User'}</strong></span>
                      </div>

                      {/* Change Details */}
                      {log.details && (
                        <div className="text-[11px] text-[#1A1A1A] bg-[#F5F5F3] p-2 rounded-xs border border-[#E5E5E1] font-mono break-words leading-relaxed">
                          {log.details}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 bg-white border-t border-[#E5E5E1] flex items-center justify-between text-xs text-[#666662] shrink-0">
            <span className="text-[11px] text-[#888880]">All edits are permanently recorded for audit compliance</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-[#1A1A1A] text-white hover:bg-black font-bold text-xs rounded-xs transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

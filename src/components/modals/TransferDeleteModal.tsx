import React from 'react';
import { motion } from 'motion/react';
import { TransferRecord } from '../../types';
import { Trash2 } from 'lucide-react';

interface TransferDeleteModalProps {
  record: TransferRecord | null;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export const TransferDeleteModal: React.FC<TransferDeleteModalProps> = ({
  record,
  onClose,
  onConfirm,
  isDeleting,
}) => {
  if (!record) return null;

  return (
    <div className="fixed inset-0 bg-[#1A1A1A]/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="bg-white border border-[#E5E5E1] rounded-xs p-6 max-w-sm w-full space-y-4 shadow-2xl"
      >
        <div className="flex items-center gap-3 text-rose-600">
          <div className="p-2 bg-rose-100 rounded-full">
            <Trash2 className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-[#1A1A1A]">Delete Transfer Request?</h3>
        </div>
        <p className="text-xs text-[#666662] leading-relaxed">
          Are you sure you want to delete transfer request <strong className="text-[#1A1A1A]">{record.psaNo}</strong> for <strong className="text-[#1A1A1A]">{record.fullName}</strong>? This action cannot be undone.
        </p>
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E5E5E1]">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-3.5 py-1.5 border border-[#E5E5E1] text-xs font-bold rounded-xs text-[#666662] hover:bg-[#F0F0EE] transition-colors uppercase tracking-wider"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xs transition-colors uppercase tracking-wider flex items-center gap-2 shadow-xs disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete Request'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { TransferRecord } from '../../types';
import { calculateCheckInTimes } from '../../utils/timeUtils';
import { X, Edit2, FileText, Clock, CheckCircle2, Sparkles } from 'lucide-react';

interface TransferBulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIds: string[];
  focusField: 'flightDetails' | 'departureTime' | 'all' | null;
  onApply: (updates: Partial<TransferRecord>) => Promise<void>;
  isBulkUpdating: boolean;
  userModifier: string;
}

export const TransferBulkEditModal: React.FC<TransferBulkEditModalProps> = ({
  isOpen,
  onClose,
  selectedIds,
  focusField,
  onApply,
  isBulkUpdating,
  userModifier,
}) => {
  const [bulkFlightDetails, setBulkFlightDetails] = useState('');
  const [bulkDepartureTime, setBulkDepartureTime] = useState('');
  const [updateFlightDetailsChecked, setUpdateFlightDetailsChecked] = useState(false);
  const [updateDepartureTimeChecked, setUpdateDepartureTimeChecked] = useState(false);
  const [markAsCompletedChecked, setMarkAsCompletedChecked] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setBulkFlightDetails('');
    setBulkDepartureTime('');
    setMarkAsCompletedChecked(false);

    if (focusField === 'flightDetails') {
      setUpdateFlightDetailsChecked(true);
      setUpdateDepartureTimeChecked(false);
    } else if (focusField === 'departureTime') {
      setUpdateDepartureTimeChecked(true);
      setUpdateFlightDetailsChecked(false);
    } else {
      setUpdateFlightDetailsChecked(true);
      setUpdateDepartureTimeChecked(true);
    }
  }, [isOpen, focusField]);

  if (!isOpen) return null;

  const handleApplyBulkEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) return;

    const updates: Partial<TransferRecord> = {};

    if (updateFlightDetailsChecked) {
      updates.flightDetails = bulkFlightDetails.trim();
    }
    if (updateDepartureTimeChecked) {
      const depTime = bulkDepartureTime.trim();
      updates.departureTime = depTime;
      const calculated = calculateCheckInTimes(depTime);
      if (calculated) {
        updates.checkInTime = calculated.checkInTime;
        updates.checkInClose = calculated.checkInClose;
      }
    }
    if (markAsCompletedChecked) {
      updates.status = 'Completed';
    }

    updates.lastModifiedBy = userModifier;

    if (Object.keys(updates).length === 1 && updates.lastModifiedBy) {
      alert('Please check at least one field to update.');
      return;
    }

    await onApply(updates);
  };

  return (
    <div className="fixed inset-0 bg-[#1A1A1A]/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="bg-white border border-[#E5E5E1] rounded-xs p-6 max-w-lg w-full space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-[#E5E5E1] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100 rounded-full text-amber-800">
              <Edit2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1A1A1A]">Bulk Update Selected Transfers</h3>
              <p className="text-xs text-[#666662]">
                Updating <strong className="text-amber-800 font-mono font-bold">{selectedIds.length}</strong> selected transfer request(s)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#A3A39F] hover:text-[#1A1A1A] hover:bg-[#F0F0EE] rounded-xs transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleApplyBulkEdit} className="space-y-4">
          {/* Flight Details Field */}
          <div className="p-3.5 bg-[#FAF9F6] border border-[#E5E5E1] rounded-xs space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={updateFlightDetailsChecked}
                onChange={(e) => setUpdateFlightDetailsChecked(e.target.checked)}
                className="w-4 h-4 accent-[#1A1A1A] rounded-xs cursor-pointer"
              />
              <span className="text-xs font-bold text-[#1A1A1A] flex items-center gap-1.5 uppercase tracking-wider">
                <FileText className="w-3.5 h-3.5 text-sky-600" />
                Update Flight Details
              </span>
            </label>
            {updateFlightDetailsChecked && (
              <div className="pt-1">
                <input
                  type="text"
                  value={bulkFlightDetails}
                  onChange={(e) => setBulkFlightDetails(e.target.value)}
                  placeholder="eg : NR1234"
                  className="w-full px-3 py-2 text-xs border border-[#E5E5E1] bg-white rounded-xs focus:outline-none focus:border-[#1A1A1A] font-mono text-[#1A1A1A]"
                />
                <p className="text-[10px] text-[#A3A39F] mt-1">
                  Will update Flight Details for all {selectedIds.length} selected request(s).
                </p>
              </div>
            )}
          </div>

          {/* Departure Time Field */}
          <div className="p-3.5 bg-[#FAF9F6] border border-[#E5E5E1] rounded-xs space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={updateDepartureTimeChecked}
                onChange={(e) => setUpdateDepartureTimeChecked(e.target.checked)}
                className="w-4 h-4 accent-[#1A1A1A] rounded-xs cursor-pointer"
              />
              <span className="text-xs font-bold text-[#1A1A1A] flex items-center gap-1.5 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                Update Departure Time
              </span>
            </label>
            {updateDepartureTimeChecked && (
              <div className="pt-1 space-y-1">
                <input
                  type="text"
                  value={bulkDepartureTime}
                  onChange={(e) => setBulkDepartureTime(e.target.value)}
                  placeholder="eg : 09:30 AM or 18:30"
                  className="w-full px-3 py-2 text-xs border border-[#E5E5E1] bg-white rounded-xs focus:outline-none focus:border-[#1A1A1A] font-mono text-[#1A1A1A]"
                />
                {bulkDepartureTime.trim() && calculateCheckInTimes(bulkDepartureTime) ? (
                  <div className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-xs border border-emerald-200 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>
                      Auto-sets Check-in Time: <strong className="font-mono text-[#1A1A1A]">{calculateCheckInTimes(bulkDepartureTime)?.checkInTime}</strong> (-2h) & Check-in Close: <strong className="font-mono text-[#1A1A1A]">{calculateCheckInTimes(bulkDepartureTime)?.checkInClose}</strong> (-1h)
                    </span>
                  </div>
                ) : (
                  <p className="text-[10px] text-[#A3A39F]">
                    Will automatically set Check-in Time (-2h) and Check-in Close (-1h) for all {selectedIds.length} selected request(s).
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Marked as Completed Field */}
          <div className="p-3.5 bg-[#FAF9F6] border border-[#E5E5E1] rounded-xs space-y-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={markAsCompletedChecked}
                onChange={(e) => setMarkAsCompletedChecked(e.target.checked)}
                className="w-4 h-4 accent-[#1A1A1A] rounded-xs cursor-pointer"
              />
              <span className="text-xs font-bold text-[#1A1A1A] flex items-center gap-1.5 uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Marked as Completed
              </span>
            </label>
            <p className="text-[10px] text-[#A3A39F] pl-6">
              Sets transfer status to Completed for all {selectedIds.length} selected request(s).
            </p>
          </div>

          {/* Form Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E5E1]">
            <button
              type="button"
              onClick={onClose}
              disabled={isBulkUpdating}
              className="px-4 py-2 border border-[#E5E5E1] text-xs font-bold rounded-xs text-[#666662] hover:bg-[#F0F0EE] transition-colors uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isBulkUpdating ||
                (!updateFlightDetailsChecked &&
                  !updateDepartureTimeChecked &&
                  !markAsCompletedChecked)
              }
              className="px-5 py-2 bg-[#1A1A1A] hover:bg-[#333333] text-white text-xs font-bold rounded-xs transition-colors uppercase tracking-wider flex items-center gap-2 shadow-xs disabled:opacity-50 font-semibold"
            >
              {isBulkUpdating ? 'Applying Updates...' : `Apply Bulk Update (${selectedIds.length})`}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

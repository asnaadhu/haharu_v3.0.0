import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useProperty } from '../../context/PropertyContext';
import { StatusCategory } from '../../types';
import { X, Shield, Save } from 'lucide-react';

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  statusToEdit?: StatusCategory | null;
}

const COLOR_PRESETS = [
  { label: 'Black', value: '#1A1A1A' },
  { label: 'Charcoal', value: '#333330' },
  { label: 'Muted Gray', value: '#666662' },
  { label: 'Taupe', value: '#A3A39F' },
  { label: 'Burgundy', value: '#9E2A2B' },
  { label: 'Navy', value: '#1D2A44' },
  { label: 'Forest', value: '#2A4436' },
];

export const StatusModal: React.FC<StatusModalProps> = ({
  isOpen,
  onClose,
  statusToEdit,
}) => {
  const { addStatusCategory, updateStatusCategory } = useProperty();

  const [name, setName] = useState<string>('');
  const [type, setType] = useState<'room' | 'bed' | 'both'>('both');
  const [color, setColor] = useState<string>('#1A1A1A');
  const [description, setDescription] = useState<string>('');
  const [isOccupiedState, setIsOccupiedState] = useState<boolean>(false);
  const [isMaintenanceState, setIsMaintenanceState] = useState<boolean>(false);

  useEffect(() => {
    if (statusToEdit) {
      setName(statusToEdit.name);
      setType(statusToEdit.type || 'both');
      setColor(statusToEdit.color || '#1A1A1A');
      setDescription(statusToEdit.description || '');
      setIsOccupiedState(statusToEdit.isOccupiedState || false);
      setIsMaintenanceState(statusToEdit.isMaintenanceState || false);
    } else {
      setName('');
      setType('both');
      setColor('#1A1A1A');
      setDescription('');
      setIsOccupiedState(false);
      setIsMaintenanceState(false);
    }
  }, [statusToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (statusToEdit) {
      updateStatusCategory(
        statusToEdit.id,
        name.trim(),
        type,
        color,
        description.trim(),
        isOccupiedState,
        isMaintenanceState
      );
    } else {
      addStatusCategory(
        name.trim(),
        type,
        color,
        description.trim(),
        isOccupiedState,
        isMaintenanceState
      );
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1A1A1A]/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="bg-white max-w-md w-full shadow-2xl overflow-hidden border border-[#E5E5E1]"
      >
        <div className="px-6 py-5 bg-[#1A1A1A] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-white" />
            <h3 className="font-bold text-lg">
              {statusToEdit ? 'Edit Status Category' : 'Create Status Category'}
            </h3>
          </div>
          <button onClick={onClose} className="text-[#A3A39F] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest mb-1.5">
              Status Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cleaning in Progress, Reserved"
              required
              className="w-full px-3 py-2 border border-[#E5E5E1] text-[#1A1A1A] text-xs font-semibold focus:outline-none focus:border-[#1A1A1A]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest mb-1.5">
                Applies To *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 border border-[#E5E5E1] text-[#1A1A1A] text-xs font-semibold focus:outline-none focus:border-[#1A1A1A] bg-white"
              >
                <option value="both">Rooms & Beds (Both)</option>
                <option value="room">Rooms Only</option>
                <option value="bed">Bed Slots Only</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest mb-1.5">
                Badge Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-8 h-8 p-0.5 border border-[#E5E5E1] cursor-pointer shrink-0"
                />
                <span
                  className="px-2.5 py-1 text-white font-bold text-[10px] uppercase tracking-wider"
                  style={{ backgroundColor: color }}
                >
                  Preview
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest mb-1.5">
              Color Palette
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setColor(p.value)}
                  className="w-6 h-6 border border-[#E5E5E1] hover:scale-110 transition-transform"
                  style={{ backgroundColor: p.value }}
                  title={p.label}
                />
              ))}
            </div>
          </div>

          <div className="bg-[#F9F9F8] p-4 border border-[#E5E5E1] space-y-3">
            <div className="text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest">
              Behavioral Rules
            </div>

            <label className="flex items-center gap-2.5 text-xs text-[#1A1A1A] cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={isOccupiedState}
                onChange={(e) => setIsOccupiedState(e.target.checked)}
                className="w-4 h-4 rounded-none border-[#E5E5E1] text-[#1A1A1A] focus:ring-0"
              />
              <span>Treat as "Occupied Capacity" in metrics</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-[#1A1A1A] cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={isMaintenanceState}
                onChange={(e) => setIsMaintenanceState(e.target.checked)}
                className="w-4 h-4 rounded-none border-[#E5E5E1] text-[#9E2A2B] focus:ring-0"
              />
              <span>Treat as "Maintenance / Out of Service"</span>
            </label>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest mb-1.5">
              Description / Notes
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="e.g. Deep cleaning turnover after member checkout..."
              className="w-full px-3 py-2 border border-[#E5E5E1] text-[#1A1A1A] text-xs focus:outline-none focus:border-[#1A1A1A]"
            />
          </div>

          <div className="pt-4 border-t border-[#E5E5E1] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#E5E5E1] text-[#666662] hover:bg-[#F0F0EE] font-bold text-[10px] uppercase tracking-widest transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 bg-[#1A1A1A] hover:bg-[#333330] text-white font-bold text-[10px] uppercase tracking-widest transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{statusToEdit ? 'Save Changes' : 'Create Status'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

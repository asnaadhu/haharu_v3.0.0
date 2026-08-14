import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useProperty } from '../../context/PropertyContext';
import { RoomType } from '../../types';
import { X, Tag, BedDouble, Save } from 'lucide-react';

interface RoomTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  typeToEdit?: RoomType | null;
}

const COLOR_OPTIONS = [
  { label: 'Black', value: '#1A1A1A' },
  { label: 'Charcoal', value: '#333330' },
  { label: 'Muted Taupe', value: '#A3A39F' },
  { label: 'Burgundy', value: '#9E2A2B' },
  { label: 'Navy', value: '#1D2A44' },
  { label: 'Forest', value: '#2A4436' },
  { label: 'Bronze', value: '#5C4033' },
  { label: 'Slate', value: '#666662' },
];

export const RoomTypeModal: React.FC<RoomTypeModalProps> = ({
  isOpen,
  onClose,
  typeToEdit,
}) => {
  const { addRoomType, updateRoomType } = useProperty();

  const [name, setName] = useState<string>('');
  const [defaultBedCount, setDefaultBedCount] = useState<number>(1);
  const [description, setDescription] = useState<string>('');
  const [badgeColor, setBadgeColor] = useState<string>('#1A1A1A');

  useEffect(() => {
    if (typeToEdit) {
      setName(typeToEdit.name);
      setDefaultBedCount(typeToEdit.defaultBedCount);
      setDescription(typeToEdit.description || '');
      setBadgeColor(typeToEdit.badgeColor || '#1A1A1A');
    } else {
      setName('');
      setDefaultBedCount(1);
      setDescription('');
      setBadgeColor('#1A1A1A');
    }
  }, [typeToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (typeToEdit) {
      updateRoomType(typeToEdit.id, name.trim(), defaultBedCount, description.trim(), badgeColor);
    } else {
      addRoomType(name.trim(), defaultBedCount, description.trim(), badgeColor);
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
            <Tag className="w-5 h-5 text-white" />
            <h3 className="font-bold text-lg">
              {typeToEdit ? 'Edit Room Type' : 'Add Custom Room Category'}
            </h3>
          </div>
          <button onClick={onClose} className="text-[#A3A39F] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest mb-1.5">
              Category Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 4-Bed Shared Dorm, Studio Suite"
              required
              className="w-full px-3 py-2 border border-[#E5E5E1] text-[#1A1A1A] text-xs font-semibold focus:outline-none focus:border-[#1A1A1A]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest mb-1.5 flex items-center gap-1">
              <BedDouble className="w-3.5 h-3.5 text-[#1A1A1A]" />
              <span>Default Beds per Room *</span>
            </label>
            <input
              type="number"
              min="1"
              max="16"
              value={defaultBedCount}
              onChange={(e) => setDefaultBedCount(Math.max(1, parseInt(e.target.value) || 1))}
              required
              className="w-full px-3 py-2 border border-[#E5E5E1] text-[#1A1A1A] text-xs font-bold focus:outline-none focus:border-[#1A1A1A]"
            />
            <p className="text-[10px] text-[#A3A39F] mt-1">
              New rooms configured with this category default to this bed count.
            </p>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest mb-1.5">
              Badge / Accent Color
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setBadgeColor(c.value)}
                  className={`w-7 h-7 rounded-none transition-transform border-2 ${
                    badgeColor === c.value ? 'border-[#1A1A1A] scale-110' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest mb-1.5">
              Category Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="e.g. Includes double lockers, workstation..."
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
              <span>{typeToEdit ? 'Save Changes' : 'Create Room Type'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

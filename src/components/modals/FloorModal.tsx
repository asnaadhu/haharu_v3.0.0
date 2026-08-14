import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useProperty } from '../../context/PropertyContext';
import { Floor } from '../../types';
import { X, Layers, Save } from 'lucide-react';

interface FloorModalProps {
  isOpen: boolean;
  onClose: () => void;
  floorToEdit?: Floor | null;
  defaultBuildingId?: string;
}

export const FloorModal: React.FC<FloorModalProps> = ({
  isOpen,
  onClose,
  floorToEdit,
  defaultBuildingId,
}) => {
  const { data, addFloor, updateFloor } = useProperty();

  const [buildingId, setBuildingId] = useState<string>('');
  const [number, setNumber] = useState<number>(1);
  const [label, setLabel] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  useEffect(() => {
    if (floorToEdit) {
      setBuildingId(floorToEdit.buildingId);
      setNumber(floorToEdit.number);
      setLabel(floorToEdit.label);
      setDescription(floorToEdit.description || '');
    } else {
      setBuildingId(defaultBuildingId || data.buildings[0]?.id || '');
      setNumber(1);
      setLabel('Floor 1');
      setDescription('');
    }
  }, [floorToEdit, defaultBuildingId, isOpen, data]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buildingId || !label.trim()) return;

    if (floorToEdit) {
      updateFloor(floorToEdit.id, number, label.trim(), description.trim());
    } else {
      addFloor(buildingId, number, label.trim(), description.trim());
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
            <Layers className="w-5 h-5 text-white" />
            <h3 className="font-bold text-lg">
              {floorToEdit ? 'Edit Floor' : 'Add Floor Level'}
            </h3>
          </div>
          <button onClick={onClose} className="text-[#A3A39F] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {!floorToEdit && (
            <div>
              <label className="block text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest mb-1.5">
                Assigned Building *
              </label>
              <select
                value={buildingId}
                onChange={(e) => setBuildingId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-[#E5E5E1] text-[#1A1A1A] text-xs font-semibold focus:outline-none focus:border-[#1A1A1A] bg-white"
              >
                {data.buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest mb-1.5">
                Floor Level # *
              </label>
              <input
                type="number"
                value={number}
                onChange={(e) => {
                  const num = parseInt(e.target.value) || 0;
                  setNumber(num);
                  if (!floorToEdit) {
                    setLabel(num === 0 ? 'Ground Floor' : `Floor ${num}`);
                  }
                }}
                required
                className="w-full px-3 py-2 border border-[#E5E5E1] text-[#1A1A1A] text-xs font-bold focus:outline-none focus:border-[#1A1A1A]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest mb-1.5">
                Floor Label *
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Ground Floor, Floor 2"
                required
                className="w-full px-3 py-2 border border-[#E5E5E1] text-[#1A1A1A] text-xs font-semibold focus:outline-none focus:border-[#1A1A1A]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest mb-1.5">
              Description / Layout Notes
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="e.g. Executive suite level..."
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
              <span>{floorToEdit ? 'Save Changes' : 'Create Floor'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

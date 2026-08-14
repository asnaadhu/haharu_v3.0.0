import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useProperty } from '../context/PropertyContext';
import { useAuth } from '../context/AuthContext';
import {
  MaintenanceRequest,
  MaintenanceCategory,
  MaintenanceUrgency,
  MaintenanceStatus,
} from '../types';
import {
  Wrench,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Kanban,
  List,
  Grid,
  UserCheck,
  Building,
  DoorClosed,
  BedDouble,
  Trash2,
  Edit3,
  Phone,
  ShieldAlert,
} from 'lucide-react';
import { CreateMaintenanceModal } from './modals/CreateMaintenanceModal';
import { EditMaintenanceModal } from './modals/EditMaintenanceModal';

const CATEGORIES: MaintenanceCategory[] = [
  'Plumbing',
  'Electrical',
  'HVAC',
  'Appliance',
  'Furniture',
  'Structural',
  'Cleaning',
  'General',
];

export const MaintenanceView: React.FC = () => {
  const { data, deleteMaintenanceRequest, completeMaintenanceRequest } = useProperty();
  const { currentUser, hasPermission } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'board' | 'table' | 'grid'>('board');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [ticketToDeleteId, setTicketToDeleteId] = useState<string | null>(null);

  const requests = data.maintenanceRequests || [];

  // Filter requests
  const filteredRequests = requests.filter((req) => {
    // Role based scoping: if Tenant, only show their own tickets
    if (currentUser.role === 'Tenant' && req.requesterId !== currentUser.id) {
      return false;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = req.title.toLowerCase().includes(q);
      const matchDesc = req.description.toLowerCase().includes(q);
      const matchRequester = req.requesterName.toLowerCase().includes(q);
      const matchTech = (req.assignedTechnician || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchRequester && !matchTech) return false;
    }

    if (selectedCategory !== 'ALL' && req.category !== selectedCategory) return false;
    if (selectedUrgency !== 'ALL' && req.urgency !== selectedUrgency) return false;
    if (selectedStatus !== 'ALL' && req.status !== selectedStatus) return false;
    if (selectedBuilding !== 'ALL' && req.buildingId !== selectedBuilding) return false;

    return true;
  });

  // Calculate statistics
  const totalCount = filteredRequests.length;
  const newCount = filteredRequests.filter((r) => r.status === 'New').length;
  const inProgressCount = filteredRequests.filter((r) => r.status === 'In Progress' || r.status === 'Pending Parts').length;
  const urgentCount = filteredRequests.filter((r) => r.urgency === 'Urgent' && r.status !== 'Completed').length;
  const completedCount = filteredRequests.filter((r) => r.status === 'Completed').length;

  const handleOpenEdit = (req: MaintenanceRequest) => {
    setSelectedRequest(req);
    setIsEditModalOpen(true);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTicketToDeleteId(id);
  };

  const confirmDeleteTicket = () => {
    if (ticketToDeleteId) {
      deleteMaintenanceRequest(ticketToDeleteId);
      setTicketToDeleteId(null);
    }
  };

  const handleQuickComplete = (req: MaintenanceRequest, e: React.MouseEvent) => {
    e.stopPropagation();
    completeMaintenanceRequest(req.id, 'Marked complete via dashboard action', true);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E5E1] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#A3A39F]">
              Facilities & Maintenance Operations
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A] mt-0.5">
            Maintenance Request Tickets
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggles */}
          <div className="flex items-center border border-[#E5E5E1] bg-white p-0.5">
            <button
              onClick={() => setViewMode('board')}
              className={`p-1.5 text-xs font-bold transition-colors flex items-center gap-1 ${
                viewMode === 'board' ? 'bg-[#1A1A1A] text-white' : 'text-[#666662] hover:text-[#1A1A1A]'
              }`}
              title="Kanban Board View"
            >
              <Kanban className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[10px] uppercase tracking-wider">Board</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 text-xs font-bold transition-colors flex items-center gap-1 ${
                viewMode === 'table' ? 'bg-[#1A1A1A] text-white' : 'text-[#666662] hover:text-[#1A1A1A]'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[10px] uppercase tracking-wider">Table</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 text-xs font-bold transition-colors flex items-center gap-1 ${
                viewMode === 'grid' ? 'bg-[#1A1A1A] text-white' : 'text-[#666662] hover:text-[#1A1A1A]'
              }`}
              title="Grid View"
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[10px] uppercase tracking-wider">Grid</span>
            </button>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#1A1A1A] hover:bg-[#333330] text-white font-bold text-[10px] uppercase tracking-widest transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Request Ticket</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white p-4 border border-[#E5E5E1] shadow-2xs">
          <span className="text-[10px] font-bold text-[#A3A39F] uppercase tracking-wider block">
            Total Tickets
          </span>
          <span className="font-bold text-2xl text-[#1A1A1A] mt-0.5 block">
            {totalCount}
          </span>
        </div>

        <div className="bg-white p-4 border border-[#E5E5E1] shadow-2xs border-l-4 border-l-amber-500">
          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600" /> New Unassigned
          </span>
          <span className="font-bold text-2xl text-[#1A1A1A] mt-0.5 block">
            {newCount}
          </span>
        </div>

        <div className="bg-white p-4 border border-[#E5E5E1] shadow-2xs border-l-4 border-l-blue-600">
          <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block flex items-center gap-1">
            <Wrench className="w-3 h-3 text-blue-600" /> In Progress
          </span>
          <span className="font-bold text-2xl text-[#1A1A1A] mt-0.5 block">
            {inProgressCount}
          </span>
        </div>

        <div className="bg-white p-4 border border-[#E5E5E1] shadow-2xs border-l-4 border-l-rose-600">
          <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-600" /> Urgent Attention
          </span>
          <span className="font-bold text-2xl text-rose-900 mt-0.5 block">
            {urgentCount}
          </span>
        </div>

        <div className="bg-white p-4 border border-[#E5E5E1] shadow-2xs border-l-4 border-l-emerald-600">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Completed
          </span>
          <span className="font-bold text-2xl text-[#1A1A1A] mt-0.5 block">
            {completedCount}
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#F9F9F8] p-4 border border-[#E5E5E1] flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#A3A39F]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tickets by title, description, requester or technician..."
            className="w-full pl-9 pr-3 py-1.5 border border-[#E5E5E1] text-xs font-medium text-[#1A1A1A] bg-white focus:outline-none focus:border-[#1A1A1A]"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Building */}
          <select
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(e.target.value)}
            className="px-2.5 py-1.5 border border-[#E5E5E1] text-[11px] font-bold text-[#1A1A1A] bg-white focus:outline-none"
          >
            <option value="ALL">All Buildings</option>
            {data.buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          {/* Category */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 border border-[#E5E5E1] text-[11px] font-bold text-[#1A1A1A] bg-white focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Urgency */}
          <select
            value={selectedUrgency}
            onChange={(e) => setSelectedUrgency(e.target.value)}
            className="px-2.5 py-1.5 border border-[#E5E5E1] text-[11px] font-bold text-[#1A1A1A] bg-white focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>

          {/* Status */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 border border-[#E5E5E1] text-[11px] font-bold text-[#1A1A1A] bg-white focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="New">New</option>
            <option value="In Progress">In Progress</option>
            <option value="Pending Parts">Pending Parts</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Main Content Render Modes */}
      {viewMode === 'board' ? (
        <KanbanBoardView
          requests={filteredRequests}
          onOpenEdit={handleOpenEdit}
          onQuickComplete={handleQuickComplete}
          onDelete={handleDelete}
        />
      ) : viewMode === 'table' ? (
        <TableView
          requests={filteredRequests}
          onOpenEdit={handleOpenEdit}
          onQuickComplete={handleQuickComplete}
          onDelete={handleDelete}
        />
      ) : (
        <GridView
          requests={filteredRequests}
          onOpenEdit={handleOpenEdit}
          onQuickComplete={handleQuickComplete}
          onDelete={handleDelete}
        />
      )}

      {/* Modals */}
      <CreateMaintenanceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <EditMaintenanceModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        request={selectedRequest}
      />

      {/* Ticket Delete Confirmation Modal */}
      {ticketToDeleteId && (
        <div className="fixed inset-0 z-50 bg-[#1A1A1A]/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="bg-white border border-[#E5E5E1] shadow-2xl max-w-md w-full overflow-hidden rounded-xs"
          >
            <div className="px-6 py-5 bg-[#1A1A1A] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Trash2 className="w-5 h-5 text-rose-400" />
                <h3 className="font-bold text-base">Delete Maintenance Ticket</h3>
              </div>
              <button
                type="button"
                onClick={() => setTicketToDeleteId(null)}
                className="text-[#A3A39F] hover:text-white p-1 transition-colors"
              >
                <span className="sr-only">Close</span>
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-[#666662] leading-relaxed">
                Are you sure you want to delete this maintenance ticket?
              </p>
              <p className="text-[11px] text-[#888880] bg-[#F9F9F8] p-3 border border-[#E5E5E1] rounded-xs">
                This will permanently delete the ticket record from the maintenance log and history. This action cannot be undone.
              </p>

              <div className="pt-3 border-t border-[#E5E5E1] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setTicketToDeleteId(null)}
                  className="px-4 py-2 border border-[#E5E5E1] text-[#666662] hover:bg-[#F0F0EE] font-bold text-[10px] uppercase tracking-widest transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteTicket}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] uppercase tracking-widest transition-colors shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Confirm Delete</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Kanban Board Component
// ---------------------------------------------------------------------------
interface ViewProps {
  requests: MaintenanceRequest[];
  onOpenEdit: (req: MaintenanceRequest) => void;
  onQuickComplete: (req: MaintenanceRequest, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

const KanbanBoardView: React.FC<ViewProps> = ({
  requests,
  onOpenEdit,
  onQuickComplete,
  onDelete,
}) => {
  const columns: { title: string; status: MaintenanceStatus; color: string }[] = [
    { title: 'New Tickets', status: 'New', color: 'border-amber-500 bg-amber-50/50' },
    { title: 'In Progress', status: 'In Progress', color: 'border-blue-500 bg-blue-50/50' },
    { title: 'Pending Parts', status: 'Pending Parts', color: 'border-purple-500 bg-purple-50/50' },
    { title: 'Completed', status: 'Completed', color: 'border-emerald-500 bg-emerald-50/50' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto pb-4">
      {columns.map((col) => {
        const colRequests = requests.filter((r) => r.status === col.status);
        return (
          <div
            key={col.status}
            className="bg-[#F9F9F8] border border-[#E5E5E1] p-3 space-y-3 flex flex-col min-h-[400px]"
          >
            {/* Column Header */}
            <div className={`p-2.5 border-l-4 ${col.color} bg-white border border-[#E5E5E1] flex items-center justify-between`}>
              <h3 className="font-bold text-sm text-[#1A1A1A]">
                {col.title}
              </h3>
              <span className="text-[10px] font-bold bg-[#1A1A1A] text-white px-2 py-0.5 rounded-xs">
                {colRequests.length}
              </span>
            </div>

            {/* Cards List */}
            <div className="space-y-3 flex-1">
              {colRequests.length === 0 ? (
                <div className="h-32 flex items-center justify-center text-[10px] text-[#A3A39F] font-bold uppercase tracking-wider border border-dashed border-[#E5E5E1]">
                  No tickets
                </div>
              ) : (
                colRequests.map((req) => (
                  <MaintenanceCard
                    key={req.id}
                    request={req}
                    onOpenEdit={onOpenEdit}
                    onQuickComplete={onQuickComplete}
                    onDelete={onDelete}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Single Maintenance Card Component
// ---------------------------------------------------------------------------
const MaintenanceCard: React.FC<{
  request: MaintenanceRequest;
  onOpenEdit: (req: MaintenanceRequest) => void;
  onQuickComplete: (req: MaintenanceRequest, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}> = ({ request, onOpenEdit, onQuickComplete, onDelete }) => {
  const { data } = useProperty();
  const building = data.buildings.find((b) => b.id === request.buildingId);
  const room = data.rooms.find((r) => r.id === request.roomId);
  const bed = data.beds.find((b) => b.id === request.bedId);

  return (
    <div
      onClick={() => onOpenEdit(request)}
      className="bg-white p-3.5 border border-[#E5E5E1] shadow-2xs hover:border-[#1A1A1A] hover:shadow-md transition-all cursor-pointer space-y-2.5 group"
    >
      {/* Category Tag & Priority Badge */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#1A1A1A] text-white">
          {request.category}
        </span>

        <span
          className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border ${
            request.urgency === 'Urgent'
              ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
              : request.urgency === 'High'
              ? 'bg-orange-100 text-orange-800 border-orange-300'
              : request.urgency === 'Medium'
              ? 'bg-amber-100 text-amber-800 border-amber-300'
              : 'bg-slate-100 text-slate-700 border-slate-300'
          }`}
        >
          {request.urgency}
        </span>
      </div>

      {/* Title */}
      <h4 className="font-bold text-sm text-[#1A1A1A] group-hover:text-amber-700 transition-colors line-clamp-2">
        {request.title}
      </h4>

      {/* Location */}
      <div className="text-[11px] text-[#666662] flex items-center gap-1">
        <Building className="w-3 h-3 text-[#A3A39F] shrink-0" />
        <span className="truncate">
          {building?.name || 'Building'} &bull; Room #{room?.roomNumber || 'Room'}
          {bed ? ` (${bed.label})` : ''}
        </span>
      </div>

      {/* Requester & Technician */}
      <div className="pt-2 border-t border-[#E5E5E1] text-[10px] space-y-1">
        <div className="flex justify-between text-[#666662]">
          <span>By: <strong className="text-[#1A1A1A]">{request.requesterName}</strong></span>
          <span className="text-[#A3A39F]">{new Date(request.createdAt).toLocaleDateString()}</span>
        </div>

        {request.assignedTechnician ? (
          <div className="flex items-center gap-1 text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5">
            <UserCheck className="w-3 h-3 text-emerald-600" />
            <span>Assigned: {request.assignedTechnician}</span>
          </div>
        ) : (
          <div className="text-amber-800 font-semibold bg-amber-50 px-2 py-0.5">
            Pending technician assignment
          </div>
        )}
      </div>

      {/* Quick Action Footer */}
      <div className="pt-2 flex items-center justify-between text-[10px] opacity-90 group-hover:opacity-100">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenEdit(request);
          }}
          className="text-[#1A1A1A] hover:underline font-bold flex items-center gap-1"
        >
          <Edit3 className="w-3 h-3" /> Edit / Assign
        </button>

        <div className="flex items-center gap-2">
          {request.status !== 'Completed' && (
            <button
              onClick={(e) => onQuickComplete(request, e)}
              className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 border border-emerald-200"
              title="Mark Completed"
            >
              <CheckCircle2 className="w-3 h-3" /> Complete
            </button>
          )}

          <button
            onClick={(e) => onDelete(request.id, e)}
            className="text-slate-400 hover:text-rose-600 p-1"
            title="Delete Ticket"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Table View Component
// ---------------------------------------------------------------------------
const TableView: React.FC<ViewProps> = ({
  requests,
  onOpenEdit,
  onQuickComplete,
  onDelete,
}) => {
  const { data } = useProperty();

  return (
    <div className="bg-white border border-[#E5E5E1] overflow-x-auto shadow-2xs">
      <table className="w-full text-left text-xs font-sans">
        <thead className="bg-[#1A1A1A] text-white text-[10px] uppercase tracking-wider font-bold">
          <tr>
            <th className="py-3 px-4">Ticket</th>
            <th className="py-3 px-4">Category</th>
            <th className="py-3 px-4">Location</th>
            <th className="py-3 px-4">Priority</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4">Assigned Tech</th>
            <th className="py-3 px-4">Submitted By</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E5E5E1]">
          {requests.length === 0 ? (
            <tr>
              <td colSpan={8} className="py-8 text-center text-[#A3A39F]">
                No maintenance tickets match the active filters.
              </td>
            </tr>
          ) : (
            requests.map((req) => {
              const building = data.buildings.find((b) => b.id === req.buildingId);
              const room = data.rooms.find((r) => r.id === req.roomId);
              const bed = data.beds.find((b) => b.id === req.bedId);

              return (
                <tr
                  key={req.id}
                  onClick={() => onOpenEdit(req)}
                  className="hover:bg-[#F9F9F8] transition-colors cursor-pointer"
                >
                  <td className="py-3 px-4 font-bold text-[#1A1A1A]">
                    <div className="text-sm font-bold">{req.title}</div>
                    <div className="text-[10px] text-[#A3A39F] font-normal">
                      #{req.id.replace('maint-', '')} &bull; {new Date(req.createdAt).toLocaleDateString()}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#1A1A1A] text-white">
                      {req.category}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-[#666662]">
                    <div className="font-semibold text-[#1A1A1A]">{building?.name}</div>
                    <div className="text-[10px] text-[#A3A39F]">
                      Room #{room?.roomNumber} {bed ? `(${bed.label})` : ''}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border ${
                        req.urgency === 'Urgent'
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : req.urgency === 'High'
                          ? 'bg-orange-100 text-orange-800 border-orange-300'
                          : req.urgency === 'Medium'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      {req.urgency}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-bold">
                    <span
                      className={`text-[10px] ${
                        req.status === 'Completed'
                          ? 'text-emerald-700'
                          : req.status === 'In Progress'
                          ? 'text-blue-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {req.status}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-[#1A1A1A]">
                    {req.assignedTechnician ? (
                      <span className="font-semibold flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-emerald-600" />
                        {req.assignedTechnician}
                      </span>
                    ) : (
                      <span className="text-[#A3A39F] text-[11px]">Unassigned</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-[#666662]">
                    {req.requesterName} ({req.requesterRole})
                  </td>

                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenEdit(req);
                      }}
                      className="px-2.5 py-1 bg-[#1A1A1A] text-white text-[10px] font-bold uppercase tracking-wider"
                    >
                      Manage
                    </button>
                    <button
                      onClick={(e) => onDelete(req.id, e)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5 inline" />
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Grid View Component
// ---------------------------------------------------------------------------
const GridView: React.FC<ViewProps> = ({
  requests,
  onOpenEdit,
  onQuickComplete,
  onDelete,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {requests.length === 0 ? (
        <div className="col-span-3 py-12 text-center text-[#A3A39F] bg-white border border-[#E5E5E1]">
          No maintenance tickets match the selected criteria.
        </div>
      ) : (
        requests.map((req) => (
          <MaintenanceCard
            key={req.id}
            request={req}
            onOpenEdit={onOpenEdit}
            onQuickComplete={onQuickComplete}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  );
};

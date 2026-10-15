import React, { useState, useMemo } from 'react';
import { useParking } from '../context/ParkingContext';
import { useToast } from '../context/ToastContext';
import { SlotCard } from '../components/slots/SlotCard';
import { SlotDetailsModal } from '../components/slots/SlotDetailsModal';
import { ParkingSlot, ZoneId, SlotType, SlotStatus, ZONE_INFO, ActiveTicket } from '../types/parking';
import {
  Search,
  Filter,
  CheckCircle2,
  Accessibility,
  Zap,
  Bike,
  Car,
  ShieldAlert,
  Clock,
  RotateCcw,
  LayoutGrid,
  List,
  AlertTriangle,
  ArrowRight,
  LogOut,
  Wrench,
  Sparkles,
} from 'lucide-react';
import { getSlotTypeLabel, formatDateTime, formatCurrency } from '../utils/formatters';

interface AvailabilityProps {
  onNavigateToSlot?: (slotId: string) => void;
  onOpenEntryWithSlot?: (slotId: string) => void;
  onOpenExitWithPlate?: (plate: string) => void;
}

export const Availability: React.FC<AvailabilityProps> = ({
  onNavigateToSlot,
  onOpenEntryWithSlot,
  onOpenExitWithPlate,
}) => {
  const { slots, activeTickets, setSlotStatusManually, exitVehicle } = useParking();
  const { showToast } = useToast();

  // Filters state
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // View Mode: 'grid' or 'table'
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Selected slot for full details modal
  const [activeModalSlot, setActiveModalSlot] = useState<ParkingSlot | null>(null);

  // Confirmation modal state for invalid status change attempts (e.g. marking occupied slot available)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    slotId: string;
    targetStatus: SlotStatus;
    parkedVehicle?: ActiveTicket;
    message: string;
  } | null>(null);

  // Quick Occupy Prompt Modal
  const [occupyPrompt, setOccupyPrompt] = useState<{
    isOpen: boolean;
    slotId: string;
    plateInput: string;
  } | null>(null);

  // Filtered Slots
  const filteredSlots = useMemo(() => {
    return slots.filter((slot) => {
      if (selectedZone !== 'ALL' && slot.zone !== selectedZone) return false;
      if (selectedStatus !== 'ALL' && slot.status !== selectedStatus) return false;
      if (selectedType !== 'ALL' && slot.type !== selectedType) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toUpperCase();
        const matchesSlot = slot.id.toUpperCase().includes(query);
        const matchesPlate = slot.currentVehiclePlate
          ? slot.currentVehiclePlate.toUpperCase().includes(query)
          : false;
        return matchesSlot || matchesPlate;
      }
      return true;
    });
  }, [slots, selectedZone, selectedStatus, selectedType, searchQuery]);

  // Overall Counts
  const totalCount = slots.length;
  const availableSlots = slots.filter((s) => s.status === 'AVAILABLE');
  const occupiedSlots = slots.filter((s) => s.status === 'OCCUPIED');
  const reservedSlots = slots.filter((s) => s.status === 'RESERVED');
  const maintenanceSlots = slots.filter((s) => s.status === 'MAINTENANCE');

  const accessibleTotal = slots.filter((s) => s.type === 'ACCESSIBLE').length;
  const accessibleAvailable = slots.filter((s) => s.type === 'ACCESSIBLE' && s.status === 'AVAILABLE').length;

  const evTotal = slots.filter((s) => s.type === 'EV_CHARGING').length;
  const evAvailable = slots.filter((s) => s.type === 'EV_CHARGING' && s.status === 'AVAILABLE').length;

  // Handle Quick Status Change Request from Dropdowns
  const handleQuickStatusChange = (slot: ParkingSlot, targetStatus: SlotStatus) => {
    if (slot.status === targetStatus) return;

    // Business rule: Prevent directly marking an occupied space as available without checkout
    if (targetStatus === 'AVAILABLE' && slot.status === 'OCCUPIED') {
      const ticket = activeTickets.find((t) => t.slotId === slot.id);
      setConfirmDialog({
        isOpen: true,
        slotId: slot.id,
        targetStatus,
        parkedVehicle: ticket,
        message: `Vehicle ${slot.currentVehiclePlate || ticket?.vehiclePlate || 'Unknown'} is currently parked in bay ${slot.id}. Marking it available directly without checkout is prohibited to prevent invalid parking states.`,
      });
      return;
    }

    // If changing to occupied, prompt for plate or quick-occupy
    if (targetStatus === 'OCCUPIED') {
      setOccupyPrompt({
        isOpen: true,
        slotId: slot.id,
        plateInput: '',
      });
      return;
    }

    // Call manual status setter
    const res = setSlotStatusManually(slot.id, targetStatus);
    if (res.success) {
      showToast('success', 'Status Updated', res.message);
    } else {
      showToast('error', 'Change Prevented', res.message);
    }
  };

  // Confirm forced release/checkout
  const handleConfirmRelease = () => {
    if (!confirmDialog) return;
    if (confirmDialog.parkedVehicle) {
      const res = exitVehicle(confirmDialog.parkedVehicle.ticketId);
      if (res.success) {
        showToast('success', 'Vehicle Checked Out', res.message);
      } else {
        showToast('error', 'Error', res.message);
      }
    } else {
      const res = setSlotStatusManually(confirmDialog.slotId, 'AVAILABLE', { forceRelease: true });
      if (res.success) {
        showToast('success', 'Bay Released', res.message);
      }
    }
    setConfirmDialog(null);
  };

  // Confirm quick occupy
  const handleConfirmOccupy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!occupyPrompt) return;

    const plate = occupyPrompt.plateInput.trim().toUpperCase() || `MAN-${occupyPrompt.slotId.replace('-', '')}-${Math.floor(10 + Math.random() * 90)}`;
    const res = setSlotStatusManually(occupyPrompt.slotId, 'OCCUPIED', {
      vehiclePlate: plate,
      driverName: 'Direct Campus Entry',
    });

    if (res.success) {
      showToast('success', 'Bay Occupied', res.message);
      setOccupyPrompt(null);
    } else {
      showToast('error', 'Occupy Error', res.message);
    }
  };

  const resetFilters = () => {
    setSelectedZone('ALL');
    setSelectedStatus('ALL');
    setSelectedType('ALL');
    setSearchQuery('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner: Total Available & Occupied Prominent Display */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Parking Space Availability Management
            </h2>
            <p className="text-xs text-slate-500">
              Check and manually manage space statuses with real-time validation and synchronization.
            </p>
          </div>

          {/* View Mode Toggle: Grid vs Table */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Visual Grid
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Management Table
            </button>
          </div>
        </div>

        {/* Prominent High-Visibility Status Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-2">
          {/* Total */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 uppercase block">Total Spaces</span>
            <span className="text-2xl font-extrabold text-slate-900">{totalCount}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">4 Zones (A, B, C, D)</span>
          </div>

          {/* Available (Green) */}
          <div className="p-3 rounded-xl bg-emerald-50 border-2 border-emerald-300">
            <span className="text-[11px] font-bold text-emerald-800 uppercase block flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Available (Green)
            </span>
            <span className="text-2xl font-extrabold text-emerald-700">{availableSlots.length}</span>
            <span className="text-[10px] text-emerald-700/80 block mt-0.5">Ready for parking</span>
          </div>

          {/* Occupied (Red) */}
          <div className="p-3 rounded-xl bg-rose-50 border-2 border-rose-300">
            <span className="text-[11px] font-bold text-rose-800 uppercase block flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Occupied (Red)
            </span>
            <span className="text-2xl font-extrabold text-rose-700">{occupiedSlots.length}</span>
            <span className="text-[10px] text-rose-700/80 block mt-0.5">Active vehicles</span>
          </div>

          {/* Reserved (Purple) */}
          <div className="p-3 rounded-xl bg-purple-50 border-2 border-purple-300">
            <span className="text-[11px] font-bold text-purple-800 uppercase block flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-500" /> Reserved (Purple)
            </span>
            <span className="text-2xl font-extrabold text-purple-700">{reservedSlots.length}</span>
            <span className="text-[10px] text-purple-700/80 block mt-0.5">Advance bookings</span>
          </div>

          {/* Maintenance (Gray) */}
          <div className="p-3 rounded-xl bg-slate-100 border-2 border-slate-300">
            <span className="text-[11px] font-bold text-slate-700 uppercase block flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-500" /> Maintenance (Gray)
            </span>
            <span className="text-2xl font-extrabold text-slate-700">{maintenanceSlots.length}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Out of service</span>
          </div>

          {/* Accessible & EV quick indicator */}
          <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200">
            <span className="text-[11px] font-bold text-blue-800 uppercase block">Special Bays Free</span>
            <div className="text-xs font-semibold text-blue-900 mt-1 space-y-0.5">
              <div>♿ Accessible: <strong className="text-blue-700 font-mono">{accessibleAvailable}/{accessibleTotal}</strong></div>
              <div>⚡ EV Ports: <strong className="text-purple-700 font-mono">{evAvailable}/{evTotal}</strong></div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by space ID (e.g. A-01, B-02) or vehicle license plate..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Zone Selector */}
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">All Zones (A, B, C, D)</option>
            <option value="A">Zone A - North Wing (Ground)</option>
            <option value="B">Zone B - South Courtyard (Ground)</option>
            <option value="C">Zone C - Level 1 EV Concourse</option>
            <option value="D">Zone D - Level 2 Two-Wheelers</option>
          </select>

          {/* Status Selector */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="AVAILABLE">Available Only (Green)</option>
            <option value="OCCUPIED">Occupied Only (Red)</option>
            <option value="RESERVED">Reserved Only (Purple)</option>
            <option value="MAINTENANCE">Maintenance Only (Gray)</option>
          </select>

          {/* Vehicle Type Selector */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">All Bay Categories</option>
            <option value="ACCESSIBLE">Accessible Bays (♿)</option>
            <option value="EV_CHARGING">EV Fast Charging (⚡)</option>
            <option value="STANDARD_4W">Standard 4-Wheeler (🚗)</option>
            <option value="COMPACT_2W">Two-Wheeler Only (🏍️)</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        {(selectedZone !== 'ALL' || selectedStatus !== 'ALL' || selectedType !== 'ALL' || searchQuery) && (
          <button
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Filters
          </button>
        )}
      </div>

      {/* Main View: Grid Mode */}
      {viewMode === 'grid' && (
        <div className="space-y-8">
          {(['A', 'B', 'C', 'D'] as ZoneId[])
            .filter((z) => selectedZone === 'ALL' || selectedZone === z)
            .map((zoneId) => {
              const zoneSlots = filteredSlots.filter((s) => s.zone === zoneId);
              if (zoneSlots.length === 0) return null;
              const info = ZONE_INFO[zoneId];

              return (
                <div key={zoneId} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                  {/* Zone Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                        {zoneId}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{info.name}</h3>
                        <p className="text-xs text-slate-500">
                          {info.levelName} • {info.description}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-slate-500">
                      Showing {zoneSlots.length} of {info.totalSlots} spaces
                    </span>
                  </div>

                  {/* Slot Cards Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {zoneSlots.map((slot) => (
                      <SlotCard
                        key={slot.id}
                        slot={slot}
                        onClick={(clicked) => setActiveModalSlot(clicked)}
                        onQuickStatusChange={handleQuickStatusChange}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Main View: Table Management Mode */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Space Status Management Table ({filteredSlots.length} Spaces)
              </h3>
              <p className="text-xs text-slate-500">
                Directly change space statuses using the dropdown in each row.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Space ID</th>
                  <th className="py-3 px-4">Zone</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Current Status</th>
                  <th className="py-3 px-4">Parked Vehicle</th>
                  <th className="py-3 px-4">Distances</th>
                  <th className="py-3 px-4 text-right">Quick Change Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSlots.map((slot) => {
                  let statusBadgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                  if (slot.status === 'OCCUPIED') statusBadgeClass = 'bg-rose-100 text-rose-800 border-rose-300';
                  if (slot.status === 'RESERVED') statusBadgeClass = 'bg-purple-100 text-purple-800 border-purple-300';
                  if (slot.status === 'MAINTENANCE') statusBadgeClass = 'bg-slate-200 text-slate-800 border-slate-300';

                  return (
                    <tr key={slot.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-extrabold text-blue-600 text-base">
                        {slot.id}
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold text-slate-700">
                        Zone {slot.zone} ({slot.level === 0 ? 'Ground' : `L${slot.level}`})
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-800 font-medium">
                        {getSlotTypeLabel(slot.type)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${statusBadgeClass}`}>
                          {slot.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {slot.currentVehiclePlate ? (
                          <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            {slot.currentVehiclePlate}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">None</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        G1: {slot.distanceToGate1}m • G2: {slot.distanceToGate2}m
                      </td>
                      <td className="py-3 px-4 text-right">
                        <select
                          value={slot.status}
                          onChange={(e) => handleQuickStatusChange(slot, e.target.value as SlotStatus)}
                          className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
                        >
                          <option value="AVAILABLE">Mark Available (Green)</option>
                          <option value="OCCUPIED">Mark Occupied (Red)</option>
                          <option value="RESERVED">Mark Reserved (Purple)</option>
                          <option value="MAINTENANCE">Mark Maintenance (Gray)</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Dialog to Prevent Invalid Direct Available Marking */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-amber-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-base">Vehicle Check-Out Required</h3>
              </div>
              <button
                onClick={() => setConfirmDialog(null)}
                className="text-white hover:opacity-80"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-700 leading-relaxed">
                {confirmDialog.message}
              </p>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <div>Space ID: <strong className="font-mono text-slate-900">{confirmDialog.slotId}</strong></div>
                <div>Current Plate: <strong className="font-mono text-slate-900">{confirmDialog.parkedVehicle?.vehiclePlate || 'Unknown'}</strong></div>
                {confirmDialog.parkedVehicle && (
                  <div>Ticket: <strong className="font-mono text-slate-900">{confirmDialog.parkedVehicle.ticketId}</strong></div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setConfirmDialog(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRelease}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Process Check-Out & Release Space
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Occupy Modal */}
      {occupyPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-base">Mark Space {occupyPrompt.slotId} as Occupied</h3>
              <button
                onClick={() => setOccupyPrompt(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmOccupy} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Vehicle License Plate (Optional)
                </label>
                <input
                  type="text"
                  value={occupyPrompt.plateInput}
                  onChange={(e) =>
                    setOccupyPrompt({ ...occupyPrompt, plateInput: e.target.value.toUpperCase() })
                  }
                  placeholder={`e.g. KA-01-AB-1234 or leave blank for auto`}
                  className="w-full px-3.5 py-2 text-sm font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Leave blank to auto-generate a valid temporary registration number.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setOccupyPrompt(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Confirm & Mark Occupied
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Slot Details Modal */}
      {activeModalSlot && (
        <SlotDetailsModal
          slot={activeModalSlot}
          onClose={() => setActiveModalSlot(null)}
          onNavigateToSlot={onNavigateToSlot}
          onOpenEntryWithSlot={onOpenEntryWithSlot}
          onOpenExitWithPlate={onOpenExitWithPlate}
        />
      )}
    </div>
  );
};

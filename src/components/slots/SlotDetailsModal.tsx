import React, { useState } from 'react';
import { ParkingSlot, ActiveTicket, SlotStatus, VehicleType } from '../../types/parking';
import { useParking } from '../../context/ParkingContext';
import { useToast } from '../../context/ToastContext';
import {
  formatDateTime,
  formatDuration,
  formatCurrency,
  getSlotTypeLabel,
  getVehicleTypeLabel,
} from '../../utils/formatters';
import {
  X,
  MapPin,
  Clock,
  DollarSign,
  Car,
  ShieldAlert,
  ArrowRight,
  LogOut,
  CalendarCheck,
  Wrench,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Settings,
} from 'lucide-react';

interface SlotDetailsModalProps {
  slot: ParkingSlot | null;
  onClose: () => void;
  onNavigateToSlot?: (slotId: string) => void;
  onOpenEntryWithSlot?: (slotId: string) => void;
  onOpenExitWithPlate?: (plate: string) => void;
}

export const SlotDetailsModal: React.FC<SlotDetailsModalProps> = ({
  slot,
  onClose,
  onNavigateToSlot,
  onOpenEntryWithSlot,
  onOpenExitWithPlate,
}) => {
  const {
    activeTickets,
    reservations,
    currentTime,
    cancelReservation,
    checkInReservation,
    setSlotStatusManually,
    exitVehicle,
  } = useParking();
  const { showToast } = useToast();

  // Status Change State
  const [selectedNewStatus, setSelectedNewStatus] = useState<SlotStatus | ''>('');
  const [occupyPlate, setOccupyPlate] = useState<string>('');
  const [isOccupyFormOpen, setIsOccupyFormOpen] = useState<boolean>(false);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState<boolean>(false);

  if (!slot) return null;

  const activeTicket = activeTickets.find((t) => t.slotId === slot.id);
  const activeReservation = reservations.find((r) => r.slotId === slot.id && r.status === 'ACTIVE');

  // Elapsed time & fee if occupied
  let elapsedMinutes = 0;
  let runningFee = 0;
  if (activeTicket) {
    elapsedMinutes = Math.max(1, Math.round((currentTime - activeTicket.entryTime) / (1000 * 60)));
    const billableHours = Math.max(0.5, Math.ceil(elapsedMinutes / 30) * 0.5);
    runningFee = Number((billableHours * activeTicket.hourlyRate).toFixed(2));
  }

  // Handle manual status change
  const handleStatusChangeRequest = (targetStatus: SlotStatus) => {
    if (targetStatus === slot.status) return;

    if (targetStatus === 'AVAILABLE' && slot.status === 'OCCUPIED') {
      // Prevent invalid direct change without checkout
      setShowCheckoutConfirm(true);
      return;
    }

    if (targetStatus === 'OCCUPIED') {
      setIsOccupyFormOpen(true);
      setSelectedNewStatus('OCCUPIED');
      return;
    }

    const res = setSlotStatusManually(slot.id, targetStatus);
    if (res.success) {
      showToast('success', 'Status Updated', res.message);
      onClose();
    } else {
      showToast('error', 'Status Change Prevented', res.message);
    }
  };

  const handleConfirmOccupy = (e: React.FormEvent) => {
    e.preventDefault();
    const plate = occupyPlate.trim().toUpperCase() || `MAN-${slot.id.replace('-', '')}-${Math.floor(10 + Math.random() * 90)}`;
    const res = setSlotStatusManually(slot.id, 'OCCUPIED', {
      vehiclePlate: plate,
      driverName: 'Direct Entry',
    });

    if (res.success) {
      showToast('success', 'Bay Occupied', res.message);
      setIsOccupyFormOpen(false);
      onClose();
    } else {
      showToast('error', 'Occupy Error', res.message);
    }
  };

  const handleConfirmCheckoutAndRelease = () => {
    if (activeTicket) {
      const res = exitVehicle(activeTicket.ticketId);
      if (res.success) {
        showToast('success', 'Vehicle Checked Out', res.message);
        setShowCheckoutConfirm(false);
        onClose();
      } else {
        showToast('error', 'Checkout Error', res.message);
      }
    } else {
      const res = setSlotStatusManually(slot.id, 'AVAILABLE', { forceRelease: true });
      if (res.success) {
        showToast('success', 'Bay Released', res.message);
        setShowCheckoutConfirm(false);
        onClose();
      }
    }
  };

  const handleCancelReservation = () => {
    if (!activeReservation) return;
    const res = cancelReservation(activeReservation.reservationId);
    if (res.success) {
      showToast('success', 'Reservation Cancelled', res.message);
      onClose();
    } else {
      showToast('error', 'Error', res.message);
    }
  };

  const handleCheckInReservation = () => {
    if (!activeReservation) return;
    const res = checkInReservation(activeReservation.reservationId);
    if (res.success) {
      showToast('success', 'Vehicle Checked In', res.message);
      onClose();
    } else {
      showToast('error', 'Error', res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-extrabold text-white text-lg">
              {slot.id}
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Parking Bay {slot.id}</h3>
              <p className="text-xs text-slate-400">
                Zone {slot.zone} • {slot.level === 0 ? 'Ground Floor' : `Level ${slot.level}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Status Ribbon & Manual Status Dropdown */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 block">Bay Specification</span>
                <span className="font-semibold text-slate-800 text-sm">{getSlotTypeLabel(slot.type)}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Current Status</span>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    slot.status === 'AVAILABLE'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : slot.status === 'OCCUPIED'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : slot.status === 'RESERVED'
                      ? 'bg-purple-100 text-purple-800 border border-purple-300'
                      : 'bg-slate-200 text-slate-800 border border-slate-300'
                  }`}
                >
                  {slot.status}
                </span>
              </div>
            </div>

            {/* Quick Status Control Dropdown */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-blue-600" />
                Change Status:
              </label>
              <select
                value={slot.status}
                onChange={(e) => handleStatusChangeRequest(e.target.value as SlotStatus)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
              >
                <option value="AVAILABLE">Mark as Available (Green)</option>
                <option value="OCCUPIED">Mark as Occupied (Red)</option>
                <option value="RESERVED">Mark as Reserved (Purple)</option>
                <option value="MAINTENANCE">Mark as Maintenance (Gray)</option>
              </select>
            </div>
          </div>

          {/* Validation Notice when Checkout Confirmation is needed */}
          {showCheckoutConfirm && activeTicket && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 space-y-3 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-900 text-sm">Active Vehicle Parked</h4>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                    Vehicle <strong className="font-mono">{activeTicket.vehiclePlate}</strong> is currently recorded in this bay. To maintain system consistency and record billing, please process checkout rather than forcing availability.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCheckoutConfirm(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 font-medium hover:bg-amber-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCheckoutAndRelease}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-2xs cursor-pointer"
                >
                  Confirm Checkout & Release Bay
                </button>
              </div>
            </div>
          )}

          {/* Inline Occupy Input Form */}
          {isOccupyFormOpen && (
            <form onSubmit={handleConfirmOccupy} className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 space-y-3 animate-in fade-in">
              <h4 className="font-bold text-blue-900 text-xs uppercase tracking-wider">
                Mark Space as Occupied
              </h4>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Vehicle License Plate (Optional - auto-generates if empty)
                </label>
                <input
                  type="text"
                  value={occupyPlate}
                  onChange={(e) => setOccupyPlate(e.target.value.toUpperCase())}
                  placeholder={`e.g. KA-01-AB-1234 or FAC-${slot.id}`}
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg uppercase"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsOccupyFormOpen(false)}
                  className="px-3 py-1 text-xs text-slate-600 hover:bg-blue-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs cursor-pointer"
                >
                  Set to Occupied
                </button>
              </div>
            </form>
          )}

          {/* Occupied State Details */}
          {slot.status === 'OCCUPIED' && activeTicket && (
            <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-rose-200/70 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
                  Active Vehicle Session
                </span>
                <span className="font-mono text-xs text-rose-700">Ticket: {activeTicket.ticketId}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs text-slate-500 block">Vehicle Registration</span>
                  <span className="font-mono font-bold text-slate-900 text-base">{activeTicket.vehiclePlate}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Driver Name</span>
                  <span className="font-medium text-slate-800">{activeTicket.driverName || 'Visitor'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Entry Time</span>
                  <span className="text-xs font-medium text-slate-800">{formatDateTime(activeTicket.entryTime)}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Parked Duration</span>
                  <span className="font-bold text-slate-900 text-sm">{formatDuration(elapsedMinutes)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-rose-200/70 text-sm">
                <span className="text-slate-600 font-medium">Running Calculated Fee</span>
                <span className="text-lg font-extrabold text-rose-700">{formatCurrency(runningFee)}</span>
              </div>
            </div>
          )}

          {/* Reserved State Details - Purple Theme */}
          {slot.status === 'RESERVED' && activeReservation && (
            <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-purple-200/70 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-800">
                  Confirmed Reservation
                </span>
                <span className="font-mono text-xs text-purple-700">{activeReservation.reservationId}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs text-slate-500 block">Vehicle Plate</span>
                  <span className="font-mono font-bold text-slate-900">{activeReservation.vehiclePlate}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Reserved For</span>
                  <span className="font-medium text-slate-800">{activeReservation.driverName}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Phone</span>
                  <span className="font-medium text-slate-800">{activeReservation.driverPhone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Valid Until</span>
                  <span className="text-xs font-medium text-slate-800">{formatDateTime(activeReservation.validUntil)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Distances & Navigation Specs */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 block">Distance from Gate 1 (North)</span>
              <span className="font-bold text-slate-900 text-sm">{slot.distanceToGate1} meters</span>
            </div>
            <div>
              <span className="text-slate-500 block">Distance from Gate 2 (South)</span>
              <span className="font-bold text-slate-900 text-sm">{slot.distanceToGate2} meters</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          {/* Left Action: Navigation button */}
          {onNavigateToSlot && (
            <button
              type="button"
              onClick={() => {
                onNavigateToSlot(slot.id);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5" />
              Shortest Path Route
            </button>
          )}

          {/* Right Actions depending on status */}
          <div className="flex items-center gap-2 ml-auto">
            {slot.status === 'AVAILABLE' && (
              <>
                <button
                  type="button"
                  onClick={() => handleStatusChangeRequest('MAINTENANCE')}
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-xl transition-colors cursor-pointer"
                >
                  <Wrench className="w-3.5 h-3.5 inline mr-1" />
                  Maintenance
                </button>
                {onOpenEntryWithSlot && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenEntryWithSlot(slot.id);
                      onClose();
                    }}
                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Park Vehicle Here
                  </button>
                )}
              </>
            )}

            {slot.status === 'OCCUPIED' && activeTicket && onOpenExitWithPlate && (
              <button
                type="button"
                onClick={() => {
                  onOpenExitWithPlate(activeTicket.vehiclePlate);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Process Exit & Pay (${runningFee.toFixed(2)})
              </button>
            )}

            {slot.status === 'RESERVED' && activeReservation && (
              <>
                <button
                  type="button"
                  onClick={handleCancelReservation}
                  className="px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel Reservation
                </button>
                <button
                  type="button"
                  onClick={handleCheckInReservation}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <CalendarCheck className="w-4 h-4" />
                  Check-In Now
                </button>
              </>
            )}

            {slot.status === 'MAINTENANCE' && (
              <button
                type="button"
                onClick={() => handleStatusChangeRequest('AVAILABLE')}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Mark as Available
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

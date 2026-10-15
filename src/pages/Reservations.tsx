import React, { useState } from 'react';
import { useParking } from '../context/ParkingContext';
import { useToast } from '../context/ToastContext';
import { Reservation, VehicleType, ZoneId } from '../types/parking';
import {
  formatDateTime,
  formatDuration,
  getVehicleTypeLabel,
} from '../utils/formatters';
import {
  CalendarClock,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Car,
  LogIn,
  AlertCircle,
} from 'lucide-react';

interface ReservationsProps {
  onOpenEntryWithSlot?: (slotId: string) => void;
}

export const Reservations: React.FC<ReservationsProps> = ({ onOpenEntryWithSlot }) => {
  const {
    reservations,
    slots,
    reserveSlot,
    cancelReservation,
    checkInReservation,
    currentTime,
  } = useParking();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE');

  // Form State
  const [vehiclePlate, setVehiclePlate] = useState<string>('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('FOUR_WHEELER');
  const [driverName, setDriverName] = useState<string>('');
  const [driverPhone, setDriverPhone] = useState<string>('');
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [durationHours, setDurationHours] = useState<number>(2);

  // Available slots compatible with selected vehicle type
  const availableCompatibleSlots = slots.filter((slot) => {
    if (slot.status !== 'AVAILABLE') return false;
    if (vehicleType === 'ACCESSIBLE') return slot.type === 'ACCESSIBLE';
    if (vehicleType === 'EV_FOUR_WHEELER') return slot.type === 'EV_CHARGING';
    if (vehicleType === 'TWO_WHEELER') return slot.type === 'COMPACT_2W' || slot.type === 'STANDARD_4W';
    return slot.type === 'STANDARD_4W';
  });

  const handleCreateReservation = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanPlate = vehiclePlate.trim().toUpperCase();
    if (!cleanPlate) {
      showToast('error', 'Plate Required', 'Please enter a vehicle license plate.');
      return;
    }

    if (!selectedSlotId) {
      showToast('error', 'Select Bay', 'Please select a parking bay to reserve.');
      return;
    }

    const res = reserveSlot({
      vehiclePlate: cleanPlate,
      vehicleType,
      driverName: driverName.trim() || 'Guest',
      driverPhone: driverPhone.trim(),
      slotId: selectedSlotId,
      durationHours,
    });

    if (res.success) {
      showToast('success', 'Bay Reserved', res.message);
      setIsModalOpen(false);
      setVehiclePlate('');
      setDriverName('');
      setDriverPhone('');
      setSelectedSlotId('');
    } else {
      showToast('error', 'Reservation Failed', res.message);
    }
  };

  const handleCancel = (resId: string) => {
    if (window.confirm('Are you sure you want to cancel this reservation? The bay will be released.')) {
      const res = cancelReservation(resId);
      if (res.success) {
        showToast('info', 'Cancelled', res.message);
      } else {
        showToast('error', 'Error', res.message);
      }
    }
  };

  const handleCheckIn = (resId: string) => {
    const res = checkInReservation(resId);
    if (res.success) {
      showToast('success', 'Checked In', res.message);
    } else {
      showToast('error', 'Error', res.message);
    }
  };

  // Filtered reservations
  const filteredReservations = reservations.filter((r) => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toUpperCase();
      return (
        r.vehiclePlate.includes(q) ||
        r.slotId.includes(q) ||
        r.reservationId.includes(q) ||
        r.driverName.toUpperCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-purple-600" />
            Parking Bay Reservations
          </h2>
          <p className="text-xs text-slate-500">
            Pre-book spaces for faculty, invited delegates, or planned campus arrivals
          </p>
        </div>

        <button
          onClick={() => {
            if (availableCompatibleSlots.length > 0) {
              setSelectedSlotId(availableCompatibleSlots[0].id);
            }
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Reservation
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reservation by plate, bay ID, name, or RES-ID..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ACTIVE">Active Reservations Only</option>
            <option value="CHECKED_IN">Checked-In Only</option>
            <option value="CANCELLED">Cancelled Only</option>
            <option value="ALL">All Reservations History</option>
          </select>
        </div>
      </div>

      {/* Reservations List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {filteredReservations.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <p className="text-sm font-semibold">No reservations found.</p>
            <p className="text-xs">Click "New Reservation" above to book a parking bay in advance.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Reservation ID</th>
                  <th className="py-3 px-4">Vehicle Plate</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Reserved Bay</th>
                  <th className="py-3 px-4">Driver / Guest</th>
                  <th className="py-3 px-4">Valid Until</th>
                  <th className="py-3 px-4">Time Left</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReservations.map((res) => {
                  const msLeft = res.validUntil - currentTime;
                  const minsLeft = Math.round(msLeft / (1000 * 60));
                  const isExpired = msLeft <= 0;

                  return (
                    <tr key={res.reservationId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-xs">
                        {res.reservationId}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {res.vehiclePlate}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-700">
                        {getVehicleTypeLabel(res.vehicleType)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-50 text-purple-800 font-bold font-mono text-xs border border-purple-200">
                          {res.slotId} (Zone {res.zone})
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-800">
                        <span className="font-semibold block">{res.driverName}</span>
                        {res.driverPhone && <span className="text-slate-400 text-[11px]">{res.driverPhone}</span>}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {formatDateTime(res.validUntil)}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold">
                        {res.status === 'ACTIVE' ? (
                          isExpired ? (
                            <span className="text-rose-600 font-bold">Expired</span>
                          ) : (
                            <span className="text-purple-700">{formatDuration(minsLeft)}</span>
                          )
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                            res.status === 'ACTIVE'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : res.status === 'CHECKED_IN'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {res.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {res.status === 'ACTIVE' && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleCancel(res.reservationId)}
                              className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleCheckIn(res.reservationId)}
                              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                            >
                              <LogIn className="w-3 h-3" />
                              Check-In
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Reservation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">New Parking Space Reservation</h3>
                <p className="text-xs text-slate-400">Lock in a bay in advance</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReservation} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Vehicle License Plate *
                </label>
                <input
                  type="text"
                  required
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                  placeholder="e.g. DL-04-EV-2026"
                  className="w-full px-3.5 py-2 text-sm font-mono font-bold uppercase bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Vehicle Category
                </label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="FOUR_WHEELER">Standard Four-Wheeler (Car / SUV)</option>
                  <option value="EV_FOUR_WHEELER">EV Four-Wheeler (Needs Charger)</option>
                  <option value="TWO_WHEELER">Two-Wheeler (Bike / Scooter)</option>
                  <option value="ACCESSIBLE">Accessible Bay (Wheelchair / Mobility)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Driver / Guest Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="e.g. Prof. Davis"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Contact Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Select Available Bay *
                  </label>
                  <select
                    required
                    value={selectedSlotId}
                    onChange={(e) => setSelectedSlotId(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {availableCompatibleSlots.length === 0 ? (
                      <option value="">No compatible bays free</option>
                    ) : (
                      availableCompatibleSlots.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.id} (Zone {s.zone} - {s.type})
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Reservation Window
                  </label>
                  <select
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value={1}>1 Hour</option>
                    <option value={2}>2 Hours (Standard)</option>
                    <option value={4}>4 Hours (Half Day)</option>
                    <option value={8}>8 Hours (Full Day)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={availableCompatibleSlots.length === 0}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  Confirm Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

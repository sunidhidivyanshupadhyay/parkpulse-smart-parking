import React, { useState, useEffect } from 'react';
import { useParking } from '../context/ParkingContext';
import { useToast } from '../context/ToastContext';
import { ParkingTicketModal } from '../components/ticket/ParkingTicketModal';
import { VehicleType, ActiveTicket, HOURLY_RATES, QueueItem } from '../types/parking';
import {
  formatCurrency,
  formatDateTime,
  formatDuration,
  getVehicleTypeLabel,
} from '../utils/formatters';
import {
  LogIn,
  LogOut,
  Car,
  Bike,
  Zap,
  Accessibility,
  CheckCircle2,
  AlertCircle,
  Clock,
  CreditCard,
  Banknote,
  Smartphone,
  GraduationCap,
  Sparkles,
  ArrowRight,
  ListOrdered,
} from 'lucide-react';

interface EntryExitProps {
  initialSlotId?: string;
  initialExitPlate?: string;
  onNavigateToQueue?: () => void;
}

export const EntryExit: React.FC<EntryExitProps> = ({
  initialSlotId,
  initialExitPlate,
  onNavigateToQueue,
}) => {
  const {
    parkVehicle,
    exitVehicle,
    activeTickets,
    slots,
    currentTime,
    addToWaitingQueue,
    dispatchQueueVehicle,
  } = useParking();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'entry' | 'exit'>(initialExitPlate ? 'exit' : 'entry');

  // Entry Form State
  const [vehiclePlate, setVehiclePlate] = useState<string>('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('FOUR_WHEELER');
  const [driverName, setDriverName] = useState<string>('');
  const [driverPhone, setDriverPhone] = useState<string>('');
  const [entryGate, setEntryGate] = useState<string>('GATE_1');
  const [selectedSlotId, setSelectedSlotId] = useState<string>(initialSlotId || '');

  // Ticket modal
  const [generatedTicket, setGeneratedTicket] = useState<ActiveTicket | null>(null);

  // Exit Form State
  const [exitSearchQuery, setExitSearchQuery] = useState<string>(initialExitPlate || '');
  const [selectedExitTicket, setSelectedExitTicket] = useState<ActiveTicket | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'UPI_DIGITAL' | 'CAMPUS_PASS'>('CARD');

  // Waiting queue suggestion state after exit
  const [queueCandidate, setQueueCandidate] = useState<QueueItem | null>(null);
  const [freedSlotId, setFreedSlotId] = useState<string | null>(null);

  // Sync initial props
  useEffect(() => {
    if (initialSlotId) {
      setSelectedSlotId(initialSlotId);
      setActiveTab('entry');
    }
  }, [initialSlotId]);

  useEffect(() => {
    if (initialExitPlate) {
      setExitSearchQuery(initialExitPlate);
      const ticket = activeTickets.find(
        (t) => t.vehiclePlate.trim().toUpperCase() === initialExitPlate.trim().toUpperCase()
      );
      if (ticket) {
        setSelectedExitTicket(ticket);
      }
      setActiveTab('exit');
    }
  }, [initialExitPlate, activeTickets]);

  // Available slots for manual selection
  const availableSlots = slots.filter((s) => s.status === 'AVAILABLE');

  // Handle Vehicle Entry Submit
  const handleEntrySubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanPlate = vehiclePlate.trim().toUpperCase();
    if (!cleanPlate) {
      showToast('error', 'Validation Error', 'Please enter a vehicle license plate number.');
      return;
    }

    const result = parkVehicle({
      vehiclePlate: cleanPlate,
      vehicleType,
      driverName: driverName.trim(),
      driverPhone: driverPhone.trim(),
      entryGate,
      preferredSlotId: selectedSlotId || undefined,
    });

    if (result.success && result.ticket) {
      showToast('success', 'Vehicle Checked-In', result.message);
      setGeneratedTicket(result.ticket);
      // Reset form
      setVehiclePlate('');
      setDriverName('');
      setDriverPhone('');
      setSelectedSlotId('');
    } else {
      showToast('error', 'Check-In Failed', result.message);
    }
  };

  // Add to queue if full
  const handleAddToQueue = () => {
    const cleanPlate = vehiclePlate.trim().toUpperCase();
    if (!cleanPlate) {
      showToast('error', 'Plate Required', 'Please enter license plate to join waiting queue.');
      return;
    }

    const res = addToWaitingQueue({
      vehiclePlate: cleanPlate,
      vehicleType,
      driverName: driverName.trim() || 'Visitor',
      driverPhone: driverPhone.trim(),
      preferredGate: entryGate,
      needsEV: vehicleType === 'EV_FOUR_WHEELER',
      needsAccessible: vehicleType === 'ACCESSIBLE',
    });

    if (res.success) {
      showToast('success', 'Joined Waiting Queue', res.message);
      setVehiclePlate('');
      setDriverName('');
      setDriverPhone('');
    } else {
      showToast('error', 'Queue Error', res.message);
    }
  };

  // Handle Exit Search Selection
  const handleSelectTicketForExit = (ticket: ActiveTicket) => {
    setSelectedExitTicket(ticket);
    setExitSearchQuery(ticket.vehiclePlate);
  };

  // Handle Exit Submit
  const handleExitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExitTicket) {
      showToast('error', 'Select Vehicle', 'Please select an active vehicle session to process exit.');
      return;
    }

    const currentSlot = selectedExitTicket.slotId;
    const res = exitVehicle(selectedExitTicket.ticketId, paymentMethod);

    if (res.success) {
      showToast('success', 'Vehicle Checked-Out', res.message);
      setSelectedExitTicket(null);
      setExitSearchQuery('');

      if (res.waitingQueueCandidate) {
        setQueueCandidate(res.waitingQueueCandidate);
        setFreedSlotId(currentSlot);
      }
    } else {
      showToast('error', 'Exit Failed', res.message);
    }
  };

  // Auto-dispatch queue candidate
  const handleDispatchQueueVehicle = () => {
    if (!queueCandidate || !freedSlotId) return;

    const res = dispatchQueueVehicle(queueCandidate.queueId, freedSlotId);
    if (res.success) {
      showToast('success', 'Queue Vehicle Parked!', res.message);
      setQueueCandidate(null);
      setFreedSlotId(null);
    } else {
      showToast('error', 'Dispatch Error', res.message);
    }
  };

  // Filtered tickets for autocomplete in exit tab
  const matchingTickets = activeTickets.filter((t) => {
    if (!exitSearchQuery.trim()) return true;
    const query = exitSearchQuery.trim().toUpperCase();
    return t.vehiclePlate.includes(query) || t.slotId.includes(query) || t.ticketId.includes(query);
  });

  // Calculate live billing for selected exit ticket
  let exitElapsedMinutes = 0;
  let exitFee = 0;
  if (selectedExitTicket) {
    exitElapsedMinutes = Math.max(1, Math.round((currentTime - selectedExitTicket.entryTime) / (1000 * 60)));
    const billableHours = Math.max(0.5, Math.ceil(exitElapsedMinutes / 30) * 0.5);
    exitFee = Number((billableHours * selectedExitTicket.hourlyRate).toFixed(2));
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Waiting Queue Dispatch Alert Banner */}
      {queueCandidate && freedSlotId && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-transparent border border-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Compatible Vehicle Waiting in Queue!
              </h3>
              <p className="text-xs text-slate-600">
                Slot <span className="font-bold font-mono text-emerald-800">{freedSlotId}</span> just became free. Vehicle{' '}
                <span className="font-mono font-bold">{queueCandidate.vehiclePlate}</span> ({queueCandidate.driverName}) is waiting next.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setQueueCandidate(null);
                setFreedSlotId(null);
              }}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium"
            >
              Dismiss
            </button>
            <button
              onClick={handleDispatchQueueVehicle}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              Assign to Slot {freedSlotId}
            </button>
          </div>
        </div>
      )}

      {/* Mode Switcher Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-xs max-w-md">
        <button
          onClick={() => setActiveTab('entry')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'entry'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <LogIn className="w-4 h-4" />
          Vehicle Check-In (Entry)
        </button>
        <button
          onClick={() => setActiveTab('exit')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'exit'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <LogOut className="w-4 h-4" />
          Vehicle Check-Out (Exit)
        </button>
      </div>

      {/* Tab 1: Vehicle Entry Terminal */}
      {activeTab === 'entry' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <LogIn className="w-5 h-5 text-blue-600" />
                Vehicle Entry & Automated Slot Allocation
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Checks bay compatibility, calculates shortest driving path, and prevents duplicate registration entries.
              </p>
            </div>

            <form onSubmit={handleEntrySubmit} className="space-y-5">
              {/* License Plate Number */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Vehicle Registration Plate Number *
                </label>
                <input
                  type="text"
                  required
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                  placeholder="e.g. KA-01-AB-1234 or NY-789-XY"
                  className="w-full px-4 py-3 text-base font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 tracking-wider text-slate-900 uppercase"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Duplicates are strictly prevented using instant O(1) hash table lookup.
                </span>
              </div>

              {/* Vehicle Category Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Select Vehicle Category *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Four Wheeler */}
                  <div
                    onClick={() => setVehicleType('FOUR_WHEELER')}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      vehicleType === 'FOUR_WHEELER'
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                        <Car className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">Four-Wheeler</div>
                        <div className="text-xs text-slate-500">Standard Sedan / SUV • {formatCurrency(HOURLY_RATES.FOUR_WHEELER)}/hr</div>
                      </div>
                    </div>
                  </div>

                  {/* Two Wheeler */}
                  <div
                    onClick={() => setVehicleType('TWO_WHEELER')}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      vehicleType === 'TWO_WHEELER'
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                        <Bike className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">Two-Wheeler</div>
                        <div className="text-xs text-slate-500">Bike / Scooter • {formatCurrency(HOURLY_RATES.TWO_WHEELER)}/hr</div>
                      </div>
                    </div>
                  </div>

                  {/* EV Four Wheeler */}
                  <div
                    onClick={() => setVehicleType('EV_FOUR_WHEELER')}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      vehicleType === 'EV_FOUR_WHEELER'
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">EV Four-Wheeler</div>
                        <div className="text-xs text-slate-500">Fast Charging Bay • {formatCurrency(HOURLY_RATES.EV_FOUR_WHEELER)}/hr</div>
                      </div>
                    </div>
                  </div>

                  {/* Accessible Parking */}
                  <div
                    onClick={() => setVehicleType('ACCESSIBLE')}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      vehicleType === 'ACCESSIBLE'
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                        <Accessibility className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">Accessible Bay</div>
                        <div className="text-xs text-slate-500">Mobility Priority • {formatCurrency(HOURLY_RATES.ACCESSIBLE)}/hr</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Driver Details (Optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Driver / Owner Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="e.g. Dr. Alex Mercer"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Contact Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    placeholder="e.g. +1 (555) 019-2834"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Gate & Slot Selection Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Entrance Gate
                  </label>
                  <select
                    value={entryGate}
                    onChange={(e) => setEntryGate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="GATE_1">Gate 1 - North Main (Admin & Academic Wing)</option>
                    <option value="GATE_2">Gate 2 - South Express (Highway & Sports Concourse)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Slot Assignment
                  </label>
                  <select
                    value={selectedSlotId}
                    onChange={(e) => setSelectedSlotId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Auto-Assign Optimal Bay (MinHeap Shortest Route)</option>
                    {availableSlots.map((s) => (
                      <option key={s.id} value={s.id}>
                        Bay {s.id} (Zone {s.zone} - {s.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleAddToQueue}
                  className="px-4 py-3 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl transition-colors cursor-pointer"
                >
                  Join Waiting Queue
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer ml-auto"
                >
                  <LogIn className="w-4 h-4" />
                  Check-In & Issue Parking Pass
                </button>
              </div>
            </form>
          </div>

          {/* Side Helper Card: Live Rates & Gate Status */}
          <div className="space-y-4">
            <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-blue-400">
                <Sparkles className="w-4 h-4" />
                <h3 className="font-bold text-sm tracking-wide">Campus Parking Tariff</h3>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span className="text-slate-300">Four-Wheeler:</span>
                  <span className="font-bold text-emerald-400">{formatCurrency(HOURLY_RATES.FOUR_WHEELER)}/hour</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span className="text-slate-300">Two-Wheeler:</span>
                  <span className="font-bold text-emerald-400">{formatCurrency(HOURLY_RATES.TWO_WHEELER)}/hour</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span className="text-slate-300">EV Charging Bay:</span>
                  <span className="font-bold text-emerald-400">{formatCurrency(HOURLY_RATES.EV_FOUR_WHEELER)}/hour</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span className="text-slate-300">Accessible Bay:</span>
                  <span className="font-bold text-emerald-400">{formatCurrency(HOURLY_RATES.ACCESSIBLE)}/hour</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                First 15 minutes complimentary grace period. Billed in 30-minute blocks thereafter.
              </p>
            </div>

            {/* Quick stats */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
              <h4 className="font-bold text-slate-900 text-sm">Allocation Engine Active</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                ParkPulse utilizes a <strong className="text-blue-600">MinHeap Priority Queue</strong> combined with <strong className="text-blue-600">Dijkstra's Algorithm</strong> to automatically assign the parking bay with the minimum driving distance from your chosen entry gate.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Vehicle Exit Terminal */}
      {activeTab === 'exit' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Exit Form */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <LogOut className="w-5 h-5 text-rose-600" />
                Vehicle Exit & Billing Terminal
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Search active ticket or vehicle registration plate, calculate elapsed duration, and process payment.
              </p>
            </div>

            {/* Vehicle Search Box */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Search Parked Vehicle by License Plate / Bay ID
              </label>
              <input
                type="text"
                value={exitSearchQuery}
                onChange={(e) => {
                  setExitSearchQuery(e.target.value.toUpperCase());
                  const found = activeTickets.find(
                    (t) => t.vehiclePlate.toUpperCase() === e.target.value.toUpperCase()
                  );
                  if (found) setSelectedExitTicket(found);
                }}
                placeholder="Type license plate (e.g. KA-01-MJ-4521)..."
                className="w-full px-4 py-3 text-base font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 uppercase text-slate-900"
              />
            </div>

            {/* Quick Click list of active vehicles */}
            <div>
              <span className="text-xs font-semibold text-slate-500 block mb-2">
                Select from Currently Parked Vehicles ({matchingTickets.length} found):
              </span>
              <div className="max-h-48 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-2 bg-slate-50">
                {matchingTickets.length === 0 ? (
                  <p className="text-xs text-slate-400 p-3 text-center">No matching parked vehicles found.</p>
                ) : (
                  matchingTickets.map((t) => (
                    <div
                      key={t.ticketId}
                      onClick={() => handleSelectTicketForExit(t)}
                      className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                        selectedExitTicket?.ticketId === t.ticketId
                          ? 'bg-rose-50 border-rose-400 text-rose-950 font-semibold shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-bold text-sm">{t.vehiclePlate}</span>
                        <span className="text-xs text-slate-500">Bay {t.slotId} (Zone {t.zone})</span>
                      </div>
                      <span className="text-xs font-medium text-slate-600">
                        {getVehicleTypeLabel(t.vehicleType)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Selected Vehicle Calculation Summary */}
            {selectedExitTicket && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-xs text-slate-500 uppercase">Selected Vehicle</span>
                    <h3 className="text-xl font-extrabold font-mono text-slate-900">
                      {selectedExitTicket.vehiclePlate}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 uppercase">Bay Number</span>
                    <div className="text-xl font-extrabold text-blue-600 font-mono">
                      {selectedExitTicket.slotId}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Check-In Time</span>
                    <span className="font-semibold text-slate-800">
                      {formatDateTime(selectedExitTicket.entryTime)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Elapsed Time</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {formatDuration(exitElapsedMinutes)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Hourly Tariff</span>
                    <span className="font-semibold text-slate-800">
                      {formatCurrency(selectedExitTicket.hourlyRate)}/hr
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Calculated Total</span>
                    <span className="font-extrabold text-rose-600 text-base">
                      {formatCurrency(exitFee)}
                    </span>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div className="pt-3 border-t border-slate-200">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Select Payment Method
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CARD')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-xs font-semibold transition-all cursor-pointer ${
                        paymentMethod === 'CARD'
                          ? 'border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      Credit / Debit
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('UPI_DIGITAL')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-xs font-semibold transition-all cursor-pointer ${
                        paymentMethod === 'UPI_DIGITAL'
                          ? 'border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <Smartphone className="w-4 h-4 text-purple-600" />
                      Digital / UPI
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CASH')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-xs font-semibold transition-all cursor-pointer ${
                        paymentMethod === 'CASH'
                          ? 'border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <Banknote className="w-4 h-4 text-emerald-600" />
                      Cash
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CAMPUS_PASS')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-xs font-semibold transition-all cursor-pointer ${
                        paymentMethod === 'CAMPUS_PASS'
                          ? 'border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <GraduationCap className="w-4 h-4 text-amber-600" />
                      Campus ID Pass
                    </button>
                  </div>
                </div>

                {/* Complete Exit Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleExitSubmit}
                    className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Process Payment ({formatCurrency(exitFee)}) & Release Bay {selectedExitTicket.slotId}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Exit Help Guide */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
              <h4 className="font-bold text-slate-900 text-sm">Automated Queue Integration</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                As soon as this vehicle checks out, the system automatically inspects the FIFO Waiting Queue. If a waiting vehicle is compatible with the vacated bay, ParkPulse immediately prompts dispatch.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Parking Ticket Pass Modal */}
      {generatedTicket && (
        <ParkingTicketModal
          ticket={generatedTicket}
          onClose={() => setGeneratedTicket(null)}
        />
      )}
    </div>
  );
};

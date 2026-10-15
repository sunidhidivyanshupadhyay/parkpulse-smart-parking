import React from 'react';
import { ActiveTicket } from '../../types/parking';
import { formatDateTime, getVehicleTypeLabel, formatCurrency } from '../../utils/formatters';
import { Printer, X, QrCode, CheckCircle, ShieldCheck, MapPin } from 'lucide-react';

interface ParkingTicketModalProps {
  ticket: ActiveTicket | null;
  onClose: () => void;
}

export const ParkingTicketModal: React.FC<ParkingTicketModalProps> = ({ ticket, onClose }) => {
  if (!ticket) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        {/* Ticket Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-md">
              P
            </div>
            <div>
              <h3 className="font-bold text-base tracking-wide">PARKPULSE ENTRY PASS</h3>
              <p className="text-xs text-slate-400">Campus Smart Parking Authority</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Ticket Body */}
        <div id="printable-ticket" className="p-6 bg-slate-50/50">
          <div className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-5 shadow-sm">
            {/* Slot Highlight */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Bay</span>
                <div className="text-3xl font-extrabold text-blue-600 tracking-tight">{ticket.slotId}</div>
                <div className="flex items-center gap-1 text-xs text-slate-600 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-500" />
                  <span>Zone {ticket.zone}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ticket Number</span>
                <div className="text-lg font-mono font-bold text-slate-900">{ticket.ticketId}</div>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 mt-1">
                  <CheckCircle className="w-3 h-3" /> Confirmed
                </span>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-sm py-2">
              <div>
                <p className="text-xs text-slate-500">Vehicle Plate</p>
                <p className="font-mono font-bold text-slate-900 text-base">{ticket.vehiclePlate}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Vehicle Category</p>
                <p className="font-medium text-slate-800 text-xs mt-0.5">{getVehicleTypeLabel(ticket.vehicleType)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Entry Timestamp</p>
                <p className="font-medium text-slate-800 text-xs">{formatDateTime(ticket.entryTime)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Entrance Gate</p>
                <p className="font-medium text-slate-800 text-xs">
                  {ticket.entryGate === 'GATE_1' ? 'Gate 1 (North Main)' : 'Gate 2 (South Express)'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Driver Name</p>
                <p className="font-medium text-slate-800 text-xs">{ticket.driverName || 'Visitor'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Hourly Tariff</p>
                <p className="font-bold text-emerald-600 text-sm">{formatCurrency(ticket.hourlyRate)}/hr</p>
              </div>
            </div>

            {/* Simulated Barcode & QR */}
            <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
              <div className="flex flex-col">
                {/* SVG Barcode simulation */}
                <div className="flex gap-0.5 items-end h-8">
                  {[3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9, 3, 2, 3, 8, 4, 6].map((w, i) => (
                    <div
                      key={i}
                      className={`bg-slate-900 h-full ${i % 2 === 0 ? 'w-1' : 'w-0.5'}`}
                      style={{ opacity: i % 3 === 0 ? 0.9 : 0.7 }}
                    />
                  ))}
                </div>
                <span className="font-mono text-[10px] text-slate-400 mt-1 tracking-widest">{ticket.ticketId}-PPX</span>
              </div>
              <div className="w-12 h-12 bg-slate-100 rounded-lg border border-slate-300 flex items-center justify-center p-1 text-slate-800">
                <QrCode className="w-full h-full" />
              </div>
            </div>

            <div className="mt-3 text-[11px] text-slate-500 text-center flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
              <span>Keep this pass visible on dashboard or in mobile wallet.</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print / Save Pass
          </button>
        </div>
      </div>
    </div>
  );
};

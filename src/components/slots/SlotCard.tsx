import React from 'react';
import { ParkingSlot, SlotStatus } from '../../types/parking';
import { Accessibility, Zap, Bike, Car, ShieldAlert, Clock } from 'lucide-react';

interface SlotCardProps {
  slot: ParkingSlot;
  onClick: (slot: ParkingSlot) => void;
  onQuickStatusChange?: (slot: ParkingSlot, targetStatus: SlotStatus) => void;
  isHighlighted?: boolean;
}

export const SlotCard: React.FC<SlotCardProps> = ({
  slot,
  onClick,
  onQuickStatusChange,
  isHighlighted = false,
}) => {
  // Determine Type Icon
  const renderTypeIcon = () => {
    switch (slot.type) {
      case 'ACCESSIBLE':
        return <Accessibility className="w-4 h-4 text-blue-600" />;
      case 'EV_CHARGING':
        return <Zap className="w-4 h-4 text-purple-600" />;
      case 'COMPACT_2W':
        return <Bike className="w-4 h-4 text-amber-600" />;
      case 'STANDARD_4W':
      default:
        return <Car className="w-4 h-4 text-slate-500" />;
    }
  };

  // Status Styling according to requirements:
  // Green for available, Red for occupied, Purple for reserved, Gray for maintenance
  let borderClass = 'border-emerald-300';
  let bgClass = 'bg-emerald-50/70 hover:bg-emerald-100/90 text-emerald-950';
  let badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
  let statusText = 'Available';

  if (slot.status === 'OCCUPIED') {
    borderClass = 'border-rose-300';
    bgClass = 'bg-rose-50/80 hover:bg-rose-100/90 text-rose-950';
    badgeClass = 'bg-rose-100 text-rose-800 border-rose-300';
    statusText = 'Occupied';
  } else if (slot.status === 'RESERVED') {
    borderClass = 'border-purple-300';
    bgClass = 'bg-purple-50/80 hover:bg-purple-100/90 text-purple-950';
    badgeClass = 'bg-purple-100 text-purple-800 border-purple-300';
    statusText = 'Reserved';
  } else if (slot.status === 'MAINTENANCE') {
    borderClass = 'border-slate-300';
    bgClass = 'bg-slate-100 hover:bg-slate-200 text-slate-700';
    badgeClass = 'bg-slate-200 text-slate-800 border-slate-300';
    statusText = 'Maintenance';
  }

  return (
    <div
      onClick={() => onClick(slot)}
      className={`relative rounded-xl border-2 p-3.5 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between min-h-[140px] ${bgClass} ${borderClass} ${
        isHighlighted ? 'ring-4 ring-blue-500 ring-offset-2 scale-105' : ''
      }`}
    >
      {/* Top row: Slot ID, Type, & Status Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold text-lg tracking-tight">{slot.id}</span>
          <span className="p-1 rounded-md bg-white/80 shadow-xs border border-slate-200/60">
            {renderTypeIcon()}
          </span>
        </div>
        <span className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full border ${badgeClass}`}>
          {statusText}
        </span>
      </div>

      {/* Middle: Vehicle Plate or status visual */}
      <div className="my-2">
        {slot.status === 'OCCUPIED' && slot.currentVehiclePlate ? (
          <div className="bg-white/95 backdrop-blur-xs rounded-lg px-2.5 py-1 border border-rose-200 inline-block shadow-xs">
            <span className="font-mono text-xs font-bold text-slate-900 tracking-wider">
              {slot.currentVehiclePlate}
            </span>
          </div>
        ) : slot.status === 'RESERVED' ? (
          <div className="flex items-center gap-1 text-xs font-medium text-purple-800">
            <Clock className="w-3.5 h-3.5 text-purple-600" />
            <span className="font-mono">{slot.currentVehiclePlate || 'Reserved'}</span>
          </div>
        ) : slot.status === 'MAINTENANCE' ? (
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
            <span>Under Maintenance</span>
          </div>
        ) : (
          <div className="text-xs text-emerald-700 font-semibold">Available for Parking</div>
        )}
      </div>

      {/* Bottom row: Quick Status Control Dropdown & Distance */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 gap-1 text-[11px]">
        {onQuickStatusChange ? (
          <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
            <select
              value={slot.status}
              onChange={(e) => {
                onQuickStatusChange(slot, e.target.value as SlotStatus);
              }}
              className="w-full text-[11px] font-medium py-1 px-1.5 rounded-lg bg-white/90 border border-slate-300 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-2xs"
            >
              <option value="AVAILABLE">Mark Available</option>
              <option value="OCCUPIED">Mark Occupied</option>
              <option value="RESERVED">Mark Reserved</option>
              <option value="MAINTENANCE">Mark Maintenance</option>
            </select>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full text-slate-500">
            <span>G1: {slot.distanceToGate1}m</span>
            <span>G2: {slot.distanceToGate2}m</span>
          </div>
        )}
      </div>
    </div>
  );
};

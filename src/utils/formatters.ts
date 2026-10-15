/**
 * Formatting and Utility Helpers
 */

import { VehicleType, SlotType, SlotStatus, ZoneId, HOURLY_RATES } from '../types/parking';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDateTime(timestamp: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(timestamp));
}

export function formatTimeOnly(timestamp: number): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

export function formatDuration(minutes: number): string {
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hrs === 0) {
    return `${mins}m`;
  }
  return `${hrs}h ${mins}m`;
}

export function getVehicleTypeLabel(type: VehicleType): string {
  switch (type) {
    case 'TWO_WHEELER':
      return 'Two-Wheeler (Bike/Scooter)';
    case 'FOUR_WHEELER':
      return 'Four-Wheeler (Car/Sedan)';
    case 'EV_FOUR_WHEELER':
      return 'EV Four-Wheeler (Electric)';
    case 'ACCESSIBLE':
      return 'Accessible (Wheelchair/Mobility)';
    default:
      return type;
  }
}

export function getSlotTypeLabel(type: SlotType): string {
  switch (type) {
    case 'COMPACT_2W':
      return 'Two-Wheeler Only';
    case 'STANDARD_4W':
      return 'Standard 4-Wheeler';
    case 'EV_CHARGING':
      return 'EV Fast Charging';
    case 'ACCESSIBLE':
      return 'Accessible / Handicap';
    default:
      return type;
  }
}

export function getStatusColorClass(status: SlotStatus): {
  bg: string;
  text: string;
  border: string;
  badge: string;
} {
  switch (status) {
    case 'AVAILABLE':
      return {
        bg: 'bg-emerald-50 hover:bg-emerald-100',
        text: 'text-emerald-700',
        border: 'border-emerald-300',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      };
    case 'OCCUPIED':
      return {
        bg: 'bg-rose-50 hover:bg-rose-100',
        text: 'text-rose-700',
        border: 'border-rose-300',
        badge: 'bg-rose-100 text-rose-800 border-rose-300',
      };
    case 'RESERVED':
      return {
        bg: 'bg-purple-50 hover:bg-purple-100',
        text: 'text-purple-700',
        border: 'border-purple-300',
        badge: 'bg-purple-100 text-purple-800 border-purple-300',
      };
    case 'MAINTENANCE':
      return {
        bg: 'bg-slate-100 hover:bg-slate-200',
        text: 'text-slate-700',
        border: 'border-slate-300',
        badge: 'bg-slate-200 text-slate-800 border-slate-300',
      };
  }
}

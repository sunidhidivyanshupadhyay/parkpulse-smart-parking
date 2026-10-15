/**
 * Domain Types for the Smart Parking Management System
 */

export type VehicleType = 'TWO_WHEELER' | 'FOUR_WHEELER' | 'EV_FOUR_WHEELER' | 'ACCESSIBLE';

export type SlotType = 'COMPACT_2W' | 'STANDARD_4W' | 'EV_CHARGING' | 'ACCESSIBLE';

export type SlotStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';

export type ZoneId = 'A' | 'B' | 'C' | 'D';

export interface ParkingSlot {
  id: string; // e.g. "A-01"
  zone: ZoneId;
  slotNumber: number;
  type: SlotType;
  status: SlotStatus;
  level: number; // 0 = Ground, 1 = Level 1, 2 = Level 2
  currentVehiclePlate?: string;
  currentTicketId?: string;
  reservationId?: string;
  distanceToGate1: number; // meters from Gate 1 North
  distanceToGate2: number; // meters from Gate 2 South
  graphNodeId: string;
}

export interface ActiveTicket {
  ticketId: string;
  vehiclePlate: string;
  vehicleType: VehicleType;
  driverName?: string;
  driverPhone?: string;
  slotId: string;
  zone: ZoneId;
  entryGate: string;
  entryTime: number; // Timestamp ms
  hourlyRate: number;
}

export interface Reservation {
  reservationId: string;
  vehiclePlate: string;
  vehicleType: VehicleType;
  driverName: string;
  driverPhone: string;
  slotId: string;
  zone: ZoneId;
  reservedAt: number;
  validUntil: number;
  status: 'ACTIVE' | 'CHECKED_IN' | 'CANCELLED' | 'EXPIRED';
}

export interface QueueItem {
  queueId: string;
  vehiclePlate: string;
  vehicleType: VehicleType;
  driverName: string;
  driverPhone: string;
  preferredGate: string;
  needsEV: boolean;
  needsAccessible: boolean;
  joinedAt: number;
}

export interface ParkingHistoryRecord {
  ticketId: string;
  vehiclePlate: string;
  vehicleType: VehicleType;
  slotId: string;
  zone: ZoneId;
  entryTime: number;
  exitTime: number;
  durationMinutes: number;
  hourlyRate: number;
  totalFee: number;
  paymentMethod: 'CASH' | 'CARD' | 'UPI_DIGITAL' | 'CAMPUS_PASS';
  paymentStatus: 'PAID' | 'WAIVED';
}

export interface ParkingRates {
  TWO_WHEELER: number;
  FOUR_WHEELER: number;
  EV_FOUR_WHEELER: number;
  ACCESSIBLE: number;
}

export const HOURLY_RATES: ParkingRates = {
  TWO_WHEELER: 1.5,
  FOUR_WHEELER: 3.0,
  EV_FOUR_WHEELER: 4.5,
  ACCESSIBLE: 2.0,
};

export interface ZoneMetadata {
  id: ZoneId;
  name: string;
  levelName: string;
  description: string;
  totalSlots: number;
  color: string;
}

export const ZONE_INFO: Record<ZoneId, ZoneMetadata> = {
  A: {
    id: 'A',
    name: 'Zone A - North Wing',
    levelName: 'Ground Floor (Level 0)',
    description: 'Closest to Main Admin Block & Accessible Elevators',
    totalSlots: 12,
    color: '#3B82F6',
  },
  B: {
    id: 'B',
    name: 'Zone B - South Courtyard',
    levelName: 'Ground Floor (Level 0)',
    description: 'Fast exit access to South Highway Gate',
    totalSlots: 12,
    color: '#10B981',
  },
  C: {
    id: 'C',
    name: 'Zone C - Green Mobility Hub',
    levelName: 'Level 1 Deck',
    description: 'Dedicated high-speed EV charging stations & hybrid bays',
    totalSlots: 12,
    color: '#8B5CF6',
  },
  D: {
    id: 'D',
    name: 'Zone D - Two-Wheeler & General',
    levelName: 'Level 2 Rooftop Deck',
    description: 'Shaded compact parking for bikes, scooters, and standard cars',
    totalSlots: 12,
    color: '#F59E0B',
  },
};

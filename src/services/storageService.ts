/**
 * LocalStorage Persistence and Initial Mock Data Seeding
 * Keeps all parking slots, active tickets, reservations, waiting queue, and history in sync.
 */

import {
  ParkingSlot,
  ActiveTicket,
  Reservation,
  QueueItem,
  ParkingHistoryRecord,
  HOURLY_RATES,
} from '../types/parking';
import { parkingTopology } from './parkingGraphService';

const STORAGE_KEY = 'PARKPULSE_DATA_V1';

export interface ParkingSystemState {
  slots: ParkingSlot[];
  activeTickets: ActiveTicket[];
  reservations: Reservation[];
  waitingQueue: QueueItem[];
  history: ParkingHistoryRecord[];
}

export function generateInitialState(): ParkingSystemState {
  const baseSlots = parkingTopology.getDefaultSlots();
  const now = Date.now();
  const hour = 3600 * 1000;
  const minute = 60 * 1000;

  // Initial active parked vehicles
  const initialTickets: ActiveTicket[] = [
    {
      ticketId: 'TKT-2401',
      vehiclePlate: 'KA-01-MJ-4521',
      vehicleType: 'FOUR_WHEELER',
      driverName: 'Dr. Evelyn Reed',
      driverPhone: '+1 (555) 234-5678',
      slotId: 'A-05',
      zone: 'A',
      entryGate: 'GATE_1',
      entryTime: now - 3.2 * hour,
      hourlyRate: HOURLY_RATES.FOUR_WHEELER,
    },
    {
      ticketId: 'TKT-2402',
      vehiclePlate: 'MH-12-PQ-8910',
      vehicleType: 'ACCESSIBLE',
      driverName: 'Marcus Vance',
      driverPhone: '+1 (555) 987-6543',
      slotId: 'A-01',
      zone: 'A',
      entryGate: 'GATE_1',
      entryTime: now - 1.5 * hour,
      hourlyRate: HOURLY_RATES.ACCESSIBLE,
    },
    {
      ticketId: 'TKT-2403',
      vehiclePlate: 'DL-04-EV-2026',
      vehicleType: 'EV_FOUR_WHEELER',
      driverName: 'Elena Rostova',
      driverPhone: '+1 (555) 345-6789',
      slotId: 'C-01',
      zone: 'C',
      entryGate: 'GATE_1',
      entryTime: now - 2.8 * hour,
      hourlyRate: HOURLY_RATES.EV_FOUR_WHEELER,
    },
    {
      ticketId: 'TKT-2404',
      vehiclePlate: 'TS-09-EV-7722',
      vehicleType: 'EV_FOUR_WHEELER',
      driverName: 'Jonathan Wu',
      driverPhone: '+1 (555) 456-7890',
      slotId: 'C-03',
      zone: 'C',
      entryGate: 'GATE_1',
      entryTime: now - 0.9 * hour,
      hourlyRate: HOURLY_RATES.EV_FOUR_WHEELER,
    },
    {
      ticketId: 'TKT-2405',
      vehiclePlate: 'KA-05-BK-1102',
      vehicleType: 'TWO_WHEELER',
      driverName: 'Devon Miles',
      driverPhone: '+1 (555) 567-8901',
      slotId: 'D-01',
      zone: 'D',
      entryGate: 'GATE_2',
      entryTime: now - 4.1 * hour,
      hourlyRate: HOURLY_RATES.TWO_WHEELER,
    },
    {
      ticketId: 'TKT-2406',
      vehiclePlate: 'TN-07-SK-9933',
      vehicleType: 'TWO_WHEELER',
      driverName: 'Priya Sharma',
      driverPhone: '+1 (555) 678-9012',
      slotId: 'D-02',
      zone: 'D',
      entryGate: 'GATE_2',
      entryTime: now - 1.2 * hour,
      hourlyRate: HOURLY_RATES.TWO_WHEELER,
    },
    {
      ticketId: 'TKT-2407',
      vehiclePlate: 'GJ-01-AZ-6655',
      vehicleType: 'FOUR_WHEELER',
      driverName: 'Robert Langdon',
      driverPhone: '+1 (555) 789-0123',
      slotId: 'B-04',
      zone: 'B',
      entryGate: 'GATE_2',
      entryTime: now - 2.1 * hour,
      hourlyRate: HOURLY_RATES.FOUR_WHEELER,
    },
    {
      ticketId: 'TKT-2408',
      vehiclePlate: 'HR-26-TR-4488',
      vehicleType: 'FOUR_WHEELER',
      driverName: 'Sarah Jenkins',
      driverPhone: '+1 (555) 890-1234',
      slotId: 'B-08',
      zone: 'B',
      entryGate: 'GATE_2',
      entryTime: now - 0.6 * hour,
      hourlyRate: HOURLY_RATES.FOUR_WHEELER,
    },
  ];

  // Initial Reservations
  const initialReservations: Reservation[] = [
    {
      reservationId: 'RES-8801',
      vehiclePlate: 'KA-03-RS-3301',
      vehicleType: 'FOUR_WHEELER',
      driverName: 'Dean Arthur Pendelton',
      driverPhone: '+1 (555) 432-1098',
      slotId: 'A-08',
      zone: 'A',
      reservedAt: now - 30 * minute,
      validUntil: now + 90 * minute,
      status: 'ACTIVE',
    },
    {
      reservationId: 'RES-8802',
      vehiclePlate: 'UP-16-EV-5544',
      vehicleType: 'EV_FOUR_WHEELER',
      driverName: 'Clara Oswald',
      driverPhone: '+1 (555) 321-0987',
      slotId: 'C-05',
      zone: 'C',
      reservedAt: now - 15 * minute,
      validUntil: now + 105 * minute,
      status: 'ACTIVE',
    },
  ];

  // Initial Queue items
  const initialQueue: QueueItem[] = [
    {
      queueId: 'Q-101',
      vehiclePlate: 'AP-28-EV-9021',
      vehicleType: 'EV_FOUR_WHEELER',
      driverName: 'Lucas Thorne',
      driverPhone: '+1 (555) 765-4321',
      preferredGate: 'GATE_1',
      needsEV: true,
      needsAccessible: false,
      joinedAt: now - 18 * minute,
    },
    {
      queueId: 'Q-102',
      vehiclePlate: 'MH-02-CD-1414',
      vehicleType: 'FOUR_WHEELER',
      driverName: 'Amara Chen',
      driverPhone: '+1 (555) 654-3210',
      preferredGate: 'GATE_2',
      needsEV: false,
      needsAccessible: false,
      joinedAt: now - 7 * minute,
    },
  ];

  // Initial Parking History
  const initialHistory: ParkingHistoryRecord[] = [
    {
      ticketId: 'TKT-2391',
      vehiclePlate: 'KA-04-XY-9876',
      vehicleType: 'FOUR_WHEELER',
      slotId: 'A-06',
      zone: 'A',
      entryTime: now - 8 * hour,
      exitTime: now - 5.5 * hour,
      durationMinutes: 150,
      hourlyRate: 3.0,
      totalFee: 7.5,
      paymentMethod: 'UPI_DIGITAL',
      paymentStatus: 'PAID',
    },
    {
      ticketId: 'TKT-2392',
      vehiclePlate: 'KA-01-EE-3211',
      vehicleType: 'EV_FOUR_WHEELER',
      slotId: 'C-02',
      zone: 'C',
      entryTime: now - 7.5 * hour,
      exitTime: now - 4.2 * hour,
      durationMinutes: 198,
      hourlyRate: 4.5,
      totalFee: 14.85,
      paymentMethod: 'CARD',
      paymentStatus: 'PAID',
    },
    {
      ticketId: 'TKT-2393',
      vehiclePlate: 'DL-01-AC-1122',
      vehicleType: 'ACCESSIBLE',
      slotId: 'A-02',
      zone: 'A',
      entryTime: now - 6 * hour,
      exitTime: now - 3.8 * hour,
      durationMinutes: 132,
      hourlyRate: 2.0,
      totalFee: 4.4,
      paymentMethod: 'CAMPUS_PASS',
      paymentStatus: 'PAID',
    },
    {
      ticketId: 'TKT-2394',
      vehiclePlate: 'MH-14-BK-4040',
      vehicleType: 'TWO_WHEELER',
      slotId: 'D-04',
      zone: 'D',
      entryTime: now - 5.8 * hour,
      exitTime: now - 3.1 * hour,
      durationMinutes: 162,
      hourlyRate: 1.5,
      totalFee: 4.05,
      paymentMethod: 'UPI_DIGITAL',
      paymentStatus: 'PAID',
    },
    {
      ticketId: 'TKT-2395',
      vehiclePlate: 'TN-02-ZZ-5500',
      vehicleType: 'FOUR_WHEELER',
      slotId: 'B-02',
      zone: 'B',
      entryTime: now - 5 * hour,
      exitTime: now - 2.5 * hour,
      durationMinutes: 150,
      hourlyRate: 3.0,
      totalFee: 7.5,
      paymentMethod: 'CASH',
      paymentStatus: 'PAID',
    },
    {
      ticketId: 'TKT-2396',
      vehiclePlate: 'KA-05-MK-7171',
      vehicleType: 'FOUR_WHEELER',
      slotId: 'A-09',
      zone: 'A',
      entryTime: now - 4.5 * hour,
      exitTime: now - 1.2 * hour,
      durationMinutes: 198,
      hourlyRate: 3.0,
      totalFee: 9.9,
      paymentMethod: 'CARD',
      paymentStatus: 'PAID',
    },
  ];

  // Update baseSlots status according to tickets and reservations
  const updatedSlots = baseSlots.map((slot) => {
    // Check maintenance
    if (slot.id === 'B-06') {
      return { ...slot, status: 'MAINTENANCE' as const };
    }

    // Check active ticket
    const ticket = initialTickets.find((t) => t.slotId === slot.id);
    if (ticket) {
      return {
        ...slot,
        status: 'OCCUPIED' as const,
        currentVehiclePlate: ticket.vehiclePlate,
        currentTicketId: ticket.ticketId,
      };
    }

    // Check reservation
    const res = initialReservations.find((r) => r.slotId === slot.id && r.status === 'ACTIVE');
    if (res) {
      return {
        ...slot,
        status: 'RESERVED' as const,
        reservationId: res.reservationId,
        currentVehiclePlate: res.vehiclePlate,
      };
    }

    return slot;
  });

  return {
    slots: updatedSlots,
    activeTickets: initialTickets,
    reservations: initialReservations,
    waitingQueue: initialQueue,
    history: initialHistory,
  };
}

export function loadSavedState(): ParkingSystemState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.slots && parsed.slots.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load parking state from localStorage:', err);
  }
  const initialState = generateInitialState();
  saveState(initialState);
  return initialState;
}

export function saveState(state: ParkingSystemState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save parking state to localStorage:', err);
  }
}

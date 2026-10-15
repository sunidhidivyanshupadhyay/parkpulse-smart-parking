/**
 * Smart Parking Management System Context
 * Integrates Custom Data Structures (Queue, HashMap, MinHeap, Graph, Dijkstra)
 * with React state and LocalStorage persistence.
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  ParkingSlot,
  ActiveTicket,
  Reservation,
  QueueItem,
  ParkingHistoryRecord,
  VehicleType,
  SlotStatus,
  ZoneId,
  HOURLY_RATES,
} from '../types/parking';
import { Queue } from '../data-structures/Queue';
import { CustomHashMap } from '../data-structures/HashMap';
import { MinHeap } from '../data-structures/MinHeap';
import { parkingTopology } from '../services/parkingGraphService';
import { loadSavedState, saveState, generateInitialState, ParkingSystemState } from '../services/storageService';
import { DijkstraResult } from '../data-structures/Graph';

export interface EntryParams {
  vehiclePlate: string;
  vehicleType: VehicleType;
  driverName?: string;
  driverPhone?: string;
  entryGate: string; // 'GATE_1' | 'GATE_2'
  preferredSlotId?: string;
}

export interface ReservationParams {
  vehiclePlate: string;
  vehicleType: VehicleType;
  driverName: string;
  driverPhone: string;
  slotId: string;
  durationHours: number;
}

export interface RecommendationParams {
  vehicleType: VehicleType;
  entryGate: string;
  needsEV: boolean;
  needsAccessible: boolean;
  preferredZone?: string;
}

export interface RecommendedSlotResult {
  slot: ParkingSlot;
  dijkstra: DijkstraResult | null;
  matchScore: number;
  reason: string;
}

interface ParkingContextType {
  slots: ParkingSlot[];
  activeTickets: ActiveTicket[];
  reservations: Reservation[];
  waitingQueue: QueueItem[];
  history: ParkingHistoryRecord[];
  currentTime: number;

  // Active statistics
  totalSlots: number;
  availableCount: number;
  occupiedCount: number;
  reservedCount: number;
  maintenanceCount: number;
  occupancyRate: number;
  todayRevenue: number;

  // Real-time lookup methods
  getTicketByPlate: (plate: string) => ActiveTicket | undefined;
  getSlotById: (slotId: string) => ParkingSlot | undefined;
  isPlateCurrentlyParked: (plate: string) => boolean;

  // Core Actions
  parkVehicle: (params: EntryParams) => { success: boolean; ticket?: ActiveTicket; message: string };
  exitVehicle: (
    identifier: string, // vehiclePlate or ticketId
    paymentMethod?: 'CASH' | 'CARD' | 'UPI_DIGITAL' | 'CAMPUS_PASS'
  ) => { success: boolean; record?: ParkingHistoryRecord; message: string; waitingQueueCandidate?: QueueItem };
  reserveSlot: (params: ReservationParams) => { success: boolean; reservation?: Reservation; message: string };
  cancelReservation: (reservationId: string) => { success: boolean; message: string };
  checkInReservation: (reservationId: string, entryGate?: string) => { success: boolean; ticket?: ActiveTicket; message: string };

  // Queue Actions
  addToWaitingQueue: (params: Omit<QueueItem, 'queueId' | 'joinedAt'>) => { success: boolean; queueItem?: QueueItem; message: string };
  removeFromWaitingQueue: (queueId: string) => boolean;
  dispatchQueueVehicle: (queueId: string, slotId?: string) => { success: boolean; ticket?: ActiveTicket; message: string };

  // Slot Status Management
  toggleSlotMaintenance: (slotId: string) => { success: boolean; message: string };
  setSlotStatusManually: (
    slotId: string,
    targetStatus: SlotStatus,
    options?: {
      vehiclePlate?: string;
      vehicleType?: VehicleType;
      driverName?: string;
      forceRelease?: boolean;
    }
  ) => {
    success: boolean;
    message: string;
    requiresConfirmation?: boolean;
    parkedVehicle?: ActiveTicket;
  };

  // Recommendation & Navigation
  findBestAvailableSlot: (params: RecommendationParams) => RecommendedSlotResult | null;
  getShortestPath: (gateId: string, slotId: string) => DijkstraResult | null;

  // System Controls
  resetSystemData: () => void;
  clearAllHistory: () => void;
}

const ParkingContext = createContext<ParkingContextType | undefined>(undefined);

export const ParkingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state from local storage or mock
  const [state, setState] = useState<ParkingSystemState>(() => loadSavedState());
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Periodically refresh current time for live parking counters and timer tickers
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Save to LocalStorage whenever core state changes
  useEffect(() => {
    saveState(state);
  }, [state]);

  // 1. Data Structure: CustomHashMap for O(1) plate-to-ticket lookup
  const plateToTicketMap = useMemo(() => {
    const map = new CustomHashMap<string, ActiveTicket>(64);
    for (const ticket of state.activeTickets) {
      map.set(ticket.vehiclePlate.trim().toUpperCase(), ticket);
    }
    return map;
  }, [state.activeTickets]);

  // 2. Data Structure: CustomHashMap for O(1) slotId-to-slot lookup
  const slotMap = useMemo(() => {
    const map = new CustomHashMap<string, ParkingSlot>(64);
    for (const slot of state.slots) {
      map.set(slot.id, slot);
    }
    return map;
  }, [state.slots]);

  // 3. Data Structure: Custom FIFO Queue for waiting queue
  const fifoQueue = useMemo(() => {
    return new Queue<QueueItem>(state.waitingQueue);
  }, [state.waitingQueue]);

  // Derived statistics
  const totalSlots = state.slots.length;
  const availableCount = state.slots.filter((s) => s.status === 'AVAILABLE').length;
  const occupiedCount = state.slots.filter((s) => s.status === 'OCCUPIED').length;
  const reservedCount = state.slots.filter((s) => s.status === 'RESERVED').length;
  const maintenanceCount = state.slots.filter((s) => s.status === 'MAINTENANCE').length;
  const occupancyRate = totalSlots > 0 ? Math.round(((occupiedCount + reservedCount) / totalSlots) * 100) : 0;

  const todayRevenue = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayMs = startOfToday.getTime();

    return state.history
      .filter((h) => h.exitTime >= todayMs)
      .reduce((sum, h) => sum + h.totalFee, 0);
  }, [state.history]);

  // Lookup helpers
  const getTicketByPlate = useCallback(
    (plate: string): ActiveTicket | undefined => {
      return plateToTicketMap.get(plate.trim().toUpperCase());
    },
    [plateToTicketMap]
  );

  const getSlotById = useCallback(
    (slotId: string): ParkingSlot | undefined => {
      return slotMap.get(slotId);
    },
    [slotMap]
  );

  const isPlateCurrentlyParked = useCallback(
    (plate: string): boolean => {
      const cleanPlate = plate.trim().toUpperCase();
      return (
        plateToTicketMap.has(cleanPlate) ||
        state.reservations.some((r) => r.vehiclePlate.trim().toUpperCase() === cleanPlate && r.status === 'ACTIVE')
      );
    },
    [plateToTicketMap, state.reservations]
  );

  /**
   * Shortest path calculation via Dijkstra
   */
  const getShortestPath = useCallback((gateId: string, slotId: string): DijkstraResult | null => {
    return parkingTopology.getPathToSlot(gateId, slotId);
  }, []);

  /**
   * Smart Recommendation Algorithm using MinHeap and Dijkstra Distance
   */
  const findBestAvailableSlot = useCallback(
    (params: RecommendationParams): RecommendedSlotResult | null => {
      const availableSlots = state.slots.filter((s) => s.status === 'AVAILABLE');
      if (availableSlots.length === 0) return null;

      // Filter slots compatible with vehicle requirements
      let candidates = availableSlots;

      if (params.needsAccessible || params.vehicleType === 'ACCESSIBLE') {
        const accessibleSlots = candidates.filter((s) => s.type === 'ACCESSIBLE');
        if (accessibleSlots.length > 0) candidates = accessibleSlots;
      } else if (params.needsEV || params.vehicleType === 'EV_FOUR_WHEELER') {
        const evSlots = candidates.filter((s) => s.type === 'EV_CHARGING');
        if (evSlots.length > 0) candidates = evSlots;
      } else if (params.vehicleType === 'TWO_WHEELER') {
        const twoWheelerSlots = candidates.filter((s) => s.type === 'COMPACT_2W');
        if (twoWheelerSlots.length > 0) candidates = twoWheelerSlots;
      } else {
        // Standard 4-Wheeler prefers STANDARD_4W, avoids blocking ACCESSIBLE or EV if standard available
        const standardSlots = candidates.filter((s) => s.type === 'STANDARD_4W');
        if (standardSlots.length > 0) candidates = standardSlots;
      }

      // If user preferred a specific zone, filter or prioritize
      if (params.preferredZone && params.preferredZone !== 'ALL') {
        const zoneCandidates = candidates.filter((s) => s.zone === params.preferredZone);
        if (zoneCandidates.length > 0) {
          candidates = zoneCandidates;
        }
      }

      // MinHeap Priority Queue to find slot with the minimum driving distance from gate
      // Priority key: calculated Dijkstra shortest distance
      interface ScoredCandidate {
        slot: ParkingSlot;
        distance: number;
        dijkstra: DijkstraResult | null;
      }

      const heap = new MinHeap<ScoredCandidate>((a, b) => a.distance - b.distance);

      for (const slot of candidates) {
        const dijkstraResult = parkingTopology.getPathToSlot(params.entryGate, slot.id);
        const distance = dijkstraResult ? dijkstraResult.distance : slot.distanceToGate1;
        heap.insert({
          slot,
          distance,
          dijkstra: dijkstraResult,
        });
      }

      const best = heap.extractMin();
      if (!best) return null;

      let reason = `Optimal match: Shortest driving distance (${best.distance}m) from ${
        params.entryGate === 'GATE_1' ? 'Gate 1 (North)' : 'Gate 2 (South)'
      }`;
      if (best.slot.type === 'ACCESSIBLE') reason += ' • Reserved Accessible Space near elevator';
      else if (best.slot.type === 'EV_CHARGING') reason += ' • Fast Charging Port Included';
      else if (best.slot.type === 'COMPACT_2W') reason += ' • Designated Two-Wheeler Bay';

      return {
        slot: best.slot,
        dijkstra: best.dijkstra,
        matchScore: 98,
        reason,
      };
    },
    [state.slots]
  );

  /**
   * Vehicle Entry: Parks vehicle into assigned or recommended slot
   */
  const parkVehicle = useCallback(
    (params: EntryParams): { success: boolean; ticket?: ActiveTicket; message: string } => {
      const cleanPlate = params.vehiclePlate.trim().toUpperCase();

      if (!cleanPlate) {
        return { success: false, message: 'Vehicle registration plate number is required.' };
      }

      // Prevent duplicate entry!
      if (plateToTicketMap.has(cleanPlate)) {
        const existing = plateToTicketMap.get(cleanPlate);
        return {
          success: false,
          message: `Vehicle ${cleanPlate} is already parked inside Slot ${existing?.slotId}.`,
        };
      }

      // Find slot
      let targetSlot: ParkingSlot | undefined;
      if (params.preferredSlotId) {
        targetSlot = slotMap.get(params.preferredSlotId);
        if (!targetSlot || targetSlot.status !== 'AVAILABLE') {
          return {
            success: false,
            message: `Selected slot ${params.preferredSlotId} is not currently available.`,
          };
        }
      } else {
        // Auto-assign using recommendation algorithm
        const recommendation = findBestAvailableSlot({
          vehicleType: params.vehicleType,
          entryGate: params.entryGate,
          needsEV: params.vehicleType === 'EV_FOUR_WHEELER',
          needsAccessible: params.vehicleType === 'ACCESSIBLE',
        });

        if (!recommendation) {
          return {
            success: false,
            message: 'No suitable parking slots are available. Please add vehicle to the Waiting Queue.',
          };
        }
        targetSlot = recommendation.slot;
      }

      const rate = HOURLY_RATES[params.vehicleType] || HOURLY_RATES.FOUR_WHEELER;
      const ticketId = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;

      const newTicket: ActiveTicket = {
        ticketId,
        vehiclePlate: cleanPlate,
        vehicleType: params.vehicleType,
        driverName: params.driverName || 'Visitor',
        driverPhone: params.driverPhone || '',
        slotId: targetSlot.id,
        zone: targetSlot.zone,
        entryGate: params.entryGate,
        entryTime: Date.now(),
        hourlyRate: rate,
      };

      // Update state immutably
      setState((prev) => {
        const updatedSlots = prev.slots.map((s) => {
          if (s.id === targetSlot!.id) {
            return {
              ...s,
              status: 'OCCUPIED' as SlotStatus,
              currentVehiclePlate: cleanPlate,
              currentTicketId: ticketId,
            };
          }
          return s;
        });

        // Also remove vehicle from waiting queue if it was present
        const updatedQueue = prev.waitingQueue.filter(
          (q) => q.vehiclePlate.trim().toUpperCase() !== cleanPlate
        );

        return {
          ...prev,
          slots: updatedSlots,
          activeTickets: [newTicket, ...prev.activeTickets],
          waitingQueue: updatedQueue,
        };
      });

      return {
        success: true,
        ticket: newTicket,
        message: `Vehicle ${cleanPlate} successfully parked at Slot ${targetSlot.id}.`,
      };
    },
    [plateToTicketMap, slotMap, findBestAvailableSlot]
  );

  /**
   * Vehicle Exit: Records exit, calculates fees, frees slot, checks waiting queue
   */
  const exitVehicle = useCallback(
    (
      identifier: string,
      paymentMethod: 'CASH' | 'CARD' | 'UPI_DIGITAL' | 'CAMPUS_PASS' = 'CARD'
    ): {
      success: boolean;
      record?: ParkingHistoryRecord;
      message: string;
      waitingQueueCandidate?: QueueItem;
    } => {
      const cleanId = identifier.trim().toUpperCase();

      // Look up ticket by plate or ticketId
      let ticket: ActiveTicket | undefined = plateToTicketMap.get(cleanId);
      if (!ticket) {
        ticket = state.activeTickets.find((t) => t.ticketId === cleanId);
      }

      if (!ticket) {
        return {
          success: false,
          message: `No active parking session found for "${identifier}".`,
        };
      }

      const now = Date.now();
      const elapsedMinutes = Math.max(5, Math.round((now - ticket.entryTime) / (1000 * 60)));
      // Billing: First 15 mins free, then billed per hour (rounded up to nearest 30 mins)
      const billableHours = Math.max(0.5, Math.ceil(elapsedMinutes / 30) * 0.5);
      const totalFee = Number((billableHours * ticket.hourlyRate).toFixed(2));

      const historyRecord: ParkingHistoryRecord = {
        ticketId: ticket.ticketId,
        vehiclePlate: ticket.vehiclePlate,
        vehicleType: ticket.vehicleType,
        slotId: ticket.slotId,
        zone: ticket.zone,
        entryTime: ticket.entryTime,
        exitTime: now,
        durationMinutes: elapsedMinutes,
        hourlyRate: ticket.hourlyRate,
        totalFee,
        paymentMethod,
        paymentStatus: 'PAID',
      };

      const freedSlotId = ticket.slotId;
      const freedSlot = slotMap.get(freedSlotId);

      // Check if any vehicle in the waiting queue can take this slot
      let compatibleQueueItem: QueueItem | undefined;
      if (freedSlot) {
        for (const item of state.waitingQueue) {
          let compatible = false;
          if (freedSlot.type === 'COMPACT_2W' && item.vehicleType === 'TWO_WHEELER') compatible = true;
          else if (freedSlot.type === 'EV_CHARGING' && (item.needsEV || item.vehicleType === 'EV_FOUR_WHEELER')) compatible = true;
          else if (freedSlot.type === 'ACCESSIBLE' && (item.needsAccessible || item.vehicleType === 'ACCESSIBLE')) compatible = true;
          else if (freedSlot.type === 'STANDARD_4W' && (item.vehicleType === 'FOUR_WHEELER' || item.vehicleType === 'TWO_WHEELER')) compatible = true;

          if (compatible) {
            compatibleQueueItem = item;
            break;
          }
        }
      }

      setState((prev) => {
        const updatedSlots = prev.slots.map((s) => {
          if (s.id === freedSlotId) {
            return {
              ...s,
              status: 'AVAILABLE' as SlotStatus,
              currentVehiclePlate: undefined,
              currentTicketId: undefined,
              reservationId: undefined,
            };
          }
          return s;
        });

        const updatedTickets = prev.activeTickets.filter((t) => t.ticketId !== ticket!.ticketId);

        return {
          ...prev,
          slots: updatedSlots,
          activeTickets: updatedTickets,
          history: [historyRecord, ...prev.history],
        };
      });

      return {
        success: true,
        record: historyRecord,
        message: `Vehicle ${ticket.vehiclePlate} exited from Slot ${freedSlotId}. Total fee: $${totalFee.toFixed(2)}.`,
        waitingQueueCandidate: compatibleQueueItem,
      };
    },
    [plateToTicketMap, state.activeTickets, slotMap, state.waitingQueue]
  );

  /**
   * Reservation: Reserve a slot in advance
   */
  const reserveSlot = useCallback(
    (params: ReservationParams): { success: boolean; reservation?: Reservation; message: string } => {
      const cleanPlate = params.vehiclePlate.trim().toUpperCase();

      if (!cleanPlate) {
        return { success: false, message: 'Vehicle plate is required for reservation.' };
      }

      if (isPlateCurrentlyParked(cleanPlate)) {
        return {
          success: false,
          message: `Vehicle ${cleanPlate} already has an active parking session or reservation.`,
        };
      }

      const slot = slotMap.get(params.slotId);
      if (!slot) {
        return { success: false, message: `Slot ${params.slotId} not found.` };
      }

      if (slot.status !== 'AVAILABLE') {
        return { success: false, message: `Slot ${params.slotId} is currently ${slot.status.toLowerCase()}.` };
      }

      const now = Date.now();
      const validUntil = now + params.durationHours * 3600 * 1000;
      const reservationId = `RES-${Math.floor(1000 + Math.random() * 9000)}`;

      const newReservation: Reservation = {
        reservationId,
        vehiclePlate: cleanPlate,
        vehicleType: params.vehicleType,
        driverName: params.driverName || 'Valued Guest',
        driverPhone: params.driverPhone,
        slotId: slot.id,
        zone: slot.zone,
        reservedAt: now,
        validUntil,
        status: 'ACTIVE',
      };

      setState((prev) => {
        const updatedSlots = prev.slots.map((s) => {
          if (s.id === slot.id) {
            return {
              ...s,
              status: 'RESERVED' as SlotStatus,
              reservationId,
              currentVehiclePlate: cleanPlate,
            };
          }
          return s;
        });

        return {
          ...prev,
          slots: updatedSlots,
          reservations: [newReservation, ...prev.reservations],
        };
      });

      return {
        success: true,
        reservation: newReservation,
        message: `Slot ${slot.id} reserved successfully for ${cleanPlate}.`,
      };
    },
    [isPlateCurrentlyParked, slotMap]
  );

  /**
   * Cancel Reservation
   */
  const cancelReservation = useCallback((reservationId: string): { success: boolean; message: string } => {
    let targetReservation: Reservation | undefined;

    setState((prev) => {
      targetReservation = prev.reservations.find((r) => r.reservationId === reservationId);
      if (!targetReservation) return prev;

      const updatedReservations = prev.reservations.map((r) =>
        r.reservationId === reservationId ? { ...r, status: 'CANCELLED' as const } : r
      );

      const updatedSlots = prev.slots.map((s) => {
        if (s.id === targetReservation!.slotId && s.status === 'RESERVED') {
          return {
            ...s,
            status: 'AVAILABLE' as SlotStatus,
            reservationId: undefined,
            currentVehiclePlate: undefined,
          };
        }
        return s;
      });

      return {
        ...prev,
        slots: updatedSlots,
        reservations: updatedReservations,
      };
    });

    if (!targetReservation) {
      return { success: false, message: 'Reservation not found.' };
    }

    return {
      success: true,
      message: `Reservation ${reservationId} cancelled. Slot ${targetReservation.slotId} is now available.`,
    };
  }, []);

  /**
   * Check in an active reservation to parked vehicle
   */
  const checkInReservation = useCallback(
    (
      reservationId: string,
      entryGate: string = 'GATE_1'
    ): { success: boolean; ticket?: ActiveTicket; message: string } => {
      const reservation = state.reservations.find((r) => r.reservationId === reservationId && r.status === 'ACTIVE');
      if (!reservation) {
        return { success: false, message: 'Active reservation not found.' };
      }

      const rate = HOURLY_RATES[reservation.vehicleType] || HOURLY_RATES.FOUR_WHEELER;
      const ticketId = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;

      const newTicket: ActiveTicket = {
        ticketId,
        vehiclePlate: reservation.vehiclePlate,
        vehicleType: reservation.vehicleType,
        driverName: reservation.driverName,
        driverPhone: reservation.driverPhone,
        slotId: reservation.slotId,
        zone: reservation.zone,
        entryGate,
        entryTime: Date.now(),
        hourlyRate: rate,
      };

      setState((prev) => {
        const updatedReservations = prev.reservations.map((r) =>
          r.reservationId === reservationId ? { ...r, status: 'CHECKED_IN' as const } : r
        );

        const updatedSlots = prev.slots.map((s) => {
          if (s.id === reservation.slotId) {
            return {
              ...s,
              status: 'OCCUPIED' as SlotStatus,
              currentTicketId: ticketId,
              currentVehiclePlate: reservation.vehiclePlate,
              reservationId: undefined,
            };
          }
          return s;
        });

        return {
          ...prev,
          reservations: updatedReservations,
          slots: updatedSlots,
          activeTickets: [newTicket, ...prev.activeTickets],
        };
      });

      return {
        success: true,
        ticket: newTicket,
        message: `Reservation checked in. Ticket issued for Slot ${reservation.slotId}.`,
      };
    },
    [state.reservations]
  );

  /**
   * Waiting Queue: Add item using Queue ADT
   */
  const addToWaitingQueue = useCallback(
    (params: Omit<QueueItem, 'queueId' | 'joinedAt'>): { success: boolean; queueItem?: QueueItem; message: string } => {
      const cleanPlate = params.vehiclePlate.trim().toUpperCase();

      if (!cleanPlate) {
        return { success: false, message: 'Vehicle plate is required.' };
      }

      if (isPlateCurrentlyParked(cleanPlate)) {
        return { success: false, message: `Vehicle ${cleanPlate} is already parked or reserved.` };
      }

      if (state.waitingQueue.some((q) => q.vehiclePlate.trim().toUpperCase() === cleanPlate)) {
        return { success: false, message: `Vehicle ${cleanPlate} is already in the waiting queue.` };
      }

      const queueItem: QueueItem = {
        ...params,
        vehiclePlate: cleanPlate,
        queueId: `Q-${Math.floor(100 + Math.random() * 900)}`,
        joinedAt: Date.now(),
      };

      // Add to Queue ADT
      fifoQueue.enqueue(queueItem);

      setState((prev) => ({
        ...prev,
        waitingQueue: [...prev.waitingQueue, queueItem],
      }));

      return {
        success: true,
        queueItem,
        message: `Vehicle ${cleanPlate} added to the Waiting Queue (Position #${state.waitingQueue.length + 1}).`,
      };
    },
    [isPlateCurrentlyParked, state.waitingQueue, fifoQueue]
  );

  const removeFromWaitingQueue = useCallback((queueId: string): boolean => {
    let removed = false;
    setState((prev) => {
      const nextQueue = prev.waitingQueue.filter((q) => q.queueId !== queueId);
      if (nextQueue.length !== prev.waitingQueue.length) {
        removed = true;
      }
      return {
        ...prev,
        waitingQueue: nextQueue,
      };
    });
    return removed;
  }, []);

  /**
   * Dispatch vehicle from Waiting Queue to available slot
   */
  const dispatchQueueVehicle = useCallback(
    (queueId: string, slotId?: string): { success: boolean; ticket?: ActiveTicket; message: string } => {
      const queueItem = state.waitingQueue.find((q) => q.queueId === queueId);
      if (!queueItem) {
        return { success: false, message: 'Queue item not found.' };
      }

      // Find compatible slot
      let targetSlot: ParkingSlot | undefined;
      if (slotId) {
        targetSlot = slotMap.get(slotId);
        if (!targetSlot || targetSlot.status !== 'AVAILABLE') {
          return { success: false, message: `Slot ${slotId} is not available.` };
        }
      } else {
        const recommendation = findBestAvailableSlot({
          vehicleType: queueItem.vehicleType,
          entryGate: queueItem.preferredGate || 'GATE_1',
          needsEV: queueItem.needsEV,
          needsAccessible: queueItem.needsAccessible,
        });
        if (!recommendation) {
          return {
            success: false,
            message: 'No suitable slot is currently available for this vehicle.',
          };
        }
        targetSlot = recommendation.slot;
      }

      // Park vehicle
      const result = parkVehicle({
        vehiclePlate: queueItem.vehiclePlate,
        vehicleType: queueItem.vehicleType,
        driverName: queueItem.driverName,
        driverPhone: queueItem.driverPhone,
        entryGate: queueItem.preferredGate || 'GATE_1',
        preferredSlotId: targetSlot.id,
      });

      if (result.success) {
        removeFromWaitingQueue(queueId);
      }

      return result;
    },
    [state.waitingQueue, slotMap, findBestAvailableSlot, parkVehicle, removeFromWaitingQueue]
  );

  /**
   * Slot Maintenance Toggle
   */
  const toggleSlotMaintenance = useCallback(
    (slotId: string): { success: boolean; message: string } => {
      const slot = slotMap.get(slotId);
      if (!slot) return { success: false, message: 'Slot not found.' };

      if (slot.status === 'OCCUPIED' || slot.status === 'RESERVED') {
        return {
          success: false,
          message: `Cannot change status: Slot ${slotId} is currently ${slot.status.toLowerCase()}.`,
        };
      }

      const newStatus: SlotStatus = slot.status === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE';

      setState((prev) => ({
        ...prev,
        slots: prev.slots.map((s) => (s.id === slotId ? { ...s, status: newStatus } : s)),
      }));

      return {
        success: true,
        message: `Slot ${slotId} marked as ${newStatus.toLowerCase()}.`,
      };
    },
    [slotMap]
  );

  /**
   * Manually Update Parking Space Status with strict business rule validation
   */
  const setSlotStatusManually = useCallback(
    (
      slotId: string,
      targetStatus: SlotStatus,
      options?: {
        vehiclePlate?: string;
        vehicleType?: VehicleType;
        driverName?: string;
        forceRelease?: boolean;
      }
    ): {
      success: boolean;
      message: string;
      requiresConfirmation?: boolean;
      parkedVehicle?: ActiveTicket;
    } => {
      const slot = slotMap.get(slotId);
      if (!slot) return { success: false, message: `Parking bay ${slotId} not found.` };

      if (slot.status === targetStatus) {
        return { success: true, message: `Bay ${slotId} is already marked as ${targetStatus.toLowerCase()}.` };
      }

      // TARGET: AVAILABLE
      if (targetStatus === 'AVAILABLE') {
        if (slot.status === 'OCCUPIED') {
          const ticket = state.activeTickets.find((t) => t.slotId === slotId);
          if (!options?.forceRelease) {
            return {
              success: false,
              message: `Vehicle ${slot.currentVehiclePlate || ticket?.vehiclePlate || 'Unknown'} is currently parked in bay ${slotId}. Marking it available directly without checkout is prohibited to prevent invalid parking states.`,
              requiresConfirmation: true,
              parkedVehicle: ticket,
            };
          }
          // If forceRelease confirmed: checkout the vehicle cleanly
          if (ticket) {
            exitVehicle(ticket.ticketId);
            return {
              success: true,
              message: `Vehicle ${ticket.vehiclePlate} checked out and bay ${slotId} is now Available.`,
            };
          }
        } else if (slot.status === 'RESERVED') {
          if (slot.reservationId) {
            cancelReservation(slot.reservationId);
            return {
              success: true,
              message: `Reservation on bay ${slotId} cancelled. Bay is now Available.`,
            };
          }
        }

        // From MAINTENANCE or clean state
        setState((prev) => ({
          ...prev,
          slots: prev.slots.map((s) =>
            s.id === slotId
              ? {
                  ...s,
                  status: 'AVAILABLE' as SlotStatus,
                  currentVehiclePlate: undefined,
                  currentTicketId: undefined,
                  reservationId: undefined,
                }
              : s
          ),
        }));
        return { success: true, message: `Bay ${slotId} marked as Available.` };
      }

      // TARGET: OCCUPIED
      if (targetStatus === 'OCCUPIED') {
        if (slot.status === 'MAINTENANCE') {
          return {
            success: false,
            message: `Bay ${slotId} is under maintenance. Mark as Available first before parking.`,
          };
        }
        if (slot.status === 'RESERVED' && !options?.forceRelease) {
          return {
            success: false,
            message: `Bay ${slotId} has an active reservation. Check-in the reservation or cancel it first.`,
          };
        }

        let plate = options?.vehiclePlate?.trim().toUpperCase();
        if (!plate) {
          plate = `FAC-${slotId.replace('-', '')}-${Math.floor(10 + Math.random() * 90)}`;
        }

        if (isPlateCurrentlyParked(plate)) {
          return {
            success: false,
            message: `Vehicle ${plate} is already registered as parked or reserved. Duplicates are prevented.`,
          };
        }

        const parkRes = parkVehicle({
          vehiclePlate: plate,
          vehicleType:
            options?.vehicleType ||
            (slot.type === 'COMPACT_2W'
              ? 'TWO_WHEELER'
              : slot.type === 'EV_CHARGING'
              ? 'EV_FOUR_WHEELER'
              : slot.type === 'ACCESSIBLE'
              ? 'ACCESSIBLE'
              : 'FOUR_WHEELER'),
          driverName: options?.driverName || 'Manual Entry',
          entryGate: 'GATE_1',
          preferredSlotId: slotId,
        });

        return parkRes;
      }

      // TARGET: RESERVED
      if (targetStatus === 'RESERVED') {
        if (slot.status === 'OCCUPIED') {
          return {
            success: false,
            message: `Cannot reserve bay ${slotId}: A vehicle is currently parked there.`,
          };
        }
        if (slot.status === 'MAINTENANCE') {
          return {
            success: false,
            message: `Cannot reserve bay ${slotId}: Space is currently under maintenance.`,
          };
        }

        const plate = options?.vehiclePlate?.trim().toUpperCase() || `RES-${slotId.replace('-', '')}`;
        if (isPlateCurrentlyParked(plate)) {
          return {
            success: false,
            message: `Vehicle ${plate} already has an active session or reservation.`,
          };
        }

        const reserveRes = reserveSlot({
          slotId,
          vehiclePlate: plate,
          vehicleType: options?.vehicleType || 'FOUR_WHEELER',
          driverName: options?.driverName || 'Reserved Guest',
          driverPhone: '',
          durationHours: 2,
        });
        return reserveRes;
      }

      // TARGET: MAINTENANCE
      if (targetStatus === 'MAINTENANCE') {
        if (slot.status === 'OCCUPIED') {
          return {
            success: false,
            message: `Cannot mark bay ${slotId} for maintenance while vehicle ${slot.currentVehiclePlate} is parked. Process checkout first.`,
          };
        }
        if (slot.status === 'RESERVED') {
          return {
            success: false,
            message: `Cannot mark bay ${slotId} for maintenance while an active reservation exists. Cancel reservation first.`,
          };
        }

        setState((prev) => ({
          ...prev,
          slots: prev.slots.map((s) => (s.id === slotId ? { ...s, status: 'MAINTENANCE' as SlotStatus } : s)),
        }));
        return { success: true, message: `Bay ${slotId} marked for Maintenance.` };
      }

      return { success: false, message: 'Invalid target status requested.' };
    },
    [slotMap, state.activeTickets, exitVehicle, cancelReservation, isPlateCurrentlyParked, parkVehicle, reserveSlot]
  );

  /**
   * Reset system data to default initial state
   */
  const resetSystemData = useCallback(() => {
    const fresh = generateInitialState();
    setState(fresh);
    saveState(fresh);
  }, []);

  const clearAllHistory = useCallback(() => {
    setState((prev) => ({
      ...prev,
      history: [],
    }));
  }, []);

  const value = {
    slots: state.slots,
    activeTickets: state.activeTickets,
    reservations: state.reservations,
    waitingQueue: state.waitingQueue,
    history: state.history,
    currentTime,
    totalSlots,
    availableCount,
    occupiedCount,
    reservedCount,
    maintenanceCount,
    occupancyRate,
    todayRevenue,
    getTicketByPlate,
    getSlotById,
    isPlateCurrentlyParked,
    parkVehicle,
    exitVehicle,
    reserveSlot,
    cancelReservation,
    checkInReservation,
    addToWaitingQueue,
    removeFromWaitingQueue,
    dispatchQueueVehicle,
    toggleSlotMaintenance,
    setSlotStatusManually,
    findBestAvailableSlot,
    getShortestPath,
    resetSystemData,
    clearAllHistory,
  };

  return <ParkingContext.Provider value={value}>{children}</ParkingContext.Provider>;
};

export const useParking = (): ParkingContextType => {
  const context = useContext(ParkingContext);
  if (!context) {
    throw new Error('useParking must be used within a ParkingProvider');
  }
  return context;
};

/**
 * Parking Lot Graph & Topology Service
 * Initializes the physical graph network of gates, access ramps, driving lanes,
 * and 48 parking slots across 4 zones with real distances.
 */

import { ParkingGraph, GraphNode } from '../data-structures/Graph';
import { ParkingSlot, SlotType, ZoneId } from '../types/parking';

export class ParkingTopologyService {
  private graph: ParkingGraph;
  private defaultSlots: ParkingSlot[] = [];

  constructor() {
    this.graph = new ParkingGraph();
    this.initializeTopology();
  }

  private initializeTopology(): void {
    // 1. Entrance Gates
    this.graph.addNode({
      id: 'GATE_1',
      name: 'Gate 1 (North Main)',
      type: 'gate',
      x: 10,
      y: 15,
      level: 0,
    });

    this.graph.addNode({
      id: 'GATE_2',
      name: 'Gate 2 (South Express)',
      type: 'gate',
      x: 10,
      y: 85,
      level: 0,
    });

    // 2. Intersections & Junctions
    this.graph.addNode({
      id: 'JUNC_NORTH',
      name: 'North Entry Rotunda',
      type: 'junction',
      x: 25,
      y: 20,
      level: 0,
    });

    this.graph.addNode({
      id: 'JUNC_SOUTH',
      name: 'South Entry Rotunda',
      type: 'junction',
      x: 25,
      y: 80,
      level: 0,
    });

    this.graph.addNode({
      id: 'MAIN_LANE_G',
      name: 'Central Ground Spine',
      type: 'lane',
      x: 35,
      y: 50,
      level: 0,
    });

    this.graph.addNode({
      id: 'RAMP_L1',
      name: 'East Ramp to Level 1',
      type: 'ramp',
      x: 50,
      y: 50,
      level: 1,
    });

    this.graph.addNode({
      id: 'RAMP_L2',
      name: 'Spiral Ramp to Level 2',
      type: 'ramp',
      x: 65,
      y: 50,
      level: 2,
    });

    // Connect Gates to Junctions
    this.graph.addEdge('GATE_1', 'JUNC_NORTH', 20, 'Enter through Gate 1 North Barrier');
    this.graph.addEdge('GATE_2', 'JUNC_SOUTH', 22, 'Enter through Gate 2 South Barrier');
    this.graph.addEdge('JUNC_NORTH', 'MAIN_LANE_G', 35, 'Proceed down Central North Spine');
    this.graph.addEdge('JUNC_SOUTH', 'MAIN_LANE_G', 35, 'Proceed down Central South Spine');
    this.graph.addEdge('MAIN_LANE_G', 'RAMP_L1', 25, 'Take Ramp Up to Level 1 Deck');
    this.graph.addEdge('RAMP_L1', 'RAMP_L2', 30, 'Continue along spiral ramp up to Level 2');

    // 3. Zone Lanes
    this.graph.addNode({ id: 'LANE_A', name: 'Lane A (North Wing)', type: 'lane', x: 40, y: 18, level: 0 });
    this.graph.addNode({ id: 'LANE_B', name: 'Lane B (South Courtyard)', type: 'lane', x: 40, y: 82, level: 0 });
    this.graph.addNode({ id: 'LANE_C', name: 'Lane C (Level 1 EV Hub)', type: 'lane', x: 65, y: 35, level: 1 });
    this.graph.addNode({ id: 'LANE_D', name: 'Lane D (Level 2 Rooftop)', type: 'lane', x: 80, y: 35, level: 2 });

    this.graph.addEdge('JUNC_NORTH', 'LANE_A', 15, 'Turn right into Lane A');
    this.graph.addEdge('JUNC_SOUTH', 'LANE_B', 15, 'Turn left into Lane B');
    this.graph.addEdge('RAMP_L1', 'LANE_C', 20, 'Merge onto Level 1 EV Concourse');
    this.graph.addEdge('RAMP_L2', 'LANE_D', 20, 'Merge onto Level 2 Rooftop Deck');

    // 4. Generate 48 Slots across Zones A, B, C, D
    const zones: { zone: ZoneId; laneId: string; level: number; yBase: number }[] = [
      { zone: 'A', laneId: 'LANE_A', level: 0, yBase: 15 },
      { zone: 'B', laneId: 'LANE_B', level: 0, yBase: 75 },
      { zone: 'C', laneId: 'LANE_C', level: 1, yBase: 35 },
      { zone: 'D', laneId: 'LANE_D', level: 2, yBase: 35 },
    ];

    for (const z of zones) {
      for (let i = 1; i <= 12; i++) {
        const slotNum = i < 10 ? `0${i}` : `${i}`;
        const slotId = `${z.zone}-${slotNum}`;
        const nodeId = `SLOT_${slotId}`;

        // Determine Slot Type
        let type: SlotType = 'STANDARD_4W';
        if (z.zone === 'A') {
          if (i <= 3) type = 'ACCESSIBLE'; // A-01, A-02, A-03 near North elevator
          else if (i >= 11) type = 'EV_CHARGING'; // A-11, A-12
        } else if (z.zone === 'B') {
          if (i <= 2) type = 'ACCESSIBLE'; // B-01, B-02
          else if (i >= 10) type = 'COMPACT_2W'; // B-10, B-11, B-12
        } else if (z.zone === 'C') {
          if (i <= 8) type = 'EV_CHARGING'; // C-01 to C-08
          else type = 'STANDARD_4W';
        } else if (z.zone === 'D') {
          if (i <= 7) type = 'COMPACT_2W'; // D-01 to D-07 bikes & scooters
          else type = 'STANDARD_4W';
        }

        // Add Graph Node for slot
        const xPos = 45 + (i - 1) * 4.2;
        const yPos = z.yBase + (i % 2 === 0 ? 5 : -5);
        this.graph.addNode({
          id: nodeId,
          name: `Parking Bay ${slotId}`,
          type: 'slot',
          x: Math.min(96, xPos),
          y: yPos,
          level: z.level,
        });

        // Edge from Zone Lane to Slot with realistic distance delta (10m - 40m)
        const laneDistance = 8 + (i - 1) * 3;
        this.graph.addEdge(z.laneId, nodeId, laneDistance, `Pull into Bay ${slotId} on your ${i % 2 === 0 ? 'right' : 'left'}`);

        // We will precompute distances to Gate 1 and Gate 2
        this.defaultSlots.push({
          id: slotId,
          zone: z.zone,
          slotNumber: i,
          type,
          status: 'AVAILABLE',
          level: z.level,
          distanceToGate1: 0,
          distanceToGate2: 0,
          graphNodeId: nodeId,
        });
      }
    }

    // Precompute exact shortest paths from Gate 1 and Gate 2 for each slot
    for (const slot of this.defaultSlots) {
      const pathGate1 = this.graph.dijkstra('GATE_1', slot.graphNodeId);
      const pathGate2 = this.graph.dijkstra('GATE_2', slot.graphNodeId);
      slot.distanceToGate1 = pathGate1 ? pathGate1.distance : 100;
      slot.distanceToGate2 = pathGate2 ? pathGate2.distance : 100;
    }
  }

  public getGraph(): ParkingGraph {
    return this.graph;
  }

  public getDefaultSlots(): ParkingSlot[] {
    return JSON.parse(JSON.stringify(this.defaultSlots));
  }

  /**
   * Run Dijkstra shortest path between an entrance gate and a specific slot
   */
  public getPathToSlot(gateId: string, slotId: string) {
    const slotNodeId = `SLOT_${slotId}`;
    return this.graph.dijkstra(gateId, slotNodeId);
  }
}

export const parkingTopology = new ParkingTopologyService();

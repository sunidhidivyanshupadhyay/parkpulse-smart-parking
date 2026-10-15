/**
 * Weighted Graph & Dijkstra's Shortest Path Algorithm
 * Uses MinHeap priority queue for optimal O((V + E) log V) Dijkstra time complexity.
 * Models parking entrance gates, ramps, driving lanes, and individual parking slots.
 */

import { MinHeap } from './MinHeap';

export interface GraphNode {
  id: string;
  name: string;
  type: 'gate' | 'junction' | 'lane' | 'slot' | 'ramp' | 'elevator';
  x: number; // for visual representation (0 - 100 percentage or coordinate)
  y: number;
  level?: number;
}

export interface GraphEdge {
  target: string;
  weight: number; // distance in meters
  description: string;
}

export interface DijkstraResult {
  distance: number; // total meters
  path: string[]; // sequence of node IDs
  nodes: GraphNode[]; // sequence of graph nodes
  directions: string[]; // step-by-step turn guidance
}

export class ParkingGraph {
  private nodes: Map<string, GraphNode> = new Map();
  private adjacencyList: Map<string, GraphEdge[]> = new Map();

  constructor() {}

  /**
   * Adds a node to the graph
   */
  public addNode(node: GraphNode): void {
    this.nodes.set(node.id, node);
    if (!this.adjacencyList.has(node.id)) {
      this.adjacencyList.set(node.id, []);
    }
  }

  /**
   * Adds a bidirectional or directional edge between two nodes
   */
  public addEdge(
    source: string,
    target: string,
    weight: number,
    description: string,
    bidirectional: boolean = true
  ): void {
    if (!this.adjacencyList.has(source)) {
      this.adjacencyList.set(source, []);
    }
    this.adjacencyList.get(source)!.push({ target, weight, description });

    if (bidirectional) {
      if (!this.adjacencyList.has(target)) {
        this.adjacencyList.set(target, []);
      }
      this.adjacencyList.get(target)!.push({
        target: source,
        weight,
        description: `Return via ${description}`,
      });
    }
  }

  public getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  public getAllNodes(): GraphNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Computes the shortest driving path from startNode to targetNode using Dijkstra's Algorithm
   * Utilizes the custom MinHeap for the priority queue.
   */
  public dijkstra(startId: string, targetId: string): DijkstraResult | null {
    if (!this.nodes.has(startId) || !this.nodes.has(targetId)) {
      return null;
    }

    const distances: Map<string, number> = new Map();
    const previous: Map<string, { nodeId: string; edgeDesc: string } | null> = new Map();

    // Min-heap storing [nodeId, currentDistance]
    const pq = new MinHeap<{ id: string; dist: number }>((a, b) => a.dist - b.dist);

    // Initialize all distances to Infinity
    for (const nodeId of this.nodes.keys()) {
      if (nodeId === startId) {
        distances.set(nodeId, 0);
        pq.insert({ id: nodeId, dist: 0 });
      } else {
        distances.set(nodeId, Infinity);
      }
      previous.set(nodeId, null);
    }

    const visited = new Set<string>();

    while (!pq.isEmpty()) {
      const minItem = pq.extractMin();
      if (!minItem) break;

      const { id: u, dist: d } = minItem;

      if (visited.has(u)) continue;
      visited.add(u);

      if (u === targetId) {
        break; // Reached target
      }

      const neighbors = this.adjacencyList.get(u) || [];
      for (const edge of neighbors) {
        const v = edge.target;
        if (visited.has(v)) continue;

        const alt = d + edge.weight;
        if (alt < (distances.get(v) ?? Infinity)) {
          distances.set(v, alt);
          previous.set(v, { nodeId: u, edgeDesc: edge.description });
          pq.insert({ id: v, dist: alt });
        }
      }
    }

    const finalDistance = distances.get(targetId);
    if (finalDistance === undefined || finalDistance === Infinity) {
      return null; // unreachable
    }

    // Reconstruct path
    const pathNodeIds: string[] = [];
    const turnDirections: string[] = [];
    let curr: string | null = targetId;

    while (curr && curr !== startId) {
      pathNodeIds.unshift(curr);
      const prevInfo = previous.get(curr);
      if (prevInfo) {
        turnDirections.unshift(prevInfo.edgeDesc);
        curr = prevInfo.nodeId;
      } else {
        break;
      }
    }
    pathNodeIds.unshift(startId);

    const nodesList = pathNodeIds
      .map((id) => this.nodes.get(id))
      .filter((n): n is GraphNode => n !== undefined);

    return {
      distance: Math.round(finalDistance),
      path: pathNodeIds,
      nodes: nodesList,
      directions: turnDirections,
    };
  }
}

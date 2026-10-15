/**
 * Generic Binary Min-Heap / Priority Queue Implementation
 * Supports custom comparator function (default: numbers in ascending order).
 * Used for Dijkstra's shortest path algorithm and finding the nearest available parking slot.
 */

export class MinHeap<T> {
  private heap: T[] = [];
  private compare: (a: T, b: T) => number;

  constructor(compareFn?: (a: T, b: T) => number) {
    this.compare = compareFn || ((a: any, b: any) => (a < b ? -1 : a > b ? 1 : 0));
  }

  /**
   * Helper to get parent index
   */
  private parentIndex(i: number): number {
    return Math.floor((i - 1) / 2);
  }

  /**
   * Helper to get left child index
   */
  private leftChildIndex(i: number): number {
    return 2 * i + 1;
  }

  /**
   * Helper to get right child index
   */
  private rightChildIndex(i: number): number {
    return 2 * i + 2;
  }

  /**
   * Swaps two elements in the heap
   */
  private swap(i: number, j: number): void {
    const temp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = temp;
  }

  /**
   * Bubbles up element at index to restore min-heap invariant
   */
  private bubbleUp(index: number): void {
    let current = index;
    while (current > 0) {
      const parent = this.parentIndex(current);
      if (this.compare(this.heap[current], this.heap[parent]) < 0) {
        this.swap(current, parent);
        current = parent;
      } else {
        break;
      }
    }
  }

  /**
   * Bubbles down element at index to restore min-heap invariant
   */
  private bubbleDown(index: number): void {
    let current = index;
    const length = this.heap.length;

    while (this.leftChildIndex(current) < length) {
      let smallestChild = this.leftChildIndex(current);
      const rightChild = this.rightChildIndex(current);

      if (rightChild < length && this.compare(this.heap[rightChild], this.heap[smallestChild]) < 0) {
        smallestChild = rightChild;
      }

      if (this.compare(this.heap[smallestChild], this.heap[current]) < 0) {
        this.swap(current, smallestChild);
        current = smallestChild;
      } else {
        break;
      }
    }
  }

  /**
   * Inserts an item into the Min-Heap.
   * Time Complexity: O(log n)
   */
  public insert(item: T): void {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  /**
   * Extracts and returns the minimum item from the Min-Heap.
   * Time Complexity: O(log n)
   */
  public extractMin(): T | null {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop()!;

    const min = this.heap[0];
    this.heap[0] = this.heap.pop()!;
    this.bubbleDown(0);
    return min;
  }

  /**
   * Peeks the minimum item without removing it.
   * Time Complexity: O(1)
   */
  public peek(): T | null {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  /**
   * Returns current size of the heap.
   */
  public size(): number {
    return this.heap.length;
  }

  /**
   * Checks if the heap is empty.
   */
  public isEmpty(): boolean {
    return this.heap.length === 0;
  }

  /**
   * Returns copy of internal array.
   */
  public toArray(): T[] {
    return [...this.heap];
  }

  /**
   * Clears the heap.
   */
  public clear(): void {
    this.heap = [];
  }
}

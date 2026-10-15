/**
 * Custom Generic FIFO Queue Implementation (ADT)
 * Implemented using a Singly Linked List for true O(1) enqueue and dequeue operations.
 * Used for managing the vehicle waiting queue when parking slots are full.
 */

export interface QueueNode<T> {
  value: T;
  next: QueueNode<T> | null;
}

export class Queue<T> {
  private head: QueueNode<T> | null = null;
  private tail: QueueNode<T> | null = null;
  private count: number = 0;

  constructor(initialItems?: T[]) {
    if (initialItems && initialItems.length > 0) {
      for (const item of initialItems) {
        this.enqueue(item);
      }
    }
  }

  /**
   * Adds an element to the end of the queue.
   * Time Complexity: O(1)
   */
  public enqueue(item: T): void {
    const newNode: QueueNode<T> = { value: item, next: null };
    if (!this.tail) {
      this.head = newNode;
      this.tail = newNode;
    } else {
      this.tail.next = newNode;
      this.tail = newNode;
    }
    this.count++;
  }

  /**
   * Removes and returns the element at the front of the queue.
   * Time Complexity: O(1)
   */
  public dequeue(): T | null {
    if (!this.head) {
      return null;
    }
    const dequeuedValue = this.head.value;
    this.head = this.head.next;
    if (!this.head) {
      this.tail = null;
    }
    this.count--;
    return dequeuedValue;
  }

  /**
   * Returns the element at the front without removing it.
   * Time Complexity: O(1)
   */
  public peek(): T | null {
    return this.head ? this.head.value : null;
  }

  /**
   * Returns the current number of elements in the queue.
   */
  public size(): number {
    return this.count;
  }

  /**
   * Checks if the queue is empty.
   */
  public isEmpty(): boolean {
    return this.count === 0;
  }

  /**
   * Converts the queue elements to an array in FIFO order.
   * Time Complexity: O(n)
   */
  public toArray(): T[] {
    const result: T[] = [];
    let current = this.head;
    while (current) {
      result.push(current.value);
      current = current.next;
    }
    return result;
  }

  /**
   * Finds an element satisfying the predicate.
   */
  public find(predicate: (item: T) => boolean): T | null {
    let current = this.head;
    while (current) {
      if (predicate(current.value)) {
        return current.value;
      }
      current = current.next;
    }
    return null;
  }

  /**
   * Removes an element satisfying the predicate.
   * Returns true if removed, false otherwise.
   */
  public remove(predicate: (item: T) => boolean): boolean {
    if (!this.head) return false;

    if (predicate(this.head.value)) {
      this.head = this.head.next;
      if (!this.head) this.tail = null;
      this.count--;
      return true;
    }

    let current = this.head;
    while (current.next) {
      if (predicate(current.next.value)) {
        if (current.next === this.tail) {
          this.tail = current;
        }
        current.next = current.next.next;
        this.count--;
        return true;
      }
      current = current.next;
    }
    return false;
  }

  /**
   * Clears the entire queue.
   */
  public clear(): void {
    this.head = null;
    this.tail = null;
    this.count = 0;
  }
}

/**
 * Custom HashMap Implementation with Collision Resolution (Separate Chaining)
 * Uses a polynomial rolling hash function for string keys.
 * Time Complexity: Average O(1) for get, set, delete, and has.
 * Used for O(1) instant vehicle registration lookup and slot-to-vehicle indexing.
 */

interface HashEntry<K, V> {
  key: K;
  value: V;
  next: HashEntry<K, V> | null;
}

export class CustomHashMap<K, V> {
  private buckets: (HashEntry<K, V> | null)[];
  private capacity: number;
  private count: number = 0;
  private readonly loadFactorThreshold: number = 0.75;

  constructor(initialCapacity: number = 32) {
    this.capacity = initialCapacity;
    this.buckets = new Array(this.capacity).fill(null);
  }

  /**
   * Polynomial rolling hash code generator
   */
  private hash(key: K): number {
    const keyStr = String(key);
    let hashVal = 0;
    const prime = 31;
    for (let i = 0; i < keyStr.length; i++) {
      hashVal = (hashVal * prime + keyStr.charCodeAt(i)) >>> 0;
    }
    return hashVal % this.capacity;
  }

  /**
   * Resizes buckets array when load factor exceeds threshold
   */
  private resize(newCapacity: number): void {
    const oldBuckets = this.buckets;
    this.capacity = newCapacity;
    this.buckets = new Array(this.capacity).fill(null);
    this.count = 0;

    for (const head of oldBuckets) {
      let current = head;
      while (current) {
        this.set(current.key, current.value);
        current = current.next;
      }
    }
  }

  /**
   * Associates the specified value with the specified key.
   */
  public set(key: K, value: V): void {
    if ((this.count + 1) / this.capacity > this.loadFactorThreshold) {
      this.resize(this.capacity * 2);
    }

    const index = this.hash(key);
    let current = this.buckets[index];

    // Check if key already exists, update value
    while (current) {
      if (current.key === key) {
        current.value = value;
        return;
      }
      current = current.next;
    }

    // Insert new entry at the head of bucket
    const newEntry: HashEntry<K, V> = {
      key,
      value,
      next: this.buckets[index],
    };
    this.buckets[index] = newEntry;
    this.count++;
  }

  /**
   * Returns the value to which the specified key is mapped, or undefined.
   */
  public get(key: K): V | undefined {
    const index = this.hash(key);
    let current = this.buckets[index];

    while (current) {
      if (current.key === key) {
        return current.value;
      }
      current = current.next;
    }
    return undefined;
  }

  /**
   * Returns true if this map contains a mapping for the specified key.
   */
  public has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Removes the mapping for the specified key if present.
   */
  public delete(key: K): boolean {
    const index = this.hash(key);
    let current = this.buckets[index];
    let prev: HashEntry<K, V> | null = null;

    while (current) {
      if (current.key === key) {
        if (prev) {
          prev.next = current.next;
        } else {
          this.buckets[index] = current.next;
        }
        this.count--;
        return true;
      }
      prev = current;
      current = current.next;
    }
    return false;
  }

  /**
   * Number of key-value mappings in this map.
   */
  public size(): number {
    return this.count;
  }

  /**
   * Returns an array of all keys.
   */
  public keys(): K[] {
    const keyList: K[] = [];
    for (const head of this.buckets) {
      let current = head;
      while (current) {
        keyList.push(current.key);
        current = current.next;
      }
    }
    return keyList;
  }

  /**
   * Returns an array of all values.
   */
  public values(): V[] {
    const valList: V[] = [];
    for (const head of this.buckets) {
      let current = head;
      while (current) {
        valList.push(current.value);
        current = current.next;
      }
    }
    return valList;
  }

  /**
   * Returns an array of key-value pairs.
   */
  public entries(): [K, V][] {
    const entryList: [K, V][] = [];
    for (const head of this.buckets) {
      let current = head;
      while (current) {
        entryList.push([current.key, current.value]);
        current = current.next;
      }
    }
    return entryList;
  }

  /**
   * Clears the hash map.
   */
  public clear(): void {
    this.buckets = new Array(this.capacity).fill(null);
    this.count = 0;
  }
}

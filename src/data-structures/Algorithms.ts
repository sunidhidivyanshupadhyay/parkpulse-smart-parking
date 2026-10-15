/**
 * Searching and Sorting Algorithms Implementation
 * Used for searching and sorting parking records, slots, and transaction logs.
 */

/**
 * Generic Binary Search algorithm for sorted arrays.
 * Time Complexity: O(log n)
 * Returns the index if found, or -1 if not found.
 */
export function binarySearch<T>(
  sortedArr: T[],
  target: string | number,
  keyExtractor: (item: T) => string | number
): number {
  let low = 0;
  let high = sortedArr.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const midVal = keyExtractor(sortedArr[mid]);

    if (midVal === target) {
      return mid;
    } else if (midVal < target) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return -1;
}

/**
 * Generic QuickSort algorithm.
 * Time Complexity: Average O(n log n)
 * Stable in-place partitioning or functional copy.
 */
export function quickSort<T>(arr: T[], compareFn: (a: T, b: T) => number): T[] {
  if (arr.length <= 1) return [...arr];

  const pivot = arr[Math.floor(arr.length / 2)];
  const less: T[] = [];
  const equal: T[] = [];
  const greater: T[] = [];

  for (const item of arr) {
    const comp = compareFn(item, pivot);
    if (comp < 0) {
      less.push(item);
    } else if (comp > 0) {
      greater.push(item);
    } else {
      equal.push(item);
    }
  }

  return [...quickSort(less, compareFn), ...equal, ...quickSort(greater, compareFn)];
}

/**
 * Generic MergeSort algorithm.
 * Guarantees O(n log n) worst-case time complexity.
 */
export function mergeSort<T>(arr: T[], compareFn: (a: T, b: T) => number): T[] {
  if (arr.length <= 1) return [...arr];

  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid), compareFn);
  const right = mergeSort(arr.slice(mid), compareFn);

  return merge(left, right, compareFn);
}

function merge<T>(left: T[], right: T[], compareFn: (a: T, b: T) => number): T[] {
  const result: T[] = [];
  let i = 0;
  let j = 0;

  while (i < left.length && j < right.length) {
    if (compareFn(left[i], right[j]) <= 0) {
      result.push(left[i]);
      i++;
    } else {
      result.push(right[j]);
      j++;
    }
  }

  return result.concat(left.slice(i)).concat(right.slice(j));
}

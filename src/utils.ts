export const Utils = {
  Array: {
    first,
    last
  }
};

function first<T>(array: T[]): T {
  return array[0];
}

function last<T>(array: T[]): T {
  return array[array.length - 1];
}

export const Utils = {
  Array: {
    first
  }
};

function first<T>(array: T[]): T {
  return array[0];
}

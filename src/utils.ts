export const Utils = {
  Array: {
    first
  },
  Function: {
    composeLeft,
    composeRight
  }
};

function composeRight(...functions: Function[]): Function {
  const reversedFunctions = functions.slice().reverse();
  return composeLeft(...reversedFunctions);
}

function composeLeft(...functions: Function[]): Function {
  return functions.reduce((acc, func) => (...args) => func(acc(...args)), value => value);
}

function first<T>(array: T[]): T {
  return array[0];
}

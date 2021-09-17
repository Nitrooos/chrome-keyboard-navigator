export const Utils = {
  Array: {
    first
  },
  App: {
    reload: () => window.open("http://reload.extensions", "_blank")
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
  return functions.reduce(
    (acc, func) => (...args: any) => func(acc(...args)),
    (value: any) => value
  );
}

function first<T>(array: T[]): T {
  return array[0];
}

const path = require("path");

module.exports = {
  mode: "development",
  devtool: "inline-source-map",
  entry: {
    extension: "./src/extension/index.ts",
    background: "./src/background/index.ts"
  },
  output: {
    path: path.resolve(__dirname, "./build"),
    filename: "[name]-bundle.js"
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    },
    extensions: [".ts", ".tsx", ".js"],
  },
  module: {
    rules: [
      { 
        test: /\.tsx?$/,
        loader: "ts-loader"
      }
    ]
  }
};

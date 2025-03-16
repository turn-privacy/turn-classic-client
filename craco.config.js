const path = require('path');

module.exports = {
  style: {
    postcss: {
      plugins: [
        require('tailwindcss'),
        require('autoprefixer'),
      ],
    },
  },
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.experiments = {
        asyncWebAssembly: true,
        topLevelAwait: true,
        layers: true,
      };

      webpackConfig.output = {
        ...webpackConfig.output,
        environment: {
          ...webpackConfig.output?.environment,
          asyncFunction: true,
        },
      };

      webpackConfig.resolve = {
        ...webpackConfig.resolve,
        fallback: {
          "stream": require.resolve("stream-browserify"),
          "buffer": require.resolve("buffer/"),
          "crypto": require.resolve("crypto-browserify"),
          "process": require.resolve("process/browser"),
          "path": require.resolve("path-browserify"),
          "fs": false
        },
      };

      webpackConfig.module.rules.push({
        test: /\.wasm$/,
        type: "webassembly/async",
      });

      return webpackConfig;
    },
  },
};

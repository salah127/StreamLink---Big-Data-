module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Required for the optional-chaining syntax used by React Native web
      '@babel/plugin-transform-optional-chaining',
      // Required for the nullish-coalescing syntax
      '@babel/plugin-transform-nullish-coalescing-operator',
    ],
  };
};
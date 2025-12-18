const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot, {
  isCSSEnabled: true,
});

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

config.resolver.alias = {
  ...config.resolver.alias,
  '@streamlink/ui': path.resolve(workspaceRoot, 'packages/ui'),
  '@streamlink/config': path.resolve(workspaceRoot, 'packages/config/src'),
  punycode: 'punycode/punycode.js',
  'inline-style-prefixer/lib/createPrefixer': path.resolve(
    workspaceRoot,
    'node_modules/inline-style-prefixer/lib/createPrefixer.js'
  ),
  'inline-style-prefixer': path.resolve(workspaceRoot, 'node_modules/inline-style-prefixer'),
  'event-target-shim': path.resolve(
    workspaceRoot,
    'node_modules/event-target-shim/dist/event-target-shim.js'
  ),
};

config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: false,
    },
  }),
};

const defaultSourceExts = config.resolver.sourceExts ?? [];
config.resolver.sourceExts = Array.from(new Set([...defaultSourceExts, 'cjs', 'mjs', 'css']));

const defaultAssetExts = config.resolver.assetExts ?? [];
config.resolver.assetExts = Array.from(
  new Set([...defaultAssetExts, 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ttf', 'otf', 'woff', 'woff2'])
);

module.exports = config;

// Learn more https://docs.expo.dev/guides/customizing-metro
// React Native 0.73+ requires extending @react-native/metro-config
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Optimize Metro bundling - prevent loading unnecessary external modules
config.resolver = {
  ...config.resolver,
  // Only include iOS and Android platforms (exclude web and generic native)
  platforms: ['ios', 'android'],
  // Add support for additional file extensions
  sourceExts: [...(config.resolver?.sourceExts || []), 'mjs', 'cjs'],
  // Blocklist unused modules to prevent them from being bundled
  blockList: [
    // Block unused native modules that might be autolinked
    /.*\/node_modules\/react-native-maps\/.*/,
    /.*\/node_modules\/expo-symbols\/.*/,
  ],
};

// Optimize transformer for better tree-shaking and minification
config.transformer = {
  ...config.transformer,
  // Enable aggressive minification in production builds
  minifierConfig: {
    keep_classnames: false,
    keep_fnames: false,
    mangle: {
      keep_classnames: false,
      keep_fnames: false,
    },
  },
  // Enable inline requires for better code splitting
  inlineRequires: true,
};

// Expo's getDefaultConfig already extends @react-native/metro-config internally
// This satisfies React Native 0.73+ requirements
// Metro automatically excludes web-only modules from native builds via platform resolution
module.exports = config;


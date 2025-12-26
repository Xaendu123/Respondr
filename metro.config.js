// Learn more https://docs.expo.dev/guides/customizing-metro
// React Native 0.73+ requires extending @react-native/metro-config
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Simplified config for Expo Go compatibility
// Only include iOS and Android platforms
config.resolver = {
  ...config.resolver,
  platforms: ['ios', 'android'],
  sourceExts: [...(config.resolver?.sourceExts || []), 'mjs', 'cjs'],
};

// Simplified transformer config (remove aggressive minification for dev)
config.transformer = {
  ...config.transformer,
  inlineRequires: true,
};

// Expo's getDefaultConfig already extends @react-native/metro-config internally
// This satisfies React Native 0.73+ requirements
module.exports = config;


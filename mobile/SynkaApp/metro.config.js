const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  cacheStores: [],
  fileMapCacheDirectory: path.join(__dirname, '.metro-cache'),
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);

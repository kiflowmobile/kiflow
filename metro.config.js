const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Configure SVG transformer
const svgTransformer = require.resolve('react-native-svg-transformer');

config.transformer = {
  ...config.transformer,
  babelTransformerPath: svgTransformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

config.resolver = {
  ...config.resolver,
  assetExts: config.resolver.assetExts.filter((ext) => ext !== 'svg'),
  sourceExts: [...config.resolver.sourceExts, 'svg', 'css'],
};

// Apply NativeWind transformer
module.exports = withNativeWind(config, { input: './global.css' });

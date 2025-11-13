import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  name: config?.name || 'MoveMates',
  slug: config?.slug || 'movemates',

  plugins: [
    'expo-font',
    '@maplibre/maplibre-react-native',
  ],

  extra: {
    ...config?.extra,
    ORS_API_KEY: process.env.ORS_API_KEY,
  },
});

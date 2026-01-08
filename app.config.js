import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  name: config?.name || 'MoveMates',
  slug: config?.slug || 'movemates',
  icon: config?.icon || './assets/icon.png',
  
  // 👇 Add this block (Expo plugin registration)
  plugins: [
    ...(config?.plugins || []),
    'expo-font',
    [
      '@rnmapbox/maps',
      {
        RNMapboxMapsDownloadToken:
          process.env.MAPBOX_DOWNLOADS_TOKEN || process.env.EAS_SECRET_MAPBOX_DOWNLOADS_TOKEN || '',
      },
    ],
  ],

  extra: {
    ...config?.extra,
    // Use environment variable if available, otherwise fall back to app.json value
    ORS_API_KEY: process.env.ORS_API_KEY || config?.extra?.ORS_API_KEY,
    MAPBOX_ACCESS_TOKEN:
      process.env.MAPBOX_ACCESS_TOKEN || process.env.EAS_SECRET_MAPBOX_ACCESS_TOKEN || config?.extra?.MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoibW92ZW1hdGVzMDciLCJhIjoiY21pNTgybnduMDBzZzJqc2R4bXpjOXVpaiJ9.vkJgkPFEn68kmLvjbOg-_A',
  },

  android: {
    ...(config?.android || {}),
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FFFFFF',
    },
    permissions: [
      'INTERNET',
      'ACCESS_NETWORK_STATE',
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
    ],
    usesCleartextTraffic: false,
  },
});

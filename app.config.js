import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  name: config?.name || 'MoveMates',
  slug: config?.slug || 'movemates',
  
  // 👇 Add this block (Expo plugin registration)
  plugins: [
    'expo-font'
  ],

  extra: {
    ...config?.extra,
    ORS_API_KEY: process.env.ORS_API_KEY,
  },
});

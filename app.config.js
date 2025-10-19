import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  name: config?.name || 'MoveMates',
  slug: config?.slug || 'movemates',
  extra: {
    ...config?.extra,
    ORS_API_KEY: process.env.ORS_API_KEY,
  },
});

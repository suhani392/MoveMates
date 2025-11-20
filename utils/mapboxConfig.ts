import Mapbox from '@rnmapbox/maps';
import Constants from 'expo-constants';

// Initialize Mapbox with access token
const MAPBOX_ACCESS_TOKEN = Constants.expoConfig?.extra?.MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoibW92ZW1hdGVzMDciLCJhIjoiY21pNTgybnduMDBzZzJqc2R4bXpjOXVpaiJ9.vkJgkPFEn68kmLvjbOg-_Anp';

if (MAPBOX_ACCESS_TOKEN) {
  Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);
} else {
  console.warn('Mapbox access token not found. Please set MAPBOX_ACCESS_TOKEN in app.config.js or environment variables.');
}

export default Mapbox;


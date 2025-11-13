import { NativeModules, Platform } from 'react-native';

export interface LatLng {
  latitude: number;
  longitude: number;
}

export const MAP_DEFAULT_CENTER: LatLng = {
  latitude: 20.5937,
  longitude: 78.9629,
};

export const MAP_DEFAULT_ZOOM = 12;
export const MAP_STYLE_URL = 'https://demotiles.maplibre.org/style.json';

export const isMapLibreSupported =
  Platform.OS !== 'web' && !!NativeModules?.MLRNModule;

export const toPosition = (coordinate: LatLng): [number, number] => [
  coordinate.longitude,
  coordinate.latitude,
];

export const buildLineStringFeatureCollection = (coordinates: LatLng[]) => {
  if (coordinates.length < 2) {
    return null;
  }

  return {
    type: 'FeatureCollection' as const,
    features: [
      {
        type: 'Feature' as const,
        id: 'route',
        properties: {},
        geometry: {
          type: 'LineString' as const,
          coordinates: coordinates.map(toPosition),
        },
      },
    ],
  };
};

export const calculateBounds = (coordinates: LatLng[]) => {
  if (!coordinates.length) {
    return null;
  }

  let minLat = coordinates[0].latitude;
  let maxLat = coordinates[0].latitude;
  let minLon = coordinates[0].longitude;
  let maxLon = coordinates[0].longitude;

  coordinates.forEach(({ latitude, longitude }) => {
    minLat = Math.min(minLat, latitude);
    maxLat = Math.max(maxLat, latitude);
    minLon = Math.min(minLon, longitude);
    maxLon = Math.max(maxLon, longitude);
  });

  const northEast: [number, number] = [maxLon, maxLat];
  const southWest: [number, number] = [minLon, minLat];

  return {
    northEast,
    southWest,
  };
};



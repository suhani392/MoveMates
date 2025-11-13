import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

type MapFallbackProps = {
  title?: string;
  message?: string;
};

const MapFallback: React.FC<MapFallbackProps> = ({
  title = 'Map unavailable',
  message = 'Install the MoveMates development build or production app to see the map.',
}) => (
  <View style={styles.container}>
    <MaterialIcons name="map" size={40} color="#555" />
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.message}>{message}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    backgroundColor: '#F5F5DC',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  message: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
  },
});

export default MapFallback;


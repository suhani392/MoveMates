import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const GetStartedScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome to MoveMates!</Text>
      <Text style={styles.subText}>This is your main app screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 10,
  },
  subText: {
    fontSize: 16,
    color: '#666666',
  },
});

export default GetStartedScreen;

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';

type RemovedUserScreenProps = {
  navigation: StackNavigationProp<any>;
};

const RemovedUserScreen: React.FC<RemovedUserScreenProps> = ({ navigation }) => {
  const { userData } = useAuth();
  const reason = (userData as any)?.removedReason || 'Your account has been removed by an administrator.';

  const handleOk = async () => {
    await authService.signOut();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Your account has been removed</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Reason provided by admin</Text>
          <Text style={styles.cardText}>{reason}</Text>
        </View>
        <TouchableOpacity style={styles.button} onPress={handleOk}>
          <Text style={styles.buttonText}>OK</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 20,
    flexGrow: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#E98181',
    borderRadius: 12,
    padding: 18,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 15,
    color: '#000000',
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#000000',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default RemovedUserScreen;

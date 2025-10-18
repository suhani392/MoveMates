import React from 'react';
import { View, Image, StyleSheet, SafeAreaView, TouchableOpacity, Text } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

type ProfilePhotoParams = {
  ProfilePhoto: { name: string; photoUrl: string };
};

type Props = {
  navigation: StackNavigationProp<any>;
  route: RouteProp<ProfilePhotoParams, 'ProfilePhoto'>;
};

const ProfilePhotoScreen: React.FC<Props> = ({ navigation, route }) => {
  const { name, photoUrl } = route.params || { name: 'User', photoUrl: '' };
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{name}</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.body}>
        {!!photoUrl && (
          <Image source={{ uri: photoUrl }} style={styles.image} resizeMode="contain" />)
        }
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0,0,0,0.6)'
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
});

export default ProfilePhotoScreen;

import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, FlatList, NativeScrollEvent, NativeSyntheticEvent, Image } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

type OnboardingScreenProps = {
  navigation: StackNavigationProp<any>;
};

const { width } = Dimensions.get('window');

const onboardingData = [
  {
    id: '1',
    image: require('../assets/heart.png'),
    backgroundColor: '#F2DAF4',
    title: 'Stay Healthy Together',
    description: 'Join a community of health-conscious individuals who believe in the power of walking for physical and mental wellness.',
  },
  {
    id: '2',
    image: require('../assets/deal.png'),
    backgroundColor: '#E8F6E9',
    title: 'Find Walking Partners',
    description: 'Connect with verified walkers in your area. Whether you need motivation or companionship, find the perfect walking buddy.',
  },
  {
    id: '3',
    image: require('../assets/verified.png'),
    backgroundColor: '#D9DFF7',
    title: 'Safe & Secure',
    description: 'All walkers are verified with background checks. Track your walks with GPS and emergency features for complete peace of mind.',
  },
];

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setCurrentIndex(index);
  };

  const handleNext = async () => {
    if (currentIndex < onboardingData.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      try {
        await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      } catch (error) {
        console.error('Error saving onboarding status:', error);
      }
      navigation.navigate('SignUp');
    }
  };

  const handleSkip = () => {
    flatListRef.current?.scrollToIndex({ index: 2, animated: true });
  };

  const renderItem = ({ item }: { item: typeof onboardingData[0] }) => (
    <View style={styles.slide}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: item.backgroundColor }]}>
          <Image 
            source={item.image} 
            style={styles.iconImage}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.skipButton} 
          onPress={handleSkip}
          activeOpacity={currentIndex < 2 ? 0.7 : 1}
          disabled={currentIndex >= 2}
        >
          {currentIndex < 2 && <Text style={styles.skipText}>Skip</Text>}
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
      />

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {onboardingData.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex && styles.activeDot,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {currentIndex === onboardingData.length - 1 ? 'Get Started' : 'Next >>'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    height: 40,
    paddingHorizontal: 20,
  },
  skipButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 12,
    height: 40,
    justifyContent: 'center',
  },
  skipText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '400',
  },
  slide: {
    width: width,
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  iconImage: {
    width: 80,
    height: 80,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: '#000000',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  pagination: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D3D3D3',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#000000',
    width: 24,
  },
  nextButton: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    paddingHorizontal: 80,
    borderRadius: 30,
    width: width - 80,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OnboardingScreen;
